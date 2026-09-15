-- =========================================================
-- RitaCell — Schema do banco de dados (Supabase / Postgres)
-- =========================================================
-- Como usar:
-- 1. Abra seu projeto em supabase.com
-- 2. Vá em "SQL Editor" (menu lateral)
-- 3. Cole este arquivo inteiro e clique em "Run"
-- 4. Depois, vá em "Authentication" > "Users" > "Add user"
--    e crie o seu login (e-mail + senha) — esse será o
--    usuário admin que acessa o painel /admin
-- =========================================================

-- ---------- Extensão necessária para gerar IDs únicos ----------
create extension if not exists "pgcrypto";

-- =========================================================
-- TABELA: products
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  category text not null,              -- capinhas | peliculas | carregadores | cabos | fones | suportes
  brand text default 'Universal',
  price_cents integer,                 -- null = "sob consulta"
  stock integer default 0,             -- estoque geral (produtos sem variação por marca/modelo)
  images text[] default '{}',          -- URLs das fotos no Storage
  benefits text[] default '{}',        -- lista de diferenciais ("Por que escolher")
  compatibility_note text default '',  -- texto livre acima do seletor (ex.: "Selecione a marca...")
  has_compat_variation boolean default false, -- true = produto usa seletor marca/modelo (capinhas/películas)
  checkout_link text,                  -- link de checkout individual (InfinitePay), quando existir
  active boolean default true,         -- false = produto oculto do site público
  featured boolean default false,      -- true = aparece em "Mais vendidos" na Home
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.products is 'Catálogo de produtos da RitaCell';

-- ---------- Atualiza updated_at automaticamente a cada edição ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =========================================================
-- TABELA: product_variants
-- Estoque por combinação de marca + modelo (+ futura 3ª
-- variação, como cor — basta adicionar a coluna quando precisar)
-- =========================================================
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  brand text not null,
  model text not null,
  stock integer not null default 0,
  created_at timestamptz default now(),
  unique (product_id, brand, model)
);

comment on table public.product_variants is 'Estoque por marca/modelo compatível, ligado a um produto';

-- =========================================================
-- TABELA: kits
-- (Kit Proteção, Kit Carregamento etc. — opcional)
-- =========================================================
create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  item_ids uuid[] not null default '{}',
  price_cents integer,
  checkout_link text,
  active boolean default true,
  created_at timestamptz default now()
);

-- =========================================================
-- SEGURANÇA: Row Level Security (RLS)
-- Regra geral deste site: qualquer visitante pode LER produtos
-- ativos; somente um usuário autenticado (você, logado no painel
-- /admin) pode criar, editar ou excluir.
-- =========================================================

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.kits enable row level security;

-- ---------- Leitura pública (site) ----------
drop policy if exists "Público lê produtos ativos" on public.products;
create policy "Público lê produtos ativos"
  on public.products for select
  using (active = true);

drop policy if exists "Público lê variações de produtos ativos" on public.product_variants;
create policy "Público lê variações de produtos ativos"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.active = true
    )
  );

drop policy if exists "Público lê kits ativos" on public.kits;
create policy "Público lê kits ativos"
  on public.kits for select
  using (active = true);

-- ---------- Escrita apenas para usuário autenticado (admin) ----------
drop policy if exists "Admin gerencia produtos" on public.products;
create policy "Admin gerencia produtos"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin gerencia variações" on public.product_variants;
create policy "Admin gerencia variações"
  on public.product_variants for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin gerencia kits" on public.kits;
create policy "Admin gerencia kits"
  on public.kits for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Observação de segurança: como é uma loja com um único
-- administrador, a regra acima libera escrita para QUALQUER
-- usuário autenticado no projeto. Isso é seguro desde que você
-- não crie outros usuários além do seu próprio login. Se no
-- futuro quiser adicionar mais de um administrador com
-- permissões diferentes, me avise que ajustamos a regra para
-- checar uma tabela de "admins" específica.

-- =========================================================
-- STORAGE: bucket de fotos dos produtos
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Leitura pública das fotos" on storage.objects;
create policy "Leitura pública das fotos"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admin envia fotos" on storage.objects;
create policy "Admin envia fotos"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admin substitui fotos" on storage.objects;
create policy "Admin substitui fotos"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admin remove fotos" on storage.objects;
create policy "Admin remove fotos"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- =========================================================
-- Fim do schema. Depois de rodar este arquivo:
-- 1. Confirme em "Table Editor" que products, product_variants
--    e kits foram criados.
-- 2. Confirme em "Storage" que o bucket "product-images" existe.
-- 3. Crie seu usuário admin em "Authentication" > "Users".
-- 4. Me passe a Project URL e a chave "anon public"
--    (em "Project Settings" > "API") para eu conectar o site.
-- =========================================================
