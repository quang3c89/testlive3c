/* Live3C — supabase.js */
import {
  SUPABASE_URL,
  SUPABASE_KEY,
  LS_KEY_URL_LANDING,
  LS_KEY_KEY_LANDING,
  LS_KEY_URL_TOURNAMENT,
  LS_KEY_KEY_TOURNAMENT,
} from './config.js';

/**
 * Đọc URL/key từ options, rồi localStorage (landing + tournament keys), rồi config.
 */
export function resolveSupabaseClient(overrides = {}) {
  const baseUrl =
    overrides.baseUrl ??
    localStorage.getItem(LS_KEY_URL_LANDING) ??
    localStorage.getItem(LS_KEY_URL_TOURNAMENT) ??
    SUPABASE_URL;
  const apiKey =
    overrides.apiKey ??
    localStorage.getItem(LS_KEY_KEY_LANDING) ??
    localStorage.getItem(LS_KEY_KEY_TOURNAMENT) ??
    SUPABASE_KEY;
  return { baseUrl: (baseUrl || '').trim(), apiKey: (apiKey || '').trim() };
}

/**
 * @param {string} table - đường dẫn REST sau /rest/v1/ (có thể kèm query)
 * @param {string} method
 * @param {object|Array|null} body
 * @param {string|null} filter - chuỗi query bổ sung (không có dấu ? đầu); nối vào table nếu chưa có ?
 * @param {{ baseUrl?: string, apiKey?: string, extraHeaders?: Record<string,string> }} [options]
 */
export async function supaFetch(table, method = 'GET', body = null, filter = null, options = {}) {
  const { baseUrl, apiKey } = resolveSupabaseClient(options);
  if (!baseUrl || !apiKey) return null;

  let path = table;
  if (filter) {
    path += path.includes('?') ? `&${filter}` : `?${filter}`;
  }
  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/${path}`;
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Prefer:
      method === 'GET'
        ? 'count=exact'
        : 'return=representation,resolution=merge-duplicates',
  };
  if (options.extraHeaders) Object.assign(headers, options.extraHeaders);
  const opts = { method, headers };
  if (body != null) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status}: ${t}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : null;
}

export async function getTournaments(options = {}) {
  const filter =
    'order=created_at.desc&select=id,name,date_str,location,prize,format,status,cover_url,description,created_at';
  return supaFetch('tournaments', 'GET', null, filter, options);
}

export async function getTournamentById(id, options = {}) {
  const filter = `id=eq.${encodeURIComponent(id)}&select=*`;
  const rows = await supaFetch('tournaments', 'GET', null, filter, options);
  if (rows && Array.isArray(rows) && rows.length) return rows[0];
  return null;
}

/** TODO: filter theo tournament_id khi schema có cột liên kết */
export async function getPlayers(tournamentId, options = {}) {
  void tournamentId;
  void options;
  return null;
}

/** TODO: PATCH tournaments hoặc bảng bracket tùy schema */
export async function updateMatch(tournamentId, bracket, options = {}) {
  void tournamentId;
  void bracket;
  void options;
  return null;
}
