import { createClient, SupabaseClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anon) { console.warn('Supabase vars missing'); }
let _sb: SupabaseClient | null = null;
export function getSupabase(){
  if(!_sb){ _sb = createClient(url!, anon!, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }); }
  return _sb;
}