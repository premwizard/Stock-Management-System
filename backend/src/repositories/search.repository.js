import { query } from '../config/database.js';

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

    const whereClause = filterConditions.join(' AND ');

    // Relevance scoring for search term ranking in filtered_matches subquery
    let orderClause = 'ORDER BY name ASC';
    if (cleanedSearch) {
      values.push(cleanedSearch);
      const exactParamIdx = values.length;
      values.push(`${cleanedSearch}%`);
      const prefixParamIdx = values.length;

      orderClause = `
        ORDER BY 
          CASE 
            WHEN LOWER(sku) = LOWER($${exactParamIdx}) THEN 1
            WHEN sku ILIKE $${prefixParamIdx} THEN 2
            WHEN LOWER(name) = LOWER($${exactParamIdx}) THEN 3
            WHEN name ILIKE $${prefixParamIdx} THEN 4
            WHEN LOWER(brand) = LOWER($${exactParamIdx}) THEN 5
            ELSE 6
          END ASC,
          name ASC
      `;
    }

    values.push(limit);
    const limitParamIdx = values.length;
    values.push(offset);
    const offsetParamIdx = values.length;

    const sql = `
      WITH filtered_matches AS (
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.brand,
          p.description,
          p.unit,
          p.image_url,
          p.minimum_stock,
          c.id AS category_id,
          c.name AS category,
          COALESCE(i.quantity, 0) AS quantity,
          CASE 
            WHEN i.quantity = 0 THEN 'out_of_stock'
            WHEN i.quantity <= p.minimum_stock THEN 'low_stock'
            ELSE 'in_stock'
          END AS stock_status
        FROM products p
        INNER JOIN categories c ON p.category_id = c.id
        INNER JOIN inventory i ON p.id = i.product_id
        WHERE ${whereClause}
      ),
      aggregate_totals AS (
        SELECT 
          COUNT(*)::INTEGER AS total_products,
          COALESCE(SUM(quantity), 0)::BIGINT AS total_stock_units
        FROM filtered_matches
      )
      SELECT 
        COALESCE((SELECT total_products FROM aggregate_totals), 0) AS total_products,
        COALESCE((SELECT total_stock_units FROM aggregate_totals), 0) AS total_stock_units,
        COALESCE(
          json_agg(p_slice) FILTER (WHERE p_slice.id IS NOT NULL), 
          '[]'::json
        ) AS products
      FROM (
        SELECT * 
        FROM filtered_matches
        ${orderClause}
        LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
      ) p_slice;
    `;

    const res = await query(sql, values);
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    const row = res.rows[0] || { total_products: 0, total_stock_units: 0, products: [] };
    const totalProducts = Number(row.total_products) || 0;
    const totalStockUnits = Number(row.total_stock_units) || 0;
    const products = Array.isArray(row.products) ? row.products : [];
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    return {
      query: cleanedSearch,
      totalProducts,
      totalStockUnits,
      products,
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalPages,
        executionTimeMs
      }
    };
  }
}
