/**
 * Test Suite: Vehicle-Based Automatic Parts Bundles / Packages
 * Validates Package CRUD, Component Expansion, Multiplier Logic, Stock Verification, and Transactional Checkout
 */

import assert from 'node:assert/strict';
import { pool } from '../src/config/database.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runVehiclePackageTests() {
  console.log('--- STARTING VEHICLE PACKAGES & CHECKOUT BUNDLE TESTS ---');
  let passed = 0;
  let failed = 0;

  function pass(msg) {
    console.log(`PASS: ${msg}`);
    passed++;
  }

  function fail(msg, err) {
    console.error(`FAIL: ${msg}`, err);
    failed++;
  }

  try {
    // 1. LIST VEHICLE PACKAGES
    const listRes = await request('/vehicle-packages');
    assert.equal(listRes.status, 200, 'GET /vehicle-packages should return 200');
    assert.equal(listRes.data.success, true);
    assert.ok(Array.isArray(listRes.data.data), 'Data should be an array of packages');
    assert.ok(listRes.data.data.length >= 3, 'Should have at least 3 seeded packages');
    pass('GET /vehicle-packages returns HTTP 200 with seeded packages');

    const carCompletePkg = listRes.data.data.find((p) => p.name === 'Car Complete Parts Package');
    assert.ok(carCompletePkg, 'Car Complete Parts Package must exist in seeded packages');
    assert.equal(Number(carCompletePkg.item_count), 6, 'Car Complete Package must have 6 distinct components');
    assert.equal(Number(carCompletePkg.total_parts_quantity), 15, 'Car Complete Package must have 15 total units');
    pass('Car Complete Parts Package contains 6 components and 15 total units');

    // 2. SEARCH PACKAGES
    const searchRes = await request('/vehicle-packages?search=Car');
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.data.data.length >= 2, 'Search for Car should find at least 2 packages');
    pass('GET /vehicle-packages?search=Car filters packages by name or component');

    // 3. GET SINGLE PACKAGE DETAILS WITH STOCK
    const detailRes = await request(`/vehicle-packages/${carCompletePkg.id}`);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.data.data.id, carCompletePkg.id);
    assert.ok(Array.isArray(detailRes.data.data.items), 'Package detail must contain items array');
    assert.equal(detailRes.data.data.items.length, 6);

    const tyreItem = detailRes.data.data.items.find((i) => i.sku === 'TYR-001');
    assert.ok(tyreItem, 'Michelin Tyre should be in the package components');
    assert.equal(Number(tyreItem.required_quantity), 4, 'Michelin Tyre required quantity must be 4');
    assert.ok(Number(tyreItem.available_quantity) >= 0, 'Available quantity must be tracked');
    pass('GET /vehicle-packages/:id returns hydrated components with live inventory balances');

    // 4. EXPAND PACKAGE WITH VEHICLE MULTIPLIER (multiplier = 1)
    const expand1Res = await request(`/vehicle-packages/${carCompletePkg.id}/expand?multiplier=1`);
    assert.equal(expand1Res.status, 200);
    assert.equal(expand1Res.data.data.multiplier, 1);
    assert.equal(expand1Res.data.data.totalItems, 6);
    assert.equal(expand1Res.data.data.totalUnits, 15);
    pass('GET /vehicle-packages/:id/expand (multiplier=1) expands 15 units');

    // 5. EXPAND PACKAGE WITH VEHICLE MULTIPLIER (multiplier = 2 vehicles)
    const expand2Res = await request(`/vehicle-packages/${carCompletePkg.id}/expand?multiplier=2`);
    assert.equal(expand2Res.status, 200);
    assert.equal(expand2Res.data.data.multiplier, 2);
    assert.equal(expand2Res.data.data.totalItems, 6);
    assert.equal(expand2Res.data.data.totalUnits, 30, '2 vehicles must double all quantities to 30 units total');

    const expandTyre = expand2Res.data.data.items.find((i) => i.sku === 'TYR-001');
    assert.equal(expandTyre.requestedQuantity, 8, 'Tyres required: 4 * 2 = 8');
    const expandBrakePad = expand2Res.data.data.items.find((i) => i.sku === 'BRK-001');
    assert.equal(expandBrakePad.requestedQuantity, 2, 'Brake pads required: 1 * 2 = 2');
    pass('Component quantities correctly multiplied by 2 for 2 complete vehicles');

    // 6. VALIDATION CHECKS
    // Empty items
    const emptyItemsRes = await request('/vehicle-packages', {
      method: 'POST',
      body: JSON.stringify({ name: 'Empty Package', items: [] })
    });
    assert.equal(emptyItemsRes.status, 400);
    pass('Creating package with empty items triggers HTTP 400 validation error');

    // Duplicate products in package
    const dupRes = await request('/vehicle-packages', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Package',
        items: [
          { productId: tyreItem.product_id, requiredQuantity: 2 },
          { productId: tyreItem.product_id, requiredQuantity: 1 }
        ]
      })
    });
    assert.equal(dupRes.status, 400);
    pass('Duplicate products in the same package triggers HTTP 400 error');

    // Duplicate package name
    const dupNameRes = await request('/vehicle-packages', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Car Complete Parts Package',
        items: [{ productId: tyreItem.product_id, requiredQuantity: 1 }]
      })
    });
    assert.equal(dupNameRes.status, 409);
    pass('Duplicate package name triggers HTTP 409 Conflict');

    // 7. CREATE, UPDATE & DELETE CUSTOM PACKAGE
    const createRes = await request('/vehicle-packages', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Fleet Emergency Kit',
        description: 'Custom roadside repair kit for corporate fleet vehicles',
        items: [
          { productId: tyreItem.product_id, requiredQuantity: 1 },
          { productId: detailRes.data.data.items[1].product_id, requiredQuantity: 2 }
        ]
      })
    });
    assert.equal(createRes.status, 201);
    const createdPkgId = createRes.data.data.id;
    assert.equal(createRes.data.data.name, 'Test Fleet Emergency Kit');
    pass('POST /vehicle-packages creates new custom package (201 Created)');

    // Update package
    const updateRes = await request(`/vehicle-packages/${createdPkgId}`, {
      method: 'PUT',
      body: JSON.stringify({
        description: 'Updated roadside kit description',
        isActive: true
      })
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.data.description, 'Updated roadside kit description');
    pass('PUT /vehicle-packages/:id updates package details');

    // Delete custom package
    const deleteRes = await request(`/vehicle-packages/${createdPkgId}`, {
      method: 'DELETE'
    });
    assert.equal(deleteRes.status, 200);
    pass('DELETE /vehicle-packages/:id removes package');

    // 8. END-TO-END CHECKOUT WORKFLOW WITH BUNDLE + INDIVIDUAL ITEM MERGE
    // Step A: Expand Car Complete Parts Package
    const expanded = expand1Res.data.data.items;
    
    // Step B: Simulate intelligent cart merge:
    // User already had 2 Michelin Tyres in cart, then added 1 Car Complete Parts Package (which has 4 Michelin Tyres).
    // The merged quantity for Michelin Tyre becomes 2 + 4 = 6.
    const cartItems = expanded.map((item) => {
      if (item.sku === 'TYR-001') {
        return { productId: item.productId, requestedQuantity: item.requestedQuantity + 2 };
      }
      return { productId: item.productId, requestedQuantity: item.requestedQuantity };
    });

    // Step C: Verify stock via POST /stock-requests/verify
    const verifyRes = await request('/stock-requests/verify', {
      method: 'POST',
      body: JSON.stringify({ items: cartItems })
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.data.verified, true, 'All bundled parts should be available');
    pass('POST /stock-requests/verify succeeds for bundled vehicle parts');

    // Step D: Confirm stock request and verify atomic inventory deduction
    // Get initial stock for Michelin Tyre
    const initialInvRes = await request(`/inventory/${tyreItem.product_id}`);
    const initialTyreStock = Number(initialInvRes.data.data.quantity);

    // Create Draft Request
    const draftRes = await request('/stock-requests', {
      method: 'POST',
      body: JSON.stringify({
        notes: 'Car Complete Parts Package Checkout',
        items: cartItems
      })
    });
    assert.equal(draftRes.status, 201);
    const draftId = draftRes.data.data.id;
    pass('Created draft stock request with merged package and individual parts');

    // Confirm Request
    const confirmRes = await request(`/stock-requests/${draftId}/confirm`, {
      method: 'POST'
    });
    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.data.data.status, 'CONFIRMED');
    pass('Confirmed stock request: atomic inventory deduction executed');

    // Check inventory decrement
    const afterInvRes = await request(`/inventory/${tyreItem.product_id}`);
    const afterTyreStock = Number(afterInvRes.data.data.quantity);
    assert.equal(
      afterTyreStock,
      initialTyreStock - 6,
      'Tyre stock must be decremented by exactly 6 units (4 from package + 2 individual)'
    );
    pass('PostgreSQL inventory decremented correctly for bundled products');

    // Verify stock movements recorded
    const movementsRes = await request(`/inventory/movements?stockRequestId=${draftId}`);
    assert.equal(movementsRes.status, 200);
    assert.equal(movementsRes.data.data.length, 6, 'Must record 6 OUT movements for all 6 package parts');
    pass('Audit movements correctly recorded with OUT type referencing stock request');

    // Clean up test deduction to keep inventory state pristine for other test suites
    await pool.query(
      `UPDATE inventory SET quantity = $1 WHERE product_id = $2`,
      [initialTyreStock, tyreItem.product_id]
    );
    for (const item of cartItems) {
      if (item.productId !== tyreItem.product_id) {
        await pool.query(
          `UPDATE inventory SET quantity = quantity + $1 WHERE product_id = $2`,
          [item.requestedQuantity, item.productId]
        );
      }
    }
    pass('Cleaned up test deductions: inventory state restored');

  } catch (err) {
    fail('Unhandled test failure', err);
  } finally {
    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runVehiclePackageTests()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Fatal test error:', err);
    await pool.end();
    process.exit(1);
  });
