import { query, isDatabaseAvailable } from '../config/database.js';
import { mockStore } from '../database/mockStore.js';

export class ProductRepository {
  /**
   * Find paginated products with joined category and inventory
   */
  static async findAll({
    page = 1,
    limit = 20,
    category,
    brand,
    status = 'all',
    search,
    sort = 'created_at',
    order = 'desc'
  }) {
    if (!isDatabaseAvailable()) {
      return mockStore.getAllProducts({ page, limit, category, brand, status, search, sort, order });
    }

    const offset = (page - 1) * limit;
    const conditions = ['p.is_active = true'];
    const values = [];

    // Filter by Category (UUID or Category Name)
    if (category) {
      values.push(category);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        conditions.push(`p.category_id = $${values.length}`);
      } else {
        conditions.push(`LOWER(c.name) = LOWER($${values.length})`);
      }
    }

    // Filter by Brand
    if (brand) {
      values.push(brand);
      conditions.push(`LOWER(p.brand) = LOWER($${values.length})`);
    }

    // Filter by Stock Status
    if (status === 'out_of_stock') {
      conditions.push('i.quantity = 0');
    } else if (status === 'low_stock') {
      conditions.push('i.quantity > 0 AND i.quantity <= p.minimum_stock');
    } else if (status === 'in_stock') {
      conditions.push('i.quantity > p.minimum_stock');
    }

    // Keyword Search filter
    if (search) {
      values.push(`%${search.trim()}%`);
      const searchParamIdx = values.length;
      conditions.push(`(
        p.name ILIKE $${searchParamIdx} OR
        p.sku ILIKE $${searchParamIdx} OR
        p.brand ILIKE $${searchParamIdx} OR
        c.name ILIKE $${searchParamIdx}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort column mapping
    const sortFieldMap = {
      name: 'p.name',
      sku: 'p.sku',
      created_at: 'p.created_at',
      brand: 'p.brand',
      quantity: 'i.quantity'
    };

    const sortField = sortFieldMap[sort] || 'p.created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // 1. Total matching count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN inventory i ON p.id = i.product_id
      ${whereClause};
    `;
    const countRes = await query(countSql, values);
    const totalItems = countRes.rows[0]?.total || 0;

    // 2. Paginated data slice
    const dataSql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.brand,
        p.description,
        p.unit,
        p.image_url,
        p.minimum_stock,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.id AS category_id,
        c.name AS category,
        c.name AS category_name,
        COALESCE(i.quantity, 0) AS quantity,
        CASE
          WHEN i.quantity = 0 THEN 'out_of_stock'
          WHEN i.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;

    values.push(limit, offset);
    const dataRes = await query(dataSql, values);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      products: dataRes.rows,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages
      }
    };
  }

  /**
   * Find product by ID
   */
  static async findById(id) {
    if (!isDatabaseAvailable()) {
      return mockStore.getProductById(id);
    }

    const sql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.brand,
        p.description,
        p.unit,
        p.image_url,
        p.minimum_stock,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(i.quantity, 0) AS quantity,
        CASE
          WHEN i.quantity = 0 THEN 'out_of_stock'
          WHEN i.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find product by SKU
   */
  static async findBySku(sku) {
    if (!isDatabaseAvailable()) {
      return mockStore.getProductBySku(sku);
    }

    const res = await query('SELECT id, name, sku FROM products WHERE LOWER(sku) = LOWER($1)', [sku]);
    return res.rows[0] || null;
  }

  /**
   * Create a product and initialize inventory in a transaction
   */
  static async createWithInventory(client, {
    name,
    sku,
    categoryId,
    brand,
    description,
    unit,
    imageUrl,
    minimumStock,
    initialStock = 0
  }) {
    if (!isDatabaseAvailable()) {
      return mockStore.createProduct({
        name,
        sku,
        categoryId,
        brand,
        description,
        unit,
        imageUrl,
        minimumStock,
        initialStock
      });
    }

    // 1. Insert product
    const prodRes = await client.query(
      `
      INSERT INTO products (
        name, sku, category_id, brand, description, unit, image_url, minimum_stock
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, sku, category_id, brand, description, unit, image_url, minimum_stock, is_active, created_at, updated_at;
    `,
      [name, sku, categoryId, brand || 'Generic', description || '', unit || 'pcs', imageUrl || '', minimumStock]
    );

    const product = prodRes.rows[0];

    // 2. Insert inventory
    const invRes = await client.query(
      `
      INSERT INTO inventory (product_id, quantity)
      VALUES ($1, $2)
      RETURNING quantity;
    `,
      [product.id, initialStock]
    );

    const quantity = invRes.rows[0].quantity;

    // 3. Record movement if initialStock > 0
    if (initialStock > 0) {
      await client.query(
        `
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, previous_quantity, new_quantity, reason
        )
        VALUES ($1, 'IN', $2, 0, $2, 'Initial product creation inventory stock');
      `,
        [product.id, initialStock]
      );
    }

    return {
      ...product,
      quantity,
      stockStatus: quantity === 0 ? 'out_of_stock' : quantity <= minimumStock ? 'low_stock' : 'in_stock'
    };
  }

  /**
   * Update product metadata
   */
  static async update(id, {
    name,
    categoryId,
    brand,
    description,
    unit,
    imageUrl,
    minimumStock,
    isActive
  }) {
    if (!isDatabaseAvailable()) {
      return mockStore.updateProduct(id, {
        name,
        categoryId,
        brand,
        description,
        unit,
        imageUrl,
        minimumStock,
        isActive
      });
    }

    const res = await query(
      `
      UPDATE products
      SET 
        name = COALESCE($2, name),
        category_id = COALESCE($3, category_id),
        brand = COALESCE($4, brand),
        description = COALESCE($5, description),
        unit = COALESCE($6, unit),
        image_url = COALESCE($7, image_url),
        minimum_stock = COALESCE($8, minimum_stock),
        is_active = COALESCE($9, is_active)
      WHERE id = $1
      RETURNING id;
    `,
      [id, name, categoryId, brand, description, unit, imageUrl, minimumStock, isActive]
    );

    if (res.rows.length === 0) return null;
    return this.findById(id);
  }

  /**
   * Delete product and its associated records cleanly in a transaction
   */
  static async delete(id) {
    if (!isDatabaseAvailable()) {
      return mockStore.deleteProduct(id);
    }

    const { getClient } = await import('../config/database.js');
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM stock_movements WHERE product_id = $1', [id]);
      await client.query('DELETE FROM inventory WHERE product_id = $1', [id]);
      const res = await client.query(
        'DELETE FROM products WHERE id = $1 RETURNING id, name, sku',
        [id]
      );
      await client.query('COMMIT');
      return res.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Find products by category ID
   */
  static async findByCategoryId(categoryId) {
    if (!isDatabaseAvailable()) {
      return mockStore.products
        .filter((p) => p.category_id === categoryId && p.is_active)
        .map((p) => ({
          ...p,
          quantity: mockStore.inventory.get(p.id)?.quantity || 0
        }));
    }

    const sql = `
      SELECT 
        p.id, p.name, p.sku, p.brand, p.unit, p.minimum_stock,
        COALESCE(i.quantity, 0) AS quantity
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE p.category_id = $1 AND p.is_active = true
      ORDER BY p.name ASC;
    `;
    const res = await query(sql, [categoryId]);
    return res.rows;
  }
}
