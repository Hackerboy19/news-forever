/**
 * Client for the cPanel PHP bridge (bridge/nf-bridge.php) — used when the
 * shared-hosting MySQL is not reachable directly (Vercel). Configured via:
 *   BRIDGE_URL  e.g. https://newsforever.in/nf-bridge.php
 *   BRIDGE_KEY  shared secret matching the uploaded file
 * Every call re-verifies the admin's real ci_admin credentials server-side.
 */
import { CIBlog } from '../types.js';
import { AdminUser, mapBlogRow } from './db.js';

export function bridgeConfigured(): boolean {
  return Boolean(process.env.BRIDGE_URL && process.env.BRIDGE_KEY);
}

async function bridgeCall(action: string, body: Record<string, unknown>): Promise<any> {
  const url = `${process.env.BRIDGE_URL}?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bridge-Key': process.env.BRIDGE_KEY || '',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `bridge ${action} ${res.status}`);
  return data;
}

export interface BridgeCreds extends Record<string, unknown> {
  username: string;
  password: string;
}

export async function bridgeVerifyAdmin(creds: BridgeCreds): Promise<AdminUser | null> {
  try {
    return await bridgeCall('login', creds);
  } catch {
    return null;
  }
}

export async function bridgeListBlogs(creds: BridgeCreds, limit = 500): Promise<CIBlog[]> {
  const data = await bridgeCall('list', { ...creds, limit });
  return (data.rows || []).map((row: any, i: number) => mapBlogRow(row, i));
}

export async function bridgeCreateBlog(creds: BridgeCreds, payload: Partial<CIBlog>): Promise<CIBlog> {
  const data = await bridgeCall('create', { ...creds, payload });
  return mapBlogRow(data.row);
}

export async function bridgeUpdateBlog(creds: BridgeCreds, id: number, payload: Partial<CIBlog>): Promise<CIBlog> {
  const data = await bridgeCall('update', { ...creds, id, payload });
  return mapBlogRow(data.row);
}

export async function bridgeDeleteBlog(creds: BridgeCreds, id: number): Promise<boolean> {
  const data = await bridgeCall('delete', { ...creds, id });
  return Boolean(data.success);
}

export async function bridgeBulkBlogs(
  creds: BridgeCreds,
  ids: number[],
  op: 'activate' | 'deactivate' | 'delete'
): Promise<number> {
  const data = await bridgeCall('bulk', { ...creds, ids, op });
  return Number(data.affected || 0);
}
