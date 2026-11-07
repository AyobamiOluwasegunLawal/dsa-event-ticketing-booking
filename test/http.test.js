import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request as httpRequest, createServer } from 'node:http';
import test from 'node:test';
import { createApp } from '../src/http/app.js';
import { Router } from '../src/http/router.js';

async function request(server, { method = 'GET', pathname, body, headers = {} }) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const req = httpRequest({
      host: '127.0.0.1',
      port: address.port,
      method,
      path: pathname,
      headers,
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          json = undefined;
        }
        resolve({ status: response.statusCode, headers: response.headers, text, json });
      });
    });
    req.on('error', reject);
    if (body !== undefined) {
      req.write(body);
    }
    req.end();
  });
}

async function withServer(handler, callback) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await callback(server);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('a real HTTP GET /health returns the health JSON', async () => {
  await withServer(createApp(), async (server) => {
    const response = await request(server, { pathname: '/health' });
    assert.equal(response.status, 200);
    assert.deepEqual(response.json, { status: 'ok' });
    assert.match(response.headers['content-type'], /application\/json/);
  });
});

test('unknown API routes return a consistent JSON 404', async () => {
  await withServer(createApp(), async (server) => {
    const response = await request(server, { pathname: '/api/not-a-route' });
    assert.equal(response.status, 404);
    assert.deepEqual(response.json, {
      error: { code: 'NOT_FOUND', message: 'API route not found.' },
    });
  });
});

test('malformed JSON returns a JSON 400 with the shared error shape', async () => {
  await withServer(createApp(), async (server) => {
    const response = await request(server, {
      method: 'POST',
      pathname: '/api/anything',
      body: '{"bad":',
      headers: { 'content-type': 'application/json' },
    });
    assert.equal(response.status, 400);
    assert.deepEqual(response.json, {
      error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' },
    });
  });
});

test('static serving returns public files and blocks paths outside public', async () => {
  await withServer(createApp(), async (server) => {
    const home = await request(server, { pathname: '/' });
    assert.equal(home.status, 200);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.match(home.text, /Event Ticketing/);

    const traversal = await request(server, { pathname: '/..%2fpackage.json' });
    assert.equal(traversal.status, 404);
    assert.deepEqual(traversal.json, {
      error: { code: 'NOT_FOUND', message: 'File not found.' },
    });
  });
});

test('unexpected handler errors are JSON and do not expose stack traces', async () => {
  const router = new Router();
  router.get('/api/failure', () => {
    throw new Error('private failure details');
  });

  await withServer(createApp({ router }), async (server) => {
    const response = await request(server, { pathname: '/api/failure' });
    assert.equal(response.status, 500);
    assert.deepEqual(response.json, {
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred.' },
    });
    assert.doesNotMatch(response.text, /private failure|at .*\.js/);
  });
});
