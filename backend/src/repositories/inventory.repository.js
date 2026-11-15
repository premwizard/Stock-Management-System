import { query } from '../config/database.js';

export class InventoryRepository {
  /**
   * List paginated inventory with stock status
   */
  static async findAll({
    page = 1,
    limit = 20,
    category,
    status = 'all',
    search,
    sort = 'updated_at',
    order = 'desc'
  }) {
    const offset = (page - 1) * limit;
    const conditions = ['p.is_active = true'];
    const values = [];

    // Filter by Category
    if (category) {
      values.push(category);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        conditions.push(`p.category_id = $${values.length}`);
      } else {
        conditions.push(`LOWER(c.name) = LOWER($${values.length})`);
      }
    }

    // Filter by Stock Status
    if (status === 'out_of_stock') {
      conditions.push('i.quantity = 0');
    } else if (status === 'low_stock') {
      conditions.push('i.quantity > 0 AND i.quantity <= p.minimum_stock');
    } else if (status === 'in_stock') {
      conditions.push('i.quantity > p.minimum_stock');
    }

    // Search filter
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

    const whereClause = conditions.join(' AND ');

    // Sort column mapping
    const sortFieldMap = {
      name: 'p.name',
      sku: 'p.sku',
      quantity: 'i.quantity',
      updated_at: 'i.updated_at'
    };
    const sortColumn = sortFieldMap[sort] || 'i.updated_at';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Total Count Query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause};
    `;
    const countRes = await query(countSql, values);
    const totalItems = countRes.rows[0]?.total || 0;

    // 2. Data Retrieval Query
    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const dataSql = `
      SELECT 
        i.id AS inventory_id,
        i.product_id,
        i.quantity,
        i.updated_at,
        p.name AS product_name,
        p.sku,
        p.brand,
        p.unit,
        p.image_url,
        p.minimum_stock,
        c.id AS category_id,
        c.name AS category_name,
        CASE
          WHEN i.quantity = 0 THEN 'out_of_stock'
          WHEN i.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const dataRes = await query(dataSql, values);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: dataRes.rows,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages
      }
    };
  }

  /**
   * Find inventory by product ID, with optional row-level lock (FOR UPDATE)
   */
  static async findByProductId(productId, client = null, forUpdate = false) {
    const lockClause = forUpdate ? 'FOR UPDATE' : '';
    const sql = `
      SELECT 
        i.id AS inventory_id,
        i.product_id,
        i.quantity,
        i.updated_at,
        p.name AS product_name,
        p.sku,
        p.brand,
        p.unit,
        p.image_url,
        p.minimum_stock,
        p.is_active,
        c.id AS category_id,
        c.name AS category_name,
        CASE
          WHEN i.quantity = 0 THEN 'out_of_stock'
          WHEN i.quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE i.product_id = $1
      ${lockClause};
    `;
    const executor = client || { query };
    const res = await executor.query(sql, [productId]);
    return res.rows[0] || null;
  }

  /**
   * Update stock quantity within an active transaction
   */
  static async updateQuantity(client, productId, newQuantity) {
    const res = await client.query(
      `
      UPDATE inventory
      SET 
        quantity = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING id, product_id, quantity, updated_at;
    `,
      [productId, newQuantity]
    );
    return res.rows[0];
  }

  /**
   * Record a stock movement within an active transaction
   */
  static async recordMovement(client, {
    productId,
    movementType,
    quantity,
    previousQuantity,
    newQuantity,
    reason
  }) {
    const res = await client.query(
      `
      INSERT INTO stock_movements (
        product_id, movement_type, quantity, previous_quantity, new_quantity, reason
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, product_id, movement_type, quantity, previous_quantity, new_quantity, reason, created_at;
    `,
      [productId, movementType, quantity, previousQuantity, newQuantity, reason]
    );
    return res.rows[0];
  }

  /**
   * List paginated stock movements with joined product and category details
   */
  static async findMovements({
    page = 1,
    limit = 20,
    productId,
    movementType,
    startDate,
    endDate
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (productId) {
      values.push(productId);
      conditions.push(`sm.product_id = $${values.length}`);
    }

    if (movementType) {
      values.push(movementType);
      conditions.push(`sm.movement_type = $${values.length}`);
    }

    if (startDate) {
      values.push(startDate);
      conditions.push(`sm.created_at >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`sm.created_at <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countSql = `SELECT COUNT(*)::int AS total FROM stock_movements sm ${whereClause};`;
    const countRes = await query(countSql, values);
    const totalItems = countRes.rows[0]?.total || 0;

    // Data
    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const dataSql = `
      SELECT 
        sm.id,
        sm.product_id,
        sm.movement_type,
        sm.quantity,
        sm.previous_quantity,
        sm.new_quantity,
        sm.reason,
        sm.created_at,
        p.name AS product_name,
        p.sku,
        p.brand,
        p.unit,
        c.name AS category_name
      FROM stock_movements sm
      INNER JOIN products p ON sm.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const dataRes = await query(dataSql, values);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      movements: dataRes.rows,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages
      }
    };
  }

  /**
   * Find recent movements for a specific product
   */
  static async findMovementsByProductId(productId, limit = 10) {
    const sql = `
      SELECT 
        sm.id,
        sm.movement_type,
        sm.quantity,
        sm.previous_quantity,
        sm.new_quantity,
        sm.reason,
        sm.created_at
      FROM stock_movements sm
      WHERE sm.product_id = $1
      ORDER BY sm.created_at DESC
      LIMIT $2;
    `;
    const res = await query(sql, [productId, limit]);
    return res.rows;
  }
}
