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

const runInventoryTests = async () => {
  console.log('--- STARTING INVENTORY & STOCK MANAGEMENT TESTS ---');
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
    // 1. GET /inventory (Listing)
    const listRes = await request('/inventory?page=1&limit=10');
    assert(listRes.statusCode === 200, 'GET /inventory returns HTTP 200');
    assert(listRes.data?.data?.length === 10, 'Paginated inventory slice returns 10 items');
    assert(listRes.data?.meta?.totalItems >= 140, 'Meta total items reports full catalogue count');
    assert(listRes.data?.data[0]?.stock_status !== undefined, 'Stock status is computed for each item');

    // Pick a test product: Michelin Tyre (TYR-001)
    const michelinRes = await pool.query("SELECT id, name FROM products WHERE sku = 'TYR-001'");
    const michelinId = michelinRes.rows[0]?.id;
    assert(!!michelinId, 'Found Michelin Tyre (TYR-001) in database');

    // 2. GET /inventory/:productId
    const singleInvRes = await request(`/inventory/${michelinId}`);
    assert(singleInvRes.statusCode === 200, 'GET /inventory/:productId returns HTTP 200');
    const startQty = Number(singleInvRes.data?.data?.quantity);
    assert(startQty > 0, `Initial quantity for Michelin Tyre is ${startQty}`);
    assert(Array.isArray(singleInvRes.data?.data?.recentMovements), 'Product inventory includes recent movements array');

    // 3. POST /inventory/stock-in (Add 15 units)
    const stockInRes = await request('/inventory/stock-in', {
      method: 'POST',
      body: {
        productId: michelinId,
        quantity: 15,
        reason: 'Restock shipment received from supplier'
      }
    });
    assert(stockInRes.statusCode === 200, 'POST /inventory/stock-in returns HTTP 200');
    assert(
      Number(stockInRes.data?.data?.quantity) === startQty + 15,
      `Stock increased from ${startQty} to ${startQty + 15}`
    );

    // 4. POST /inventory/stock-out (Remove 10 units)
    const stockOutRes = await request('/inventory/stock-out', {
      method: 'POST',
      body: {
        productId: michelinId,
        quantity: 10,
        reason: 'Order fulfillment for customer invoice #10492'
      }
    });
    assert(stockOutRes.statusCode === 200, 'POST /inventory/stock-out returns HTTP 200');
    assert(
      Number(stockOutRes.data?.data?.quantity) === startQty + 5,
      `Stock decreased by 10 to ${startQty + 5}`
    );

    // 5. NEGATIVE STOCK PREVENTION: Attempt to remove more than available
    const overDeductionQty = startQty + 1000;
    const overDeductRes = await request('/inventory/stock-out', {
      method: 'POST',
      body: {
        productId: michelinId,
        quantity: overDeductionQty,
        reason: 'Invalid bulk sale exceeding stock'
      }
    });
    assert(overDeductRes.statusCode === 400, 'Over-deduction triggers HTTP 400 Bad Request');
    assert(
      overDeductRes.data?.message?.includes('Insufficient stock'),
      'Clear insufficient stock message returned'
    );

    // Verify stock was not deducted and transaction rolled back
    const verifyQtyRes = await pool.query('SELECT quantity FROM inventory WHERE product_id = $1', [michelinId]);
    const afterFailedDeductQty = Number(verifyQtyRes.rows[0]?.quantity);
    assert(
      afterFailedDeductQty === startQty + 5,
      `Transaction rollback verified: stock remains strictly ${startQty + 5}`
    );

    // 6. POST /inventory/adjust (Adjust to exact count: 120)
    const adjustRes = await request('/inventory/adjust', {
      method: 'POST',
      body: {
        productId: michelinId,
        newQuantity: 120,
        reason: 'Physical warehouse audit inventory count alignment'
      }
    });
    assert(adjustRes.statusCode === 200, 'POST /inventory/adjust returns HTTP 200');
    assert(Number(adjustRes.data?.data?.quantity) === 120, 'Stock adjusted exactly to 120');

    // 7. Prevent negative adjustment target
    const negAdjustRes = await request('/inventory/adjust', {
      method: 'POST',
      body: {
        productId: michelinId,
        newQuantity: -20,
        reason: 'Negative test'
      }
    });
    assert(negAdjustRes.statusCode === 400, 'Negative adjustment target triggers HTTP 400 validation error');

    // 8. GET /inventory/movements (Audit Trail)
    const movementsRes = await request('/inventory/movements?limit=10');
    assert(movementsRes.statusCode === 200, 'GET /inventory/movements returns HTTP 200');
    assert(movementsRes.data?.data?.length === 10, 'Movements audit returns paginated records');
    assert(
      movementsRes.data?.data[0]?.movement_type !== undefined,
      'Movement record contains movement_type'
    );
    assert(
      movementsRes.data?.data[0]?.previous_quantity !== undefined,
      'Movement record tracks previous_quantity'
    );
    assert(
      movementsRes.data?.data[0]?.new_quantity !== undefined,
      'Movement record tracks new_quantity'
    );
    assert(
      movementsRes.data?.data[0]?.product_name !== undefined,
      'Movement record joins product name'
    );

    // 9. Filter movements by movementType=IN
    const inMovementsRes = await request('/inventory/movements?movementType=IN&limit=5');
    assert(inMovementsRes.statusCode === 200, 'GET /inventory/movements?movementType=IN returns HTTP 200');
    assert(
      inMovementsRes.data?.data?.every((m) => m.movement_type === 'IN'),
      'All filtered movements have movement_type = IN'
    );

    // 10. CONCURRENT STOCK OPERATIONS WITH ROW-LEVEL LOCKING
    console.log('\nRunning concurrency test (10 simultaneous stock-in requests of 5 units each)...');
    const preConcurrencyRes = await pool.query('SELECT quantity FROM inventory WHERE product_id = $1', [michelinId]);
    const preQty = Number(preConcurrencyRes.rows[0]?.quantity);

    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      request('/inventory/stock-in', {
        method: 'POST',
        body: {
          productId: michelinId,
          quantity: 5,
          reason: `Concurrent thread #${i + 1} batch arrival`
        }
      })
    );

    const concurrentResults = await Promise.all(concurrentRequests);
    assert(
      concurrentResults.every((r) => r.statusCode === 200),
      'All 10 concurrent stock-in requests succeeded with HTTP 200'
    );

    const postConcurrencyRes = await pool.query('SELECT quantity FROM inventory WHERE product_id = $1', [michelinId]);
    const finalQty = Number(postConcurrencyRes.rows[0]?.quantity);
    assert(
      finalQty === preQty + 50,
      `Concurrency integrity verified: Expected ${preQty + 50}, found exactly ${finalQty} (no lost updates)`
    );

    // Reset Michelin Tyre back to default 120 for subsequent tests
    await pool.query('UPDATE inventory SET quantity = 120 WHERE product_id = $1', [michelinId]);

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Inventory test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runInventoryTests();
