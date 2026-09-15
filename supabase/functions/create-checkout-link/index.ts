// =========================================================
// RitaCell — Edge Function: cria link de pagamento InfinitePay
// =========================================================
// Recebe os itens do carrinho + dados do cliente, valida os
// preços contra o banco de dados (nunca confia no preço que
// vem do navegador), e pede pra InfinitePay um link de
// pagamento pronto. Devolve esse link pro site redirecionar
// o cliente.
//
// Deploy (via Supabase CLI):
//   supabase functions deploy create-checkout-link
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INFINITEPAY_HANDLE = "ritacell"; // sem o $, conforme a InfinitePay pede
const INFINITEPAY_LINKS_URL = "https://api.checkout.infinitepay.io/links";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, customer, redirect_url } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: "Carrinho vazio." }, 400);
    }
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return json({ error: "Preencha nome, e-mail e telefone." }, 400);
    }

    // ---------- Confere os preços de verdade no banco ----------
    // (nunca confia no preço que o navegador manda — evita que
    // alguém altere o valor antes de enviar o pedido)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const productIds = items.map((i: any) => i.id);
    const { data: products, error: dbError } = await supabaseAdmin
      .from("products")
      .select("id, name, price_cents, active")
      .in("id", productIds);

    if (dbError) return json({ error: "Erro ao consultar produtos." }, 500);

    const infinitePayItems = [];
    let orderTotalCents = 0;

    for (const cartItem of items) {
      const product = products.find((p: any) => p.id === cartItem.id);
      if (!product || !product.active || product.price_cents == null) {
        return json({ error: `Produto indisponível: ${cartItem.id}` }, 400);
      }
      const qty = Math.max(1, Number(cartItem.qty) || 1);
      const description = cartItem.variation
        ? `${product.name} (${cartItem.variation})`
        : product.name;

      infinitePayItems.push({
        quantity: qty,
        price: product.price_cents,
        description,
      });
      orderTotalCents += product.price_cents * qty;
    }

    const orderNsu = `ritacell-${Date.now()}`;

    const infinitePayPayload = {
      handle: INFINITEPAY_HANDLE,
      redirect_url: redirect_url || "https://ritacell.com.br/pedido-confirmado.html",
      order_nsu: orderNsu,
      items: infinitePayItems,
      customer: {
        name: customer.name,
        email: customer.email,
        phone_number: customer.phone,
      },
    };

    const response = await fetch(INFINITEPAY_LINKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(infinitePayPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro InfinitePay:", errText);
      return json({ error: "Não foi possível gerar o link de pagamento." }, 502);
    }

    const result = await response.json();

    return json({ url: result.url, order_nsu: orderNsu, total_cents: orderTotalCents });
  } catch (err) {
    console.error(err);
    return json({ error: "Erro inesperado ao processar o pedido." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
