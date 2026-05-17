import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

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
