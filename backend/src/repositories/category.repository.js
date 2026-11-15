import { query } from '../config/database.js';

export class CategoryRepository {
  /**
   * Find all categories, optionally including product count and total stock units
   */
  static async findAll(withStats = false) {
    if (withStats) {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.created_at,
          c.updated_at,
          COUNT(p.id)::int AS product_count,
          COALESCE(SUM(i.quantity), 0)::bigint AS total_stock_units
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
        LEFT JOIN inventory i ON p.id = i.product_id
        GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
        ORDER BY c.name ASC;
      `;
      const res = await query(sql);
      return res.rows;
    }

    const res = await query(
      'SELECT id, name, description, created_at, updated_at FROM categories ORDER BY name ASC'
    );
    return res.rows;
  }

  /**
   * Find category by ID
   */
  static async findById(id) {
    const res = await query(
      'SELECT id, name, description, created_at, updated_at FROM categories WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Find category by name
   */
  static async findByName(name) {
    const res = await query(
      'SELECT id, name, description, created_at, updated_at FROM categories WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return res.rows[0] || null;
  }

  /**
   * Create a new category
   */
  static async create({ name, description }) {
    const res = await query(
      `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at, updated_at;
    `,
      [name, description || null]
    );
    return res.rows[0];
  }

  /**
   * Update category
   */
  static async update(id, { name, description }) {
    const res = await query(
      `
      UPDATE categories
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description)
      WHERE id = $1
      RETURNING id, name, description, created_at, updated_at;
    `,
      [id, name, description]
    );
    return res.rows[0] || null;
  }

  /**
   * Count how many products are linked to a category
   */
  static async countProductsByCategoryId(id) {
    const res = await query(
      'SELECT COUNT(*)::int AS product_count FROM products WHERE category_id = $1',
      [id]
    );
    return res.rows[0]?.product_count || 0;
  }

  /**
   * Delete category
   */
  static async delete(id) {
    const res = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING id, name',
      [id]
    );
    return res.rows[0] || null;
  }
}

