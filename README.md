# RitaCell Comércio — Site

Site institucional + loja da RitaCell (Vila da Saúde, São Paulo).

## Estrutura

```
index.html            → Home
produtos.html          → Catálogo (aceita ?cat=capinhas etc.)
produto.html           → Página de um produto (?id=...)
assistencia.html       → Fluxo de orçamento de assistência técnica (?motivo=...)
checkout.html          → Resumo do pedido + pagamento via InfinitePay
pedido-confirmado.html → Página de retorno após o pagamento

styles.css             → Todo o CSS do site

script.js               → Comportamento compartilhado (menu, scroll, carrinho, navegação de cards)
home.js / catalog.js / product.js / assistencia.js → lógica específica de cada página
cart.js                 → Carrinho (localStorage)
checkout.js              → Lógica da página de checkout
products-data.js         → Rótulos de categoria + helper de imagem de produto
supabase-public-client.js → Conexão do site com o Supabase (leitura pública)
data-loader.js            → Busca produtos/kits reais no banco de dados

assets/                  → Logo, foto da fachada, fotos de capa das categorias

supabase/functions/create-checkout-link/index.ts
                          → Edge Function que gera o link de pagamento InfinitePay
                          → (já publicada no Supabase — este arquivo é só para
                             referência/histórico, editar direto no painel do
                             Supabase se precisar mudar)

database-schema.sql       → Schema do banco de dados (já aplicado no Supabase —
                             arquivo de referência/histórico)
```

## Como os dados chegam no site

O site **não tem mais um catálogo fixo no código**. Toda a lista de produtos
vem do banco de dados (Supabase) em tempo real, através de `data-loader.js`.
Produtos são cadastrados pelo painel administrativo (`/admin`, entregue à
parte) e aparecem automaticamente aqui assim que marcados como **ativos**.
Produtos marcados como **destaque** aparecem na seção "Mais vendidos" da Home.

## Publicando no GitHub Pages

1. Suba todo o conteúdo desta pasta para a raiz do repositório (não dentro de
   uma subpasta, a menos que configure o GitHub Pages para isso).
2. Em Settings → Pages, escolha a branch principal e a pasta raiz (`/`).
3. O GitHub Pages serve arquivos estáticos normalmente — como não há nenhuma
   etapa de build, não precisa de nenhuma configuração extra.
4. Se for usar um domínio próprio, configure o DNS apontando para o GitHub
   Pages e adicione o domínio nas configurações do repositório (isso cria um
   arquivo `CNAME` automaticamente).

## O que ainda falta preencher

- Link do Facebook e do Perfil da Empresa no Google (rodapé) — hoje aparecem
  como "[link a definir]"
- CNPJ / dados empresariais no rodapé
- Cadastrar os produtos reais pelo painel `/admin`
