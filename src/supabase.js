import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

function build(token) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: token ? { 'X-Edit-Token': token } : {} }
  });
}

let _client = build(null);

export function getClient() {
  return _client;
}

export function rebuildClient(token) {
  _client = build(token);
}
