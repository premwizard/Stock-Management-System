import http from 'http';
import { env } from '../src/config/env.js';
import { pool } from '../src/config/database.js';

const BASE_URL = `http://localhost:${env.PORT}${env.API_PREFIX}`;

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: json });
          } catch {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING PRODUCT & CATEGORY API TESTS ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`PASS: ${title}`);
      passed++;
    } else {
      console.error(`FAIL: ${title}`);
      failed++;
    }
  };

  const testTimestamp = Date.now();
  const testCatName = `Test Category ${testTimestamp}`;
  const testSku = `TEST-SKU-${testTimestamp.toString().slice(-6)}`;
  let testCatId = null;
  let testProdId = null;

  try {
    // 1. GET /categories
    const catListRes = await request('/categories');
    assert(catListRes.statusCode === 200, 'GET /categories returns HTTP 200');
    assert(catListRes.data?.data?.length >= 7, 'At least 7 seeded categories returned');

    // 2. GET /categories?withStats=true
    const catStatsRes = await request('/categories?withStats=true');
    assert(catStatsRes.statusCode === 200, 'GET /categories?withStats=true returns HTTP 200');
    const tyreCat = catStatsRes.data?.data?.find((c) => c.name === 'Tyres');
    assert(tyreCat && Number(tyreCat.product_count) > 0, 'Tyres category has aggregated product count');
    assert(tyreCat && Number(tyreCat.total_stock_units) > 0, 'Tyres category has aggregated total stock units');

    // 3. POST /categories (Create test category)
    const newCatRes = await request('/categories', {
      method: 'POST',
      body: {
        name: testCatName,
        description: 'Category created by automated API test'
      }
    });
    assert(newCatRes.statusCode === 201, 'POST /categories creates new category (201 Created)');
    testCatId = newCatRes.data?.data?.id;

    // 4. PUT /categories/:id (Update test category)
    const updateCatRes = await request(`/categories/${testCatId}`, {
      method: 'PUT',
      body: {
        description: 'Updated description for test category'
      }
    });
    assert(updateCatRes.statusCode === 200, 'PUT /categories/:id updates category');
    assert(updateCatRes.data?.data?.description === 'Updated description for test category', 'Updated description matches');

    // 5. GET /products (Listing & Pagination)
    const prodListRes = await request('/products?page=1&limit=10');
    assert(prodListRes.statusCode === 200, 'GET /products returns HTTP 200');
    assert(prodListRes.data?.data?.length === 10, 'Paginated product slice returns 10 items');
    assert(prodListRes.data?.meta?.totalItems >= 140, 'Meta total items reports 140+ seeded products');
    assert(prodListRes.data?.meta?.totalPages > 1, 'Meta total pages calculated accurately');

    // 6. GET /products filter by category
    const catFilterRes = await request('/products?category=Tyres&limit=5');
    assert(catFilterRes.statusCode === 200, 'GET /products?category=Tyres returns HTTP 200');
    assert(
      catFilterRes.data?.data?.every((p) => p.category_name === 'Tyres'),
      'All returned products belong to Tyres category'
    );

    // 7. GET /products filter by status=low_stock
    const lowStockRes = await request('/products?status=low_stock');
    assert(lowStockRes.statusCode === 200, 'GET /products?status=low_stock returns HTTP 200');
    assert(
      lowStockRes.data?.data?.every((p) => p.stock_status === 'low_stock'),
      'All items in low_stock filter have stock_status low_stock'
    );

    // 8. GET /products sorting by quantity DESC
    const sortRes = await request('/products?sort=quantity&order=desc&limit=5');
    assert(sortRes.statusCode === 200, 'GET /products sorted by quantity DESC returns HTTP 200');
    const quantities = sortRes.data?.data?.map((p) => p.quantity);
    const isSorted = quantities.slice(1).every((qty, i) => qty <= quantities[i]);
    assert(isSorted, 'Returned products are sorted descending by quantity');

    // 9. POST /products (Create product with initial stock)
    const newProdRes = await request('/products', {
      method: 'POST',
      body: {
        name: `Automated Sensor ${testTimestamp}`,
        sku: testSku,
        categoryId: testCatId,
        brand: 'Bosch Test',
        description: 'Test product created for API validation',
        unit: 'pcs',
        minimumStock: 10,
        initialStock: 25
      }
    });
    assert(newProdRes.statusCode === 201, 'POST /products creates product (201 Created)');
    assert(newProdRes.data?.data?.quantity === 25, 'Initial stock initialized to 25');
    assert(newProdRes.data?.data?.stock_status === 'in_stock', 'Stock status evaluated to in_stock');
    testProdId = newProdRes.data?.data?.id;

    // 10. GET /products/:id (Get single product details)
    const singleProdRes = await request(`/products/${testProdId}`);
    assert(singleProdRes.statusCode === 200, 'GET /products/:id retrieves product');
    assert(singleProdRes.data?.data?.sku === testSku, 'Product SKU matches');
    assert(singleProdRes.data?.data?.category_name === testCatName, 'Joined category name matches');

    // 11. PUT /products/:id (Update product)
    const updateProdRes = await request(`/products/${testProdId}`, {
      method: 'PUT',
      body: {
        name: `Automated Sensor Updated ${testTimestamp}`,
        brand: 'Bosch Pro'
      }
    });
    assert(updateProdRes.statusCode === 200, 'PUT /products/:id updates metadata');
    assert(updateProdRes.data?.data?.brand === 'Bosch Pro', 'Updated brand matches');

    // 12. Safe Category Deletion Check (Must fail when products exist)
    const safeDeleteRes = await request(`/categories/${testCatId}`, {
      method: 'DELETE'
    });
    assert(safeDeleteRes.statusCode === 400, 'DELETE /categories/:id fails when active products exist');
    assert(safeDeleteRes.data?.message?.includes('Cannot delete category'), 'Safe deletion error explanation provided');

    // 13. DELETE /products/:id (Delete product)
    const deleteProdRes = await request(`/products/${testProdId}`, {
      method: 'DELETE'
    });
    assert(deleteProdRes.statusCode === 200, 'DELETE /products/:id removes product');
    testProdId = null;

    // 14. DELETE /categories/:id (Now succeeds for empty category)
    const finalCatDeleteRes = await request(`/categories/${testCatId}`, {
      method: 'DELETE'
    });
    assert(finalCatDeleteRes.statusCode === 200, 'DELETE /categories/:id succeeds when no products exist');
    testCatId = null;

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  } finally {
    // Cleanup if test aborted early
    if (testProdId) {
      await pool.query('DELETE FROM stock_movements WHERE product_id = $1', [testProdId]).catch(() => {});
      await pool.query('DELETE FROM inventory WHERE product_id = $1', [testProdId]).catch(() => {});
      await pool.query('DELETE FROM products WHERE id = $1', [testProdId]).catch(() => {});
    }
    if (testCatId) {
      await pool.query('DELETE FROM categories WHERE id = $1', [testCatId]).catch(() => {});
    }
    await pool.end();
  }
};

runTests();
