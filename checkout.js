// =========================================================
// RitaCell — Checkout
// =========================================================

const CHECKOUT_FUNCTION_URL = "https://srzwsyxkitntqusoiaho.supabase.co/functions/v1/create-checkout-link";
const DELIVERY_FUNCTION_URL = "https://srzwsyxkitntqusoiaho.supabase.co/functions/v1/calculate-delivery";

let deliveryMode = "pickup"; // "pickup" | "delivery"
let deliveryFeeCents = 0;
let deliveryDistanceKm = null;

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
  const total = subtotal + (deliveryMode === "delivery" ? deliveryFeeCents : 0);

  document.getElementById("osSubtotal").textContent = money(subtotal);
  document.getElementById("osTotal").textContent = money(total);
  updateDeliveryRow();

  const totalLabel = document.getElementById("payBtnLabel");
  if (totalLabel) totalLabel.textContent = `Pagar ${money(total)}`;

  const hasUnpricedItem = cart.some((line) => {
    const p = findProduct(line.id);
    return !p || p.price == null;
  });
  const deliveryPending = deliveryMode === "delivery" && deliveryFeeCents === 0;
  payBtn.disabled = hasUnpricedItem || deliveryPending;

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

function updateDeliveryRow() {
  const row = document.getElementById("deliveryRow");
  const label = document.getElementById("deliveryRowLabel");
  const value = document.getElementById("deliveryRowValue");

  if (deliveryMode === "pickup") {
    row.classList.add("free");
    label.textContent = "Retirada";
    value.textContent = "Grátis — retire na loja";
  } else if (deliveryFeeCents > 0) {
    row.classList.remove("free");
    label.textContent = `Entrega (${deliveryDistanceKm} km)`;
    value.textContent = money(deliveryFeeCents);
  } else {
    row.classList.remove("free");
    label.textContent = "Entrega";
    value.textContent = "A calcular";
  }
}

function setFreteStatus(message, kind) {
  const el = document.getElementById("freteStatus");
  el.textContent = message || "";
  el.classList.toggle("ok", kind === "ok");
  el.classList.toggle("error", kind === "error");
}

function setDeliveryMode(mode) {
  deliveryMode = mode;
  document.getElementById("modePickupBtn").classList.toggle("active", mode === "pickup");
  document.getElementById("modeDeliveryBtn").classList.toggle("active", mode === "delivery");
  document.getElementById("pickupInfo").style.display = mode === "pickup" ? "flex" : "none";
  document.getElementById("deliveryInfo").style.display = mode === "delivery" ? "block" : "none";

  if (mode === "pickup") {
    deliveryFeeCents = 0;
    deliveryDistanceKm = null;
    setFreteStatus("", null);
  }
  renderCheckoutSummary();
}

async function handleCalcFrete() {
  const addressInput = document.getElementById("deliveryAddress");
  const address = addressInput.value.trim();
  if (address.length < 8) {
    setFreteStatus("Digite o endereço completo (rua, número e bairro).", "error");
    return;
  }

  const btn = document.getElementById("calcFreteBtn");
  btn.disabled = true;
  setFreteStatus("Calculando distância até você...", null);

  try {
    const response = await fetch(DELIVERY_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      setFreteStatus(data.error || "Não foi possível calcular o frete agora.", "error");
      deliveryFeeCents = 0;
      deliveryDistanceKm = null;
      renderCheckoutSummary();
      return;
    }

    if (!data.deliverable) {
      setFreteStatus(data.message || "Fora da área de entrega automática.", "error");
      deliveryFeeCents = 0;
      deliveryDistanceKm = null;
      renderCheckoutSummary();
      return;
    }

    deliveryFeeCents = data.fee_cents;
    deliveryDistanceKm = data.distance_km;
    setFreteStatus(`Entrega de ${data.distance_km} km — ${money(data.fee_cents)}`, "ok");
    renderCheckoutSummary();
  } catch (err) {
    setFreteStatus("Erro de conexão ao calcular o frete. Tente novamente.", "error");
  } finally {
    btn.disabled = false;
  }
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

  if (deliveryMode === "delivery" && deliveryFeeCents === 0) {
    setPayStatus("Calcule o frete antes de pagar.", true);
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
        delivery:
          deliveryMode === "delivery"
            ? {
                address: document.getElementById("deliveryAddress").value.trim(),
                distance_km: deliveryDistanceKm,
                fee_cents: deliveryFeeCents,
              }
            : null,
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
  document.getElementById("modePickupBtn").addEventListener("click", () => setDeliveryMode("pickup"));
  document.getElementById("modeDeliveryBtn").addEventListener("click", () => setDeliveryMode("delivery"));
  document.getElementById("calcFreteBtn").addEventListener("click", handleCalcFrete);
});
