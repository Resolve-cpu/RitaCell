// =========================================================
// RitaCell — Checkout
// =========================================================

// Troque pela URL real da sua Edge Function depois do deploy:
// https://SEU_PROJETO.supabase.co/functions/v1/create-checkout-link
const CHECKOUT_FUNCTION_URL = "https://srzwsyxkitntqusoiaho.supabase.co/functions/v1/create-checkout-link";

function renderCheckoutSummary() {
  const cart = getCart();
  const itemsEl = document.getElementById("coItems");
  const emptyEl = document.getElementById("coEmpty");
  const summaryCard = document.getElementById("coSummaryCard");
  const payBtn = document.getElementById("payBtn");

  if (cart.length === 0) {
    summaryCard.style.display = "none";
    emptyEl.style.display = "block";
    payBtn.disabled = true;
    return;
  }

  summaryCard.style.display = "block";
  emptyEl.style.display = "none";

  itemsEl.innerHTML = cart
    .map((line) => {
      const p = findProduct(line.id);
      if (!p) return "";
      const priceLabel = p.price ? money(p.price) : "Sob consulta";
      return `
        <div class="os-item">
          <div class="thumb">${productMediaHTML(p, 22)}</div>
          <div class="meta">
            <b>${p.name}</b>
            ${line.variation ? `<div class="colour">${line.variation}</div>` : ""}
            <div class="price">${priceLabel}</div>
          </div>
          <div class="qty-stepper">
            <button type="button" data-qty-minus="${line.key}" aria-label="Diminuir">−</button>
            <span>${line.qty}</span>
            <button type="button" data-qty-plus="${line.key}" aria-label="Aumentar">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  const subtotal = cartSubtotal();
  document.getElementById("osSubtotal").textContent = money(subtotal);
  document.getElementById("osTotal").textContent = money(subtotal);

  const totalLabel = document.getElementById("payBtnLabel");
  if (totalLabel) totalLabel.textContent = `Pagar ${money(subtotal)}`;

  const hasUnpricedItem = cart.some((line) => {
    const p = findProduct(line.id);
    return !p || p.price == null;
  });
  payBtn.disabled = hasUnpricedItem;

  const unpricedNote = document.getElementById("unpricedNote");
  if (unpricedNote) unpricedNote.style.display = hasUnpricedItem ? "block" : "none";

  itemsEl.querySelectorAll("[data-qty-minus]").forEach((btn) =>
    btn.addEventListener("click", () => {
      changeCartQty(btn.dataset.qtyMinus, -1);
      renderCheckoutSummary();
    })
  );
  itemsEl.querySelectorAll("[data-qty-plus]").forEach((btn) =>
    btn.addEventListener("click", () => {
      changeCartQty(btn.dataset.qtyPlus, 1);
      renderCheckoutSummary();
    })
  );
}

function setPayStatus(message, isError) {
  const el = document.getElementById("payStatus");
  el.textContent = message || "";
  el.classList.toggle("show", !!message);
  el.classList.toggle("error", !!isError);
}

async function handlePaySubmit() {
  const name = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!name || !email || !phone) {
    setPayStatus("Preencha nome, e-mail e telefone para continuar.", true);
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    setPayStatus("Seu carrinho está vazio.", true);
    return;
  }

  const payBtn = document.getElementById("payBtn");
  payBtn.disabled = true;
  setPayStatus("Gerando seu pagamento...", false);

  try {
    const response = await fetch(CHECKOUT_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        items: cart.map((l) => ({ id: l.id, qty: l.qty, variation: l.variation })),
        customer: { name, email, phone },
        redirect_url: window.location.origin + "/pedido-confirmado.html",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setPayStatus(data.error || "Não foi possível gerar o pagamento. Tente novamente.", true);
      payBtn.disabled = false;
      return;
    }

    window.location.href = data.url;
  } catch (err) {
    setPayStatus("Erro de conexão. Verifique sua internet e tente novamente.", true);
    payBtn.disabled = false;
  }
}

window.addEventListener("catalog-ready", () => {
  renderCheckoutSummary();
  document.getElementById("payBtn").addEventListener("click", handlePaySubmit);
});
