/* Live3C — config.js */
// Runtime env from assets/js/env.js (injected at build time)
export const SUPABASE_URL = (window.__env__?.SUPABASE_URL || 'REPLACE_SUPABASE_URL').trim();
export const SUPABASE_KEY = (window.__env__?.SUPABASE_ANON_KEY || 'REPLACE_SUPABASE_ANON_KEY').trim();
