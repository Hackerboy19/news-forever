/**
 * Client-side admin session helpers. Credentials are verified server-side
 * against ci_admin on every write request (stateless serverless auth);
 * sessionStorage only keeps them for the current browser tab.
 */

export interface AdminCredentials {
  username: string;
  password: string;
  name: string;
  admin_id: number;
}

const KEY = 'nf_admin_session';

export function loadAdminSession(): AdminCredentials | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminCredentials) : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(creds: AdminCredentials): void {
  sessionStorage.setItem(KEY, JSON.stringify(creds));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(KEY);
}

export function adminHeaders(creds: AdminCredentials | null): Record<string, string> {
  if (!creds) return {};
  return { 'x-admin-user': creds.username, 'x-admin-pass': creds.password };
}
