import { query, isDatabaseAvailable } from '../config/database.js';
import { mockStore } from '../database/mockStore.js';

export class SearchRepository {
  /**
   * High-performance Smart Inventory Search
   * Executes in a single SQL round-trip calculating both the paginated products
   * and the global matching aggregates (totalProducts, totalStockUnits) directly in PostgreSQL.
   */
  static async searchProducts({
    searchTerm = '',
    category,
    brand,
    status = 'all',
    page = 1,
    limit = 20
  }) {
    if (!isDatabaseAvailable()) {
      return mockStore.searchProducts({ searchTerm, category, brand, status, page, limit });
    }

    const startTime = performance.now();
    const offset = (page - 1) * limit;
    const values = [];
    const filterConditions = ['p.is_active = true'];

    // 1. Search term condition (case-insensitive substring match)
    const cleanedSearch = searchTerm.trim();
    if (cleanedSearch) {
      values.push(`%${cleanedSearch}%`);
      const searchParamIdx = values.length;
      filterConditions.push(`(
        p.name ILIKE $${searchParamIdx} OR
        p.sku ILIKE $${searchParamIdx} OR
        p.brand ILIKE $${searchParamIdx} OR
        p.description ILIKE $${searchParamIdx} OR
        c.name ILIKE $${searchParamIdx}
      )`);
    }

    // 2. Category filter (UUID or category name)
    if (category) {
      values.push(category);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        filterConditions.push(`p.category_id = $${values.length}`);
      } else {
        filterConditions.push(`LOWER(c.name) = LOWER($${values.length})`);
      }
    }

    // 3. Brand filter
    if (brand) {
      values.push(brand);
      filterConditions.push(`LOWER(p.brand) = LOWER($${values.length})`);
    }

    // 4. Stock status filter
    if (status === 'out_of_stock') {
      filterConditions.push('i.quantity = 0');
    } else if (status === 'low_stock') {
      filterConditions.push('i.quantity > 0 AND i.quantity <= p.minimum_stock');
    } else if (status === 'in_stock') {
      filterConditions.push('i.quantity > p.minimum_stock');
    }

    const whereClause = `WHERE ${filterConditions.join(' AND ')}`;

    // 5. Unified Query with Window Functions
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
        END AS stock_status,
        COUNT(*) OVER() AS total_products,
        COALESCE(SUM(i.quantity) OVER(), 0) AS total_stock_units
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN LOWER(p.sku) = LOWER($${values.length + 1}) THEN 1
          WHEN LOWER(p.name) = LOWER($${values.length + 1}) THEN 2
          ELSE 3
        END,
        p.created_at DESC
      LIMIT $${values.length + 2} OFFSET $${values.length + 3};
    `;

    values.push(cleanedSearch, limit, offset);

    const res = await query(sql, values);
    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

    const totalProducts = res.rows.length > 0 ? Number(res.rows[0].total_products) : 0;
    const totalStockUnits = res.rows.length > 0 ? Number(res.rows[0].total_stock_units) : 0;
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    const products = res.rows.map((row) => {
      const { total_products: _total_products, total_stock_units: _total_stock_units, ...productData } = row;
      return {
        ...productData,
        category: productData.category_name,
        quantity: Number(productData.quantity)
      };
    });

    return {
      products,
      totalProducts,
      totalStockUnits,
      query: searchTerm,
      executionTimeMs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    };
  }
}
