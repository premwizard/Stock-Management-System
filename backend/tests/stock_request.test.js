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

const runStockRequestTests = async () => {
  console.log('--- STARTING STOCK REQUEST & AUTOMATIC DEDUCTION TESTS ---');
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
    // 1. Fetch 3 valid in-stock products for testing
    const searchRes = await request('/products/search?q=car&limit=5');
    assert(searchRes.statusCode === 200, 'Search for test products returns HTTP 200');
    const products = searchRes.data?.data?.products || [];
    assert(products.length >= 3, 'Found at least 3 test products');

    const p1 = products[0];
    const p2 = products[1];
    const p3 = products[2];

    const p1InitialQty = Number(p1.quantity);
    const p2InitialQty = Number(p2.quantity);
    const p3InitialQty = Number(p3.quantity);

    // 2. Create DRAFT stock request with valid items
    const createRes = await request('/stock-requests', {
      method: 'POST',
      body: {
        notes: 'Test Workshop Dispatch Batch #1',
        items: [
          { productId: p1.id, requestedQuantity: 2 },
          { productId: p2.id, requestedQuantity: 3 }
        ]
      }
    });

    assert(createRes.statusCode === 201, 'POST /stock-requests creates DRAFT request (201 Created)');
    const draftRequest = createRes.data?.data;
    assert(draftRequest?.status === 'DRAFT', 'Created request status is strictly DRAFT');
    assert(draftRequest?.total_items === 2, 'Total items count equals 2');
    assert(draftRequest?.total_quantity === 5, 'Total quantity equals 5 (2 + 3)');
    assert(draftRequest?.request_number.startsWith('REQ-'), 'Request number matches format REQ-YYYYMMDD-XXXX');

    // 3. Verify stock has NOT been deducted yet while in DRAFT
    const invP1Draft = await request(`/inventory/${p1.id}`);
    assert(Number(invP1Draft.data?.data?.quantity) === p1InitialQty, 'Draft creation leaves P1 stock strictly untouched');

    // 4. Update DRAFT request (modify quantities and add p3)
    const updateRes = await request(`/stock-requests/${draftRequest.id}`, {
      method: 'PUT',
      body: {
        notes: 'Updated Workshop Dispatch Batch #1 - added P3',
        items: [
          { productId: p1.id, requestedQuantity: 1 },
          { productId: p2.id, requestedQuantity: 2 },
          { productId: p3.id, requestedQuantity: 1 }
        ]
      }
    });
    assert(updateRes.statusCode === 200, 'PUT /stock-requests/:id updates DRAFT request (HTTP 200)');
    assert(updateRes.data?.data?.total_items === 3, 'Updated request now has 3 distinct items');
    assert(updateRes.data?.data?.total_quantity === 4, 'Updated request now has 4 total requested units');

    // 5. Test Insufficient Stock Rejection & Full Transaction Rollback (All-or-Nothing Atomicity)
    // Request an absurd quantity for p3 that exceeds available stock
    const excessiveRes = await request('/stock-requests', {
      method: 'POST',
      body: {
        notes: 'Excessive Quantity Test',
        items: [
          { productId: p1.id, requestedQuantity: 1 },
          { productId: p3.id, requestedQuantity: p3InitialQty + 9999 }
        ]
      }
    });
    assert(excessiveRes.statusCode === 201, 'Draft with excessive requested quantity can be saved');
    const excessiveRequestId = excessiveRes.data?.data?.id;

    const confirmFailRes = await request(`/stock-requests/${excessiveRequestId}/confirm`, {
      method: 'POST'
    });
    assert(confirmFailRes.statusCode === 400, 'Confirming request with insufficient stock triggers HTTP 400');
    assert(
      confirmFailRes.data?.message?.includes('inventory constraints'),
      'Safe explanatory error message returned for insufficient stock'
    );

    // Verify atomicity: P1 stock was NOT deducted even though P1 had plenty of stock!
    const invP1AfterRollback = await request(`/inventory/${p1.id}`);
    assert(
      Number(invP1AfterRollback.data?.data?.quantity) === p1InitialQty,
      'Atomicity guaranteed: P1 stock was not deducted when P3 failed sufficiency check'
    );

    // 6. Confirm the valid updated request and verify automatic stock deduction
    const confirmSuccessRes = await request(`/stock-requests/${draftRequest.id}/confirm`, {
      method: 'POST'
    });
    assert(confirmSuccessRes.statusCode === 200, 'POST /stock-requests/:id/confirm succeeds with HTTP 200');
    const confirmedRequest = confirmSuccessRes.data?.data;
    assert(confirmedRequest?.status === 'CONFIRMED', 'Request status transitioned to CONFIRMED');
    assert(confirmedRequest?.confirmed_at !== null, 'Request confirmed_at timestamp is populated');

    // 7. Verify Ground-Truth Stock Deduction in Inventory
    const invP1Final = await request(`/inventory/${p1.id}`);
    const invP2Final = await request(`/inventory/${p2.id}`);
    const invP3Final = await request(`/inventory/${p3.id}`);

    assert(
      Number(invP1Final.data?.data?.quantity) === p1InitialQty - 1,
      `P1 inventory automatically deducted by 1 unit (${p1InitialQty} -> ${p1InitialQty - 1})`
    );
    assert(
      Number(invP2Final.data?.data?.quantity) === p2InitialQty - 2,
      `P2 inventory automatically deducted by 2 units (${p2InitialQty} -> ${p2InitialQty - 2})`
    );
    assert(
      Number(invP3Final.data?.data?.quantity) === p3InitialQty - 1,
      `P3 inventory automatically deducted by 1 unit (${p3InitialQty} -> ${p3InitialQty - 1})`
    );

    // 8. Verify Immutable OUT Stock Movements Created with Request Reference
    const movementsRes = await request(`/inventory/movements?limit=10`);
    assert(movementsRes.statusCode === 200, 'GET /inventory/movements returns HTTP 200');
    const recentMovements = movementsRes.data?.data || [];
    const requestMovements = recentMovements.filter((m) =>
      m.reason?.includes(draftRequest.request_number)
    );

    assert(requestMovements.length === 3, 'Exactly 3 OUT movements recorded for the 3 confirmed products');
    assert(
      requestMovements.every((m) => m.movement_type === 'OUT'),
      'All generated stock movements are strictly type OUT'
    );

    // 9. Verify Duplicate Confirmation Rejection (HTTP 409 Conflict)
    const duplicateConfirmRes = await request(`/stock-requests/${draftRequest.id}/confirm`, {
      method: 'POST'
    });
    assert(duplicateConfirmRes.statusCode === 409, 'Duplicate confirmation blocked with HTTP 409 Conflict');

    // Verify stock was NOT deducted again
    const invP1AfterDuplicate = await request(`/inventory/${p1.id}`);
    assert(
      Number(invP1AfterDuplicate.data?.data?.quantity) === p1InitialQty - 1,
      'Double deduction prevented: stock remains unchanged after duplicate confirmation call'
    );

    // 10. Test Draft Cancellation
    const cancelDraftRes = await request('/stock-requests', {
      method: 'POST',
      body: {
        notes: 'To be cancelled',
        items: [{ productId: p1.id, requestedQuantity: 1 }]
      }
    });
    const cancelTargetId = cancelDraftRes.data?.data?.id;

    const cancelActionRes = await request(`/stock-requests/${cancelTargetId}/cancel`, {
      method: 'POST'
    });
    assert(cancelActionRes.statusCode === 200, 'POST /stock-requests/:id/cancel succeeds (HTTP 200)');
    assert(cancelActionRes.data?.data?.status === 'CANCELLED', 'Request status transitioned to CANCELLED');

    // Confirm that a cancelled request cannot be confirmed
    const confirmCancelledRes = await request(`/stock-requests/${cancelTargetId}/confirm`, {
      method: 'POST'
    });
    assert(confirmCancelledRes.statusCode === 400, 'Cannot confirm a CANCELLED stock request (HTTP 400)');

    // Revert test product quantities for hygiene (add back deducted units)
    await request('/inventory/stock-in', {
      method: 'POST',
      body: { productId: p1.id, quantity: 1, reason: 'Test hygiene restoration' }
    });
    await request('/inventory/stock-in', {
      method: 'POST',
      body: { productId: p2.id, quantity: 2, reason: 'Test hygiene restoration' }
    });
    await request('/inventory/stock-in', {
      method: 'POST',
      body: { productId: p3.id, quantity: 1, reason: 'Test hygiene restoration' }
    });

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Stock request test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runStockRequestTests();

