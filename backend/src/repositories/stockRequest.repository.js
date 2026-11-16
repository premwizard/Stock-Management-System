import { query, isDatabaseAvailable } from '../config/database.js';
import { mockStore } from '../database/mockStore.js';

export class StockRequestRepository {
  /**
   * Generate unique human-readable request number (e.g. REQ-20261115-4819)
   */
  static async generateRequestNumber(client = null) {
    if (!isDatabaseAvailable()) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      return `REQ-${dateStr}-${randomSuffix}`;
    }

    const executor = client || { query };
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let unique = false;
    let requestNumber = '';

    while (!unique) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      requestNumber = `REQ-${dateStr}-${randomSuffix}`;
      const checkRes = await executor.query(
        'SELECT id FROM stock_requests WHERE request_number = $1',
        [requestNumber]
      );
      if (checkRes.rows.length === 0) {
        unique = true;
      }
    }

    return requestNumber;
  }

  /**
   * Create a draft stock request with line items within a client transaction
   */
  static async create(client, { requestNumber, notes, items }) {
    if (!isDatabaseAvailable()) {
      return mockStore.createStockRequest({ notes, items });
    }

    const totalItems = items.length;
    const totalQuantity = items.reduce((acc, curr) => acc + Number(curr.requestedQuantity), 0);

    // 1. Insert master record
    const requestInsertSql = `
      INSERT INTO stock_requests (
        request_number, status, notes, total_items, total_quantity
      )
      VALUES ($1, 'DRAFT', $2, $3, $4)
      RETURNING *;
    `;
    const requestRes = await client.query(requestInsertSql, [
      requestNumber,
      notes || null,
      totalItems,
      totalQuantity
    ]);
    const createdRequest = requestRes.rows[0];

    // 2. Insert line items
    const insertedItems = [];
    for (const item of items) {
      const itemInsertSql = `
        INSERT INTO stock_request_items (
          request_id, product_id, requested_quantity
        )
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const itemRes = await client.query(itemInsertSql, [
        createdRequest.id,
        item.productId,
        item.requestedQuantity
      ]);
      insertedItems.push(itemRes.rows[0]);
    }

    return {
      ...createdRequest,
      items: insertedItems
    };
  }

  /**
   * List paginated stock requests with status and keyword filters
   */
  static async findAll({
    page = 1,
    limit = 20,
    status = 'all',
    search
  }) {
    if (!isDatabaseAvailable()) {
      return mockStore.getStockRequests({ page, limit, status, search });
    }

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Filter by status
    if (status && status !== 'all') {
      values.push(status.toUpperCase());
      conditions.push(`status = $${values.length}`);
    }

    // Search filter (request number or notes)
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const searchIdx = values.length;
      conditions.push(`(request_number ILIKE $${searchIdx} OR notes ILIKE $${searchIdx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM stock_requests
      ${whereClause};
    `;
    const countRes = await query(countSql, values);
    const totalItems = countRes.rows[0]?.total || 0;

    // Data query
    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const dataSql = `
      SELECT 
        id,
        request_number,
        status,
        notes,
        total_items,
        total_quantity,
        created_at,
        updated_at,
        confirmed_at
      FROM stock_requests
      ${whereClause}
      ORDER BY created_at DESC
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
   * Find request by ID with joined item details, catalog attributes, and current inventory
   */
  static async findById(id, client = null) {
    if (!isDatabaseAvailable()) {
      return mockStore.getStockRequestById(id);
    }

    const executor = client || { query };

    const requestSql = `
      SELECT *
      FROM stock_requests
      WHERE id = $1;
    `;
    const requestRes = await executor.query(requestSql, [id]);
    const request = requestRes.rows[0];

    if (!request) return null;

    const itemsSql = `
      SELECT 
        sri.id AS item_id,
        sri.request_id,
        sri.product_id,
        sri.requested_quantity,
        sri.available_quantity_at_confirmation,
        sri.created_at,
        sri.updated_at,
        p.name AS product_name,
        p.sku,
        p.brand,
        p.unit,
        p.image_url,
        p.minimum_stock,
        p.is_active,
        c.name AS category_name,
        COALESCE(i.quantity, 0) AS current_available_quantity,
        CASE
          WHEN COALESCE(i.quantity, 0) = 0 THEN 'out_of_stock'
          WHEN COALESCE(i.quantity, 0) <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS current_stock_status
      FROM stock_request_items sri
      INNER JOIN products p ON sri.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE sri.request_id = $1
      ORDER BY p.name ASC;
    `;
    const itemsRes = await executor.query(itemsSql, [id]);

    return {
      ...request,
      items: itemsRes.rows
    };
  }

  /**
   * Acquire exclusive row-level lock on a stock request row (FOR UPDATE)
   */
  static async findForUpdate(client, id) {
    const sql = `
      SELECT *
      FROM stock_requests
      WHERE id = $1
      FOR UPDATE;
    `;
    const res = await client.query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Lock inventory rows deterministically in ascending product_id order to eliminate deadlocks
   */
  static async lockAndValidateInventory(client, productIds) {
    const sql = `
      SELECT 
        i.id AS inventory_id,
        i.product_id,
        i.quantity,
        p.name AS product_name,
        p.sku,
        p.unit,
        p.is_active
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      WHERE i.product_id = ANY($1::uuid[])
      ORDER BY i.product_id ASC
      FOR UPDATE;
    `;
    const res = await client.query(sql, [productIds]);
    return res.rows;
  }

  /**
   * Update items in an existing draft request
   */
  static async updateDraft(client, id, { notes, items }) {
    if (!isDatabaseAvailable()) {
      return mockStore.updateStockRequest(id, { notes, items });
    }

    const totalItems = items.length;
    const totalQuantity = items.reduce((acc, curr) => acc + Number(curr.requestedQuantity), 0);

    // Delete existing items
    await client.query('DELETE FROM stock_request_items WHERE request_id = $1', [id]);

    // Insert replacement items
    const insertedItems = [];
    for (const item of items) {
      const itemRes = await client.query(
        `
        INSERT INTO stock_request_items (
          request_id, product_id, requested_quantity
        )
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
        [id, item.productId, item.requestedQuantity]
      );
      insertedItems.push(itemRes.rows[0]);
    }

    // Update master totals and notes
    const updateSql = `
      UPDATE stock_requests
      SET 
        notes = $2,
        total_items = $3,
        total_quantity = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const updateRes = await client.query(updateSql, [id, notes || null, totalItems, totalQuantity]);

    return {
      ...updateRes.rows[0],
      items: insertedItems
    };
  }

  /**
   * Record snapshot of available quantity at confirmation for a line item
   */
  static async updateItemConfirmationSnapshot(client, itemId, availableQty) {
    await client.query(
      `
      UPDATE stock_request_items
      SET available_quantity_at_confirmation = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `,
      [itemId, availableQty]
    );
  }

  /**
   * Transition request status to CONFIRMED
   */
  static async setConfirmed(client, id) {
    if (!isDatabaseAvailable()) {
      return mockStore.confirmStockRequest(id);
    }

    const res = await client.query(
      `
      UPDATE stock_requests
      SET 
        status = 'CONFIRMED',
        confirmed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `,
      [id]
    );
    return res.rows[0];
  }

  /**
   * Transition request status to CANCELLED
   */
  static async setCancelled(client, id) {
    if (!isDatabaseAvailable()) {
      return mockStore.cancelStockRequest(id);
    }

    const res = await client.query(
      `
      UPDATE stock_requests
      SET 
        status = 'CANCELLED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `,
      [id]
    );
    return res.rows[0];
  }
}

