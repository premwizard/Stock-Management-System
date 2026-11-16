import { query, isDatabaseAvailable } from '../config/database.js';
import { mockStore } from '../database/mockStore.js';

export class DashboardRepository {
  /**
   * Get high-level KPI counts and summary statistics in a single aggregated SQL query
   */
  static async getSummary() {
    if (!isDatabaseAvailable()) {
      return mockStore.getDashboardSummary();
    }

    const sql = `
      SELECT 
        (SELECT COUNT(*)::int FROM products WHERE is_active = true) AS total_products,
        (SELECT COUNT(*)::int FROM categories) AS total_categories,
        (SELECT COALESCE(SUM(quantity), 0)::bigint FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.is_active = true) AS total_stock_units,
        (SELECT COUNT(*)::int FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.is_active = true AND i.quantity > p.minimum_stock) AS in_stock_count,
        (SELECT COUNT(*)::int FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.is_active = true AND i.quantity <= p.minimum_stock AND i.quantity > 0) AS low_stock_count,
        (SELECT COUNT(*)::int FROM inventory i JOIN products p ON i.product_id = p.id WHERE p.is_active = true AND i.quantity = 0) AS out_of_stock_count;
    `;
    const res = await query(sql);
    const row = res.rows[0];
    return {
      totalProducts: Number(row.total_products) || 0,
      totalCategories: Number(row.total_categories) || 0,
      totalStockUnits: Number(row.total_stock_units) || 0,
      inStockCount: Number(row.in_stock_count) || 0,
      lowStockCount: Number(row.low_stock_count) || 0,
      outOfStockCount: Number(row.out_of_stock_count) || 0
    };
  }

  /**
   * Get category-wise inventory distribution for charts
   */
  static async getCategoryDistribution() {
    if (!isDatabaseAvailable()) {
      return mockStore.getDashboardCategoryDistribution();
    }

    const sql = `
      WITH category_stats AS (
        SELECT 
          c.id AS category_id,
          c.name AS category_name,
          COUNT(p.id)::int AS product_count,
          COALESCE(SUM(i.quantity), 0)::bigint AS total_quantity
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
        LEFT JOIN inventory i ON p.id = i.product_id
        GROUP BY c.id, c.name
      ),
      grand_total AS (
        SELECT COALESCE(SUM(total_quantity), 0)::numeric AS overall_units FROM category_stats
      )
      SELECT 
        cs.category_id,
        cs.category_name,
        cs.product_count,
        cs.total_quantity,
        CASE 
          WHEN gt.overall_units > 0 THEN 
            ROUND((cs.total_quantity::numeric / gt.overall_units) * 100, 2)
          ELSE 0.00
        END AS percentage
      FROM category_stats cs
      CROSS JOIN grand_total gt
      ORDER BY cs.total_quantity DESC, cs.category_name ASC;
    `;
    const res = await query(sql);
    return res.rows.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      productCount: Number(row.product_count),
      totalQuantity: Number(row.total_quantity),
      percentage: Number(row.percentage)
    }));
  }

  /**
   * Get latest stock movements with product details
   */
  static async getRecentMovements(limit = 10) {
    if (!isDatabaseAvailable()) {
      return mockStore.getDashboardRecentMovements(limit);
    }

    const sql = `
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
      ORDER BY sm.created_at DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows;
  }

  /**
   * Get products with critically low or zero stock
   */
  static async getLowStockProducts(limit = 10) {
    if (!isDatabaseAvailable()) {
      return mockStore.getDashboardLowStock(limit);
    }
    const sql = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        p.brand,
        p.unit,
        p.image_url,
        p.minimum_stock,
        c.name AS category_name,
        i.quantity,
        (p.minimum_stock - i.quantity) AS deficit,
        CASE
          WHEN i.quantity = 0 THEN 'out_of_stock'
          ELSE 'low_stock'
        END AS stock_status
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true 
        AND i.quantity <= p.minimum_stock
      ORDER BY 
        CASE WHEN i.quantity = 0 THEN 0 ELSE 1 END ASC,
        (p.minimum_stock - i.quantity) DESC,
        p.name ASC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows;
  }
}

