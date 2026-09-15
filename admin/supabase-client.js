// =========================================================
// RitaCell Admin — Conexão com o Supabase
// =========================================================
// Preencha os dois valores abaixo assim que criar seu projeto
// no supabase.com:
//
// SUPABASE_URL  -> "Project Settings" > "API" > "Project URL"
// SUPABASE_ANON_KEY -> "Project Settings" > "API" > "anon public"
//
// IMPORTANTE: use somente a chave "anon public" aqui. Ela é
// feita para ficar no navegador (protegida pelas regras RLS
// do banco). NUNCA cole a chave "service_role" em nenhum
// arquivo do site — essa é secreta e dá acesso total ao banco,
// ignorando as regras de segurança.
// =========================================================

const SUPABASE_URL = "https://srzwsyxkitntqusoiaho.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YDheMwGFVadfxKNjd6oXVA_zGMMiFdQ";

const supabaseConfigured =
  SUPABASE_URL !== "COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE" &&
  SUPABASE_ANON_KEY !== "COLE_AQUI_A_CHAVE_ANON_PUBLIC";

let supabaseClient = null;

if (supabaseConfigured && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function requireSupabaseConfigured() {
  if (!supabaseConfigured) {
    document.body.innerHTML = `
      <div style="max-width:480px; margin:80px auto; padding:32px; font-family: Inter, sans-serif; text-align:center; color:#14213d;">
        <h1 style="font-size:1.2rem; margin-bottom:12px;">Painel ainda não conectado</h1>
        <p style="color:#5b6480; line-height:1.6;">
          Faltam a URL do projeto e a chave "anon public" do Supabase em
          <code>admin/supabase-client.js</code>. Assim que a RitaCell te
          passar esses dados, cole-os no início do arquivo e o painel
          vai funcionar normalmente.
        </p>
      </div>
    `;
    return false;
  }
  return true;
}
