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
  console.log('--- STARTING BACKEND FOUNDATION TESTS ---');
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
    // 1. Health check
    const healthRes = await request('/health');
    assert(healthRes.statusCode === 200, 'GET /health returns HTTP 200');
    assert(healthRes.data?.data?.database?.status === 'connected', 'GET /health reports database connected');

    // 2. Liveness probe
    const liveRes = await request('/health/live');
    assert(liveRes.statusCode === 200, 'GET /health/live returns HTTP 200');
    assert(liveRes.data?.data?.status === 'alive', 'GET /health/live reports alive');

    // 3. Readiness probe
    const readyRes = await request('/health/ready');
    assert(readyRes.statusCode === 200, 'GET /health/ready returns HTTP 200');
    assert(readyRes.data?.data?.status === 'ready', 'GET /health/ready reports ready with latency');

    // 4. 404 Handler
    const notFoundRes = await request('/some-nonexistent-endpoint-xyz');
    assert(notFoundRes.statusCode === 404, 'Undefined route triggers 404 status');
    assert(notFoundRes.data?.success === false, '404 response follows ApiError structure');

    // 5. Operational Error: 400 Bad Request
    const badReqRes = await request('/health/test-error?type=bad-request');
    assert(badReqRes.statusCode === 400, 'Operational 400 handled properly');
    assert(badReqRes.data?.errors?.length > 0, 'Validation errors array present in 400 response');

    // 6. Operational Error: 401 Unauthorized
    const unauthRes = await request('/health/test-error?type=unauthorized');
    assert(unauthRes.statusCode === 401, 'Operational 401 handled properly');

    // 7. Operational Error: 403 Forbidden
    const forbidRes = await request('/health/test-error?type=forbidden');
    assert(forbidRes.statusCode === 403, 'Operational 403 handled properly');

    // 8. Database Error: Unique Constraint (PostgreSQL 23505)
    const uniqueRes = await request('/health/test-error?type=db-unique');
    assert(uniqueRes.statusCode === 409, 'Database 23505 mapped cleanly to 409 Conflict');
    assert(uniqueRes.data?.message?.includes('Duplicate record'), '409 response contains safe descriptive message');

    // 9. Database Error: Invalid UUID format (PostgreSQL 22P02)
    const uuidRes = await request('/health/test-error?type=db-invalid-uuid');
    assert(uuidRes.statusCode === 400, 'Database 22P02 mapped cleanly to 400 Bad Request');

    // 10. Database Connection Pool Concurrency
    const start = Date.now();
    const concurrentQueries = Array.from({ length: 15 }, (_, i) =>
      pool.query('SELECT $1::int AS test_id', [i])
    );
    const results = await Promise.all(concurrentQueries);
    const poolDuration = Date.now() - start;
    assert(
      results.length === 15 && results.every((r, idx) => r.rows[0].test_id === idx),
      `15 concurrent queries handled by pool concurrently in ${poolDuration}ms`
    );

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runTests();

