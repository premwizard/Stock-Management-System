import { pool, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { mockCategories, allMockProducts } from './seeds/mockProductsData.js';
import { fileURLToPath } from 'url';

export const runSeed = async () => {
  const client = await getClient();
  try {
    logger.info('Starting mock data seeding...');
    await client.query('BEGIN');

    // 1. Seed Categories
    logger.info(`Seeding ${mockCategories.length} categories...`);
    const categoryMap = new Map();

    for (const cat of mockCategories) {
      const res = await client.query(
        `
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description
        RETURNING id, name;
      `,
        [cat.name, cat.description]
      );
      categoryMap.set(res.rows[0].name, res.rows[0].id);
    }

    // 2. Seed Products & Inventory
    logger.info(`Seeding ${allMockProducts.length} automotive products with stock...`);
    let initialMovements = 0;

    for (const prod of allMockProducts) {
      const categoryId = categoryMap.get(prod.categoryName);
      if (!categoryId) {
        throw new Error(`Category not found: ${prod.categoryName}`);
      }

      // Upsert Product
      const productRes = await client.query(
        `
        INSERT INTO products (
          name, sku, category_id, brand, description, unit, image_url, minimum_stock, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (sku) DO UPDATE 
        SET 
          name = EXCLUDED.name,
          category_id = EXCLUDED.category_id,
          brand = EXCLUDED.brand,
          description = EXCLUDED.description,
          unit = EXCLUDED.unit,
          image_url = EXCLUDED.image_url,
          minimum_stock = EXCLUDED.minimum_stock,
          is_active = true
        RETURNING id;
      `,
        [
          prod.name,
          prod.sku,
          categoryId,
          prod.brand,
          prod.description,
          prod.unit,
          prod.imageUrl,
          prod.minimumStock
        ]
      );

      const productId = productRes.rows[0].id;

      // Check existing inventory for this product
      const existingInv = await client.query(
        'SELECT quantity FROM inventory WHERE product_id = $1',
        [productId]
      );

      if (existingInv.rows.length === 0) {
        // Create initial inventory record
        await client.query(
          `
          INSERT INTO inventory (product_id, quantity)
          VALUES ($1, $2);
        `,
          [productId, prod.quantity]
        );

        // Record initial stock movement if quantity > 0
        if (prod.quantity > 0) {
          await client.query(
            `
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, previous_quantity, new_quantity, reason
            )
            VALUES ($1, 'IN', $2, 0, $2, 'Initial inventory stock initialization');
          `,
            [productId, prod.quantity]
          );
          initialMovements++;
        }
      } else {
        // If updating existing inventory, adjust if different
        const currentQty = existingInv.rows[0].quantity;
        if (currentQty !== prod.quantity) {
          await client.query(
            'UPDATE inventory SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
            [prod.quantity, productId]
          );

          await client.query(
            `
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, previous_quantity, new_quantity, reason
            )
            VALUES ($1, 'ADJUSTMENT', $2, $3, $4, 'Database re-seed quantity synchronization');
          `,
            [productId, Math.abs(prod.quantity - currentQty) || 1, currentQty, prod.quantity]
          );
          initialMovements++;
        }
      }
    }

    // 3. Calculate summary stats
    const statsRes = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM categories)::int AS categories_count,
        (SELECT COUNT(*) FROM products)::int AS products_count,
        (SELECT COALESCE(SUM(quantity), 0) FROM inventory)::bigint AS total_stock_units,
        (SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.quantity <= p.minimum_stock AND i.quantity > 0)::int AS low_stock_count,
        (SELECT COUNT(*) FROM inventory WHERE quantity = 0)::int AS out_of_stock_count
    `);

    await client.query('COMMIT');

    const stats = statsRes.rows[0];
    logger.info('Database seeding completed successfully!');
    logger.info(`Summary Statistics:
      - Categories: ${stats.categories_count}
      - Products: ${stats.products_count}
      - Total Stock Units: ${stats.total_stock_units}
      - Low-Stock Products: ${stats.low_stock_count}
      - Out-of-Stock Products: ${stats.out_of_stock_count}
      - Stock Movement Records Recorded: ${initialMovements}
    `);

    return stats;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Database seeding failed, transaction rolled back.');
    throw error;
  } finally {
    client.release();
  }
};

// Execute if called directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.fatal({ err }, 'Seed runner terminated with error');
      await pool.end();
      process.exit(1);
    });
}
