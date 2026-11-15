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
    req.end();
  });
};

const runDashboardTests = async () => {
  console.log('--- STARTING DASHBOARD ANALYTICS API TESTS ---');
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

  try {
    // 1. GET /dashboard/summary
    const summaryRes = await request('/dashboard/summary');
    assert(summaryRes.statusCode === 200, 'GET /dashboard/summary returns HTTP 200');
    const s = summaryRes.data?.data;
    assert(s?.totalProducts >= 140, `Summary reports ${s?.totalProducts} total products`);
    assert(s?.totalCategories === 7, `Summary reports ${s?.totalCategories} total categories`);
    assert(s?.totalStockUnits > 6000, `Summary reports ${s?.totalStockUnits} total stock units`);
    assert(s?.lowStockCount > 0, `Summary reports ${s?.lowStockCount} low stock products`);
    assert(s?.outOfStockCount > 0, `Summary reports ${s?.outOfStockCount} out of stock products`);
    assert(
      s?.inStockCount + s?.lowStockCount + s?.outOfStockCount === s?.totalProducts,
      'Product category breakdown strictly equals totalProducts'
    );

    // 2. GET /dashboard/category-distribution
    const distRes = await request('/dashboard/category-distribution');
    assert(distRes.statusCode === 200, 'GET /dashboard/category-distribution returns HTTP 200');
    const dist = distRes.data?.data;
    assert(Array.isArray(dist) && dist.length === 7, 'Distribution includes all 7 categories');
    assert(dist[0]?.categoryName !== undefined, 'Distribution item includes categoryName');
    assert(dist[0]?.totalQuantity !== undefined, 'Distribution item includes totalQuantity');
    assert(dist[0]?.percentage !== undefined, 'Distribution item includes percentage');
    const sumPercentage = dist.reduce((acc, curr) => acc + curr.percentage, 0);
    assert(
      Math.abs(sumPercentage - 100) < 0.5,
      `Category distribution percentages sum up to ${sumPercentage}% (~100%)`
    );

    // 3. GET /dashboard/recent-movements
    const movRes = await request('/dashboard/recent-movements?limit=10');
    assert(movRes.statusCode === 200, 'GET /dashboard/recent-movements returns HTTP 200');
    const movements = movRes.data?.data;
    assert(Array.isArray(movements) && movements.length <= 10, 'Returns up to 10 recent movements');
    assert(movements[0]?.movement_type !== undefined, 'Movement item has movement_type');
    assert(movements[0]?.product_name !== undefined, 'Movement item has product_name');

    // 4. GET /dashboard/low-stock
    const lowStockRes = await request('/dashboard/low-stock?limit=10');
    assert(lowStockRes.statusCode === 200, 'GET /dashboard/low-stock returns HTTP 200');
    const lowStockItems = lowStockRes.data?.data;
    assert(Array.isArray(lowStockItems), 'Low stock items returned as array');
    assert(
      lowStockItems.every((item) => item.quantity <= item.minimum_stock),
      'All low stock items satisfy quantity <= minimum_stock'
    );
    assert(
      lowStockItems[0]?.deficit !== undefined,
      'Low stock item includes deficit value'
    );

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Dashboard test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runDashboardTests();

