/**
 * A `fetch` for Node versions that do not have one.
 *
 * Global fetch arrived in Node 18. This server runs on an older Node on the
 * production host, where every outbound call threw "fetch is not defined" —
 * silently, because each caller caught the error and fell back to its
 * untranslated input. Hindi articles, the article Q&A and the legacy image
 * bridge were all dead for that one reason.
 *
 * Rather than add a dependency for something newer runtimes already have,
 * this installs a small shim over node:https. It covers exactly what the
 * callers use: a method, headers, a string body, and a response with ok,
 * status, text() and json(). On Node 18+ nothing is installed at all.
 */
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { URL } from 'url';

interface ShimResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<any>;
}

const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

function once(url: string, init: any, redirectsLeft: number): Promise<ShimResponse> {
  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (err) {
      reject(new Error(`invalid URL: ${url}`));
      return;
    }
    const send = parsed.protocol === 'http:' ? httpRequest : httpsRequest;
    const body: string | undefined =
      init?.body === undefined || init?.body === null
        ? undefined
        : typeof init.body === 'string'
        ? init.body
        : JSON.stringify(init.body);

    const headers: Record<string, string> = { ...(init?.headers || {}) };
    if (body !== undefined && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-length')) {
      headers['Content-Length'] = String(Buffer.byteLength(body));
    }

    const req = send(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        path: parsed.pathname + parsed.search,
        method: (init?.method || 'GET').toUpperCase(),
        headers,
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
          res.resume();
          resolve(once(new URL(location, url).toString(), init, redirectsLeft - 1));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: status >= 200 && status < 300,
            status,
            statusText: res.statusMessage || '',
            headers: {
              get: (name: string) => {
                const v = res.headers[name.toLowerCase()];
                return v === undefined ? null : Array.isArray(v) ? v.join(', ') : String(v);
              },
            },
            async text() {
              return text;
            },
            async json() {
              return JSON.parse(text);
            },
          });
        });
      }
    );

    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error(`timeout after ${TIMEOUT_MS}ms`)));
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

/** Install the shim if, and only if, the runtime has no fetch of its own. */
export function ensureFetch(): 'native' | 'shim' {
  const g = globalThis as any;
  if (typeof g.fetch === 'function') return 'native';
  g.fetch = (url: any, init?: any) => once(String(url), init, MAX_REDIRECTS);
  return 'shim';
}

export default ensureFetch;
