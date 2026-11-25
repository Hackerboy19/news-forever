import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { ensureFetch } from '../src/lib/fetchPolyfill';

/** A throwaway HTTP server standing in for an upstream API. */
function serve(
  handler: (req: http.IncomingMessage, res: http.ServerResponse, body: string) => void
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(Buffer.from(c)));
      req.on('end', () => handler(req, res, Buffer.concat(chunks).toString('utf8')));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as any;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

/** Run a body with the runtime's own fetch hidden, as an old Node would be. */
async function withoutNativeFetch<T>(body: () => Promise<T>): Promise<T> {
  const g = globalThis as any;
  const real = g.fetch;
  delete g.fetch;
  try {
    assert.equal(ensureFetch(), 'shim', 'the shim should install when there is no fetch');
    return await body();
  } finally {
    g.fetch = real;
  }
}

test('an existing fetch is left alone', () => {
  const g = globalThis as any;
  const mine = () => Promise.resolve('untouched');
  const real = g.fetch;
  g.fetch = mine;
  try {
    assert.equal(ensureFetch(), 'native');
    assert.equal(g.fetch, mine, 'the runtime fetch must not be replaced');
  } finally {
    g.fetch = real;
  }
});

test('GET returns status, text and parsed JSON', async () => {
  const s = await serve((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json', 'x-seen': req.url || '' });
    res.end(JSON.stringify({ hello: 'दुनिया', path: req.url }));
  });
  try {
    await withoutNativeFetch(async () => {
      const r: any = await (globalThis as any).fetch(`${s.url}/translate?q=hi%20there`);
      assert.equal(r.ok, true);
      assert.equal(r.status, 200);
      assert.equal(r.headers.get('x-seen'), '/translate?q=hi%20there', 'query string must survive');
      const data = await r.json();
      assert.equal(data.hello, 'दुनिया', 'UTF-8 must round-trip');
      assert.equal(data.path, '/translate?q=hi%20there');
    });
  } finally {
    await s.close();
  }
});

test('POST sends the method, headers and body', async () => {
  let got: { method?: string; type?: string; body?: string; len?: string } = {};
  const s = await serve((req, res, body) => {
    got = {
      method: req.method,
      type: req.headers['content-type'] as string,
      body,
      len: req.headers['content-length'] as string,
    };
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
  });
  try {
    await withoutNativeFetch(async () => {
      const payload = JSON.stringify({ contents: [{ parts: [{ text: 'translate me' }] }] });
      const r: any = await (globalThis as any).fetch(`${s.url}/v1/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      assert.equal((await r.json()).ok, true);
      assert.equal(got.method, 'POST');
      assert.equal(got.type, 'application/json');
      assert.equal(got.body, payload);
      assert.equal(got.len, String(Buffer.byteLength(payload)), 'content-length must be set');
    });
  } finally {
    await s.close();
  }
});

test('a non-2xx response is returned, not thrown — ok is false', async () => {
  const s = await serve((_req, res) => {
    res.writeHead(429, { 'content-type': 'text/plain' });
    res.end('slow down');
  });
  try {
    await withoutNativeFetch(async () => {
      const r: any = await (globalThis as any).fetch(s.url + '/');
      assert.equal(r.ok, false);
      assert.equal(r.status, 429);
      assert.equal(await r.text(), 'slow down');
    });
  } finally {
    await s.close();
  }
});

test('redirects are followed', async () => {
  const target = await serve((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"arrived":true}');
  });
  const start = await serve((_req, res) => {
    res.writeHead(302, { location: `${target.url}/final` });
    res.end();
  });
  try {
    await withoutNativeFetch(async () => {
      const r: any = await (globalThis as any).fetch(start.url + '/');
      assert.equal(r.status, 200);
      assert.equal((await r.json()).arrived, true);
    });
  } finally {
    await start.close();
    await target.close();
  }
});

test('a connection failure rejects rather than hanging', async () => {
  const s = await serve(() => {});
  const dead = s.url;
  await s.close();
  await withoutNativeFetch(async () => {
    await assert.rejects(() => (globalThis as any).fetch(dead + '/'), /ECONNREFUSED|socket|connect/i);
  });
});
