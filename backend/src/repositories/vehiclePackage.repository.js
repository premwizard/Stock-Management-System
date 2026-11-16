import { query } from '../config/database.js';

export class VehiclePackageRepository {
  /**
   * Find package by exact name (case-insensitive) for duplicate name validation
   */
  static async findByName(name, excludeId = null) {
    let sql = 'SELECT id, name FROM vehicle_packages WHERE LOWER(name) = LOWER($1)';
    const params = [name.trim()];
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Find single package by ID with fully hydrated components and live inventory balances
   */
  static async findById(id, client = null) {
    const runner = client ? client.query.bind(client) : query;

    const packageSql = `
      SELECT 
        vp.id,
        vp.name,
        vp.description,
        vp.is_active,
        vp.created_at,
        vp.updated_at,
        COUNT(vpi.id)::int AS item_count,
        COALESCE(SUM(vpi.required_quantity), 0)::int AS total_parts_quantity
      FROM vehicle_packages vp
      LEFT JOIN vehicle_package_items vpi ON vp.id = vpi.package_id
      WHERE vp.id = $1
      GROUP BY vp.id;
    `;
    const pkgRes = await runner(packageSql, [id]);
    if (pkgRes.rows.length === 0) return null;

    const pkg = pkgRes.rows[0];

    const itemsSql = `
      SELECT 
        vpi.id AS item_id,
        vpi.package_id,
        vpi.product_id,
        vpi.required_quantity,
        vpi.created_at,
        vpi.updated_at,
        p.name AS product_name,
        p.sku,
        p.brand,
        p.unit,
        p.image_url,
        p.minimum_stock,
        p.is_active AS product_is_active,
        c.name AS category_name,
        COALESCE(i.quantity, 0)::int AS available_quantity,
        CASE 
          WHEN COALESCE(i.quantity, 0) = 0 THEN 'out_of_stock'
          WHEN COALESCE(i.quantity, 0) <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status,
        CASE
          WHEN vpi.required_quantity > 0 THEN FLOOR(COALESCE(i.quantity, 0) / vpi.required_quantity)::int
          ELSE 0
        END AS max_packages_fulfillable
      FROM vehicle_package_items vpi
      INNER JOIN products p ON vpi.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE vpi.package_id = $1
      ORDER BY p.name ASC;
    `;
    const itemsRes = await runner(itemsSql, [id]);
    pkg.items = itemsRes.rows;

    return pkg;
  }

  /**
   * Find paginated list of vehicle packages with search and status filters
   */
  static async findAll({ page = 1, limit = 20, search, isActive }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (isActive !== undefined) {
      conditions.push(`vp.is_active = $${paramIdx}`);
      params.push(isActive);
      paramIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        vp.name ILIKE $${paramIdx} 
        OR vp.description ILIKE $${paramIdx}
        OR EXISTS (
          SELECT 1 FROM vehicle_package_items vpi2
          JOIN products p2 ON vpi2.product_id = p2.id
          WHERE vpi2.package_id = vp.id AND (p2.name ILIKE $${paramIdx} OR p2.sku ILIKE $${paramIdx})
        )
      )`);
      params.push(`%${search.trim()}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM vehicle_packages vp ${whereClause};`;
    const countRes = await query(countSql, params);
    const totalItems = countRes.rows[0]?.total || 0;

    const dataSql = `
      SELECT 
        vp.id,
        vp.name,
        vp.description,
        vp.is_active,
        vp.created_at,
        vp.updated_at,
        COUNT(vpi.id)::int AS item_count,
        COALESCE(SUM(vpi.required_quantity), 0)::int AS total_parts_quantity,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'productId', p.id,
              'name', p.name,
              'sku', p.sku,
              'unit', p.unit,
              'imageUrl', p.image_url,
              'requiredQuantity', vpi.required_quantity,
              'availableQuantity', COALESCE(i.quantity, 0)
            ) ORDER BY vpi.required_quantity DESC
          ) FILTER (WHERE vpi.id IS NOT NULL),
          '[]'::json
        ) AS preview_items
      FROM vehicle_packages vp
      LEFT JOIN vehicle_package_items vpi ON vp.id = vpi.package_id
      LEFT JOIN products p ON vpi.product_id = p.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      GROUP BY vp.id
      ORDER BY vp.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
    `;
    params.push(limit, offset);

    const dataRes = await query(dataSql, params);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      packages: dataRes.rows,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages
      }
    };
  }

  /**
   * Create a new vehicle package with its components in a transaction
   */
  static async create(client, { name, description, isActive = true, items }) {
    const pkgSql = `
      INSERT INTO vehicle_packages (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const pkgRes = await client.query(pkgSql, [
      name.trim(),
      description ? description.trim() : null,
      isActive
    ]);
    const pkg = pkgRes.rows[0];

    if (items && items.length > 0) {
      const itemValues = [];
      const itemParams = [];
      let pIdx = 1;

      items.forEach((item) => {
        itemValues.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2})`);
        itemParams.push(pkg.id, item.productId, Number(item.requiredQuantity));
        pIdx += 3;
      });

      const itemsSql = `
        INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
        VALUES ${itemValues.join(', ')};
      `;
      await client.query(itemsSql, itemParams);
    }

    return pkg;
  }

  /**
   * Update a vehicle package and its components
   */
  static async update(client, id, { name, description, isActive, items }) {
    const updates = [];
    const params = [id];
    let pIdx = 2;

    if (name !== undefined) {
      updates.push(`name = $${pIdx}`);
      params.push(name.trim());
      pIdx++;
    }

    if (description !== undefined) {
      updates.push(`description = $${pIdx}`);
      params.push(description ? description.trim() : null);
      pIdx++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${pIdx}`);
      params.push(isActive);
      pIdx++;
    }

    if (updates.length > 0) {
      const sql = `
        UPDATE vehicle_packages
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *;
      `;
      await client.query(sql, params);
    }

    // Replace items if provided
    if (items !== undefined && Array.isArray(items)) {
      await client.query('DELETE FROM vehicle_package_items WHERE package_id = $1', [id]);

      if (items.length > 0) {
        const itemValues = [];
        const itemParams = [];
        let itemPIdx = 1;

        items.forEach((item) => {
          itemValues.push(`($${itemPIdx}, $${itemPIdx + 1}, $${itemPIdx + 2})`);
          itemParams.push(id, item.productId, Number(item.requiredQuantity));
          itemPIdx += 3;
        });

        const insertItemsSql = `
          INSERT INTO vehicle_package_items (package_id, product_id, required_quantity)
          VALUES ${itemValues.join(', ')};
        `;
        await client.query(insertItemsSql, itemParams);
      }
    }

    return await this.findById(id, client);
  }

  /**
   * Delete a vehicle package (cascades to items)
   */
  static async delete(id, client = null) {
    const runner = client ? client.query.bind(client) : query;
    const sql = 'DELETE FROM vehicle_packages WHERE id = $1 RETURNING id, name;';
    const res = await runner(sql, [id]);
    return res.rows[0] || null;
  }
}
