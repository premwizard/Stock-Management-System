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

const runSearchTests = async () => {
  console.log('--- STARTING SMART SEARCH ENGINE TESTS ---');
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
    // 1. Search for "Car"
    const carRes = await request('/products/search?q=car');
    assert(carRes.statusCode === 200, 'GET /products/search?q=car returns HTTP 200');
    assert(carRes.data?.data?.query === 'car', 'Returned query field matches input');
    assert(carRes.data?.data?.totalProducts >= 100, `Car search found ${carRes.data?.data?.totalProducts} matching products`);
    assert(carRes.data?.data?.totalStockUnits >= 4000, `Car search aggregated ${carRes.data?.data?.totalStockUnits} total stock units`);
    assert(carRes.data?.data?.products?.length <= 20, 'Products array obeys default pagination limit of 20');
    assert(
      carRes.data?.data?.products[0]?.category !== undefined,
      'Product results include joined category name'
    );
    assert(
      carRes.data?.data?.products[0]?.quantity !== undefined,
      'Product results include available stock quantity'
    );
    assert(
      carRes.data?.data?.products[0]?.stock_status !== undefined,
      'Product results include computed stock status'
    );
    assert(
      carRes.data?.meta?.executionTimeMs < 50,
      `Search query executed within SLA (${carRes.data?.meta?.executionTimeMs}ms < 50ms)`
    );

    // 2. Case-Insensitive Matching ("tyre" vs "TYRE")
    const lowerTyreRes = await request('/products/search?q=tyre');
    const upperTyreRes = await request('/products/search?q=TYRE');
    assert(lowerTyreRes.statusCode === 200, 'GET /products/search?q=tyre returns HTTP 200');
    assert(
      lowerTyreRes.data?.data?.totalProducts === upperTyreRes.data?.data?.totalProducts,
      'Case-insensitivity: "tyre" and "TYRE" produce identical total matching products'
    );
    assert(
      lowerTyreRes.data?.data?.totalStockUnits === upperTyreRes.data?.data?.totalStockUnits,
      'Case-insensitivity: "tyre" and "TYRE" produce identical total stock units'
    );

    // 3. Search for "Michelin" (Brand search)
    const michelinRes = await request('/products/search?q=Michelin');
    assert(michelinRes.statusCode === 200, 'GET /products/search?q=Michelin returns HTTP 200');
    assert(
      michelinRes.data?.data?.products?.some((p) => p.brand === 'Michelin'),
      'Brand matching retrieves Michelin branded products'
    );

    // 4. Search for "Car Parts" (Category query)
    const carPartsRes = await request('/products/search?q=Car%20Parts');
    assert(carPartsRes.statusCode === 200, 'GET /products/search?q=Car Parts returns HTTP 200');
    assert(
      carPartsRes.data?.data?.products?.some((p) => p.category === 'Car Parts'),
      'Category search retrieves products in Car Parts'
    );

    // 5. Search for "Brake" (Keyword search)
    const brakeRes = await request('/products/search?q=Brake');
    assert(brakeRes.statusCode === 200, 'GET /products/search?q=Brake returns HTTP 200');
    assert(brakeRes.data?.data?.totalProducts >= 10, 'Brake search found matching brake products');
    assert(brakeRes.data?.data?.totalStockUnits > 500, 'Brake search aggregated stock units');

    // 6. Search for exact SKU: "TYR-001"
    const skuRes = await request('/products/search?q=TYR-001');
    assert(skuRes.statusCode === 200, 'GET /products/search?q=TYR-001 returns HTTP 200');
    assert(skuRes.data?.data?.totalProducts === 1, 'Exact SKU search returns exactly 1 matching product');
    assert(skuRes.data?.data?.products[0]?.sku === 'TYR-001', 'Top result has exact SKU TYR-001');
    assert(Number(skuRes.data?.data?.products[0]?.quantity) > 0, 'Positive stock verified for TYR-001');

    // 7. Partial SKU search: "TYR-"
    const partialSkuRes = await request('/products/search?q=TYR-');
    assert(partialSkuRes.statusCode === 200, 'GET /products/search?q=TYR- returns HTTP 200');
    assert(partialSkuRes.data?.data?.totalProducts > 10, 'Partial SKU "TYR-" matches all tyre SKUs');

    // 8. Empty query handling
    const emptyRes = await request('/products/search?q=');
    assert(emptyRes.statusCode === 200, 'GET /products/search?q= returns HTTP 200');
    assert(emptyRes.data?.data?.totalProducts >= 140, 'Empty query returns all active catalogue products');
    assert(emptyRes.data?.data?.totalStockUnits > 6000, 'Empty query calculates entire inventory stock units');

    // 9. Zero-match query
    const zeroRes = await request('/products/search?q=nonexistent_product_xyz_12345');
    assert(zeroRes.statusCode === 200, 'GET /products/search with no matches returns HTTP 200');
    assert(zeroRes.data?.data?.totalProducts === 0, 'Zero-match query returns totalProducts: 0');
    assert(zeroRes.data?.data?.totalStockUnits === 0, 'Zero-match query returns totalStockUnits: 0');
    assert(zeroRes.data?.data?.products?.length === 0, 'Zero-match query returns empty products array');

    // 10. Combined search + category filter
    const combinedRes = await request('/products/search?q=Car&category=Tyres');
    assert(combinedRes.statusCode === 200, 'Search with category filter returns HTTP 200');
    assert(
      combinedRes.data?.data?.products?.every((p) => p.category === 'Tyres'),
      'Combined search returns only products in the requested category'
    );

    // 11. Pagination independence of aggregated totals
    const page1Res = await request('/products/search?q=car&page=1&limit=5');
    const page2Res = await request('/products/search?q=car&page=2&limit=5');
    assert(page1Res.statusCode === 200 && page2Res.statusCode === 200, 'Paginated search slices return HTTP 200');
    assert(page1Res.data?.data?.products?.length === 5, 'Page 1 slice has 5 products');
    assert(page2Res.data?.data?.products?.length === 5, 'Page 2 slice has 5 products');
    assert(
      page1Res.data?.data?.totalProducts === page2Res.data?.data?.totalProducts,
      'Total products aggregate is invariant across pagination pages'
    );
    assert(
      page1Res.data?.data?.totalStockUnits === page2Res.data?.data?.totalStockUnits,
      'Total stock units aggregate is invariant across pagination pages'
    );
    assert(
      page1Res.data?.data?.products[0]?.id !== page2Res.data?.data?.products[0]?.id,
      'Page 1 and Page 2 products are distinct'
    );

    // 12. Search Performance Benchmark (Run 30 concurrent queries)
    console.log('\nRunning search performance benchmark (30 concurrent queries)...');
    const benchmarkStart = performance.now();
    const queries = ['car', 'tyre', 'brake', 'engine', 'oil', 'michelin'];
    const benchPromises = Array.from({ length: 30 }, (_, i) =>
      request(`/products/search?q=${queries[i % queries.length]}`)
    );
    const benchResults = await Promise.all(benchPromises);
    const benchDuration = Math.round(performance.now() - benchmarkStart);
    const avgLatency = Math.round(benchDuration / 30);
    assert(
      benchResults.every((r) => r.statusCode === 200),
      `30 concurrent smart search queries completed successfully in ${benchDuration}ms (Avg: ${avgLatency}ms/req)`
    );

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Search test execution error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runSearchTests();

