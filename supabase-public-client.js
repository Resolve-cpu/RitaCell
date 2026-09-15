const PUBLIC_SUPABASE_URL = "https://srzwsyxkitntqusoiaho.supabase.co";
const PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_YDheMwGFVadfxKNjd6oXVA_zGMMiFdQ";

let publicSupabaseClient = null;
if (window.supabase) {
  publicSupabaseClient = window.supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}
