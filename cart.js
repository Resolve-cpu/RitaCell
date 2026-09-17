function getCart() {
  let cart;
  try {
    cart = JSON.parse(localStorage.getItem("ritacell_cart") || "[]");
  } catch {
    cart = [];
  }
  // Remove itens "fantasma" — produtos que foram editados/excluídos no
  // painel depois que o cliente já tinha adicionado ao carrinho. Só faz
  // essa limpeza quando o catálogo já carregou de verdade, para não
  // apagar o carrinho à toa antes dos dados do banco chegarem.
  if (typeof PRODUCTS !== "undefined" && PRODUCTS.length > 0) {
    const cleaned = cart.filter((l) => findProduct(l.id));
    if (cleaned.length !== cart.length) {
      cart = cleaned;
      saveCart(cart);
    }
  }
  return cart;
}

function saveCart(cart) {
  localStorage.setItem("ritacell_cart", JSON.stringify(cart));
}

function findProduct(id) {
  return (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).find((p) => p.id === id);
}

function money(cents) {
  if (cents === null || cents === undefined) return "Sob consulta";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function addToCart(id, qty = 1, variation = null) {
  const cart = getCart();
  const key = variation ? `${id}::${variation}` : id;
  const line = cart.find((l) => l.key === key);
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ key, id, variation, qty });
  }
  saveCart(cart);
  renderCartDrawer();
  openCartDrawer();
}

function changeCartQty(key, delta) {
  const cart = getCart();
  const line = cart.find((l) => l.key === key);
  if (!line) return;
  line.qty += delta;
  const filtered = line.qty <= 0 ? cart.filter((l) => l.key !== key) : cart;
  saveCart(filtered);
  renderCartDrawer();
}

function removeFromCart(key) {
  saveCart(getCart().filter((l) => l.key !== key));
  renderCartDrawer();
}

function cartSubtotal() {
  return getCart().reduce((sum, l) => {
    const p = findProduct(l.id);
    return sum + (p && p.price ? p.price * l.qty : 0);
  }, 0);
}

function renderCartDrawer() {
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("cartCheckoutBtn");
  if (!itemsEl) return;

  const cart = getCart();
  const totalQty = cart.reduce((s, l) => s + l.qty, 0);
  document.querySelectorAll(".cart-badge").forEach((el) => {
    el.textContent = totalQty;
    el.classList.toggle("hidden", totalQty === 0);
  });

  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty">Seu carrinho está vazio.<br>Adicione produtos do catálogo.</div>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    itemsEl.innerHTML = cart
      .map((l) => {
        const p = findProduct(l.id);
        if (!p) return "";
        return `
          <div class="cart-line">
            <div class="cart-thumb">${productMediaHTML(p, 20)}</div>
            <div class="cart-line-info">
              <p class="cart-line-name">${p.name}</p>
              ${l.variation ? `<span class="cart-line-variation">${l.variation}</span>` : ""}
              <div class="qty-stepper qty-stepper-sm">
                <button data-cart-minus="${l.key}" aria-label="Diminuir">−</button>
                <span>${l.qty}</span>
                <button data-cart-plus="${l.key}" aria-label="Aumentar">+</button>
              </div>
            </div>
            <div class="cart-line-right">
              <span class="cart-line-total">${money((p.price || 0) * l.qty)}</span>
              <button class="cart-line-remove" data-cart-remove="${l.key}">remover</button>
            </div>
          </div>
        `;
      })
      .join("");
    if (checkoutBtn) checkoutBtn.disabled = false;
  }
  if (totalEl) totalEl.textContent = money(cartSubtotal());
}

function openCartDrawer() {
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("cartOverlay")?.classList.add("open");
}
function closeCartDrawer() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("cartOverlay")?.classList.remove("open");
}

function buildWhatsappCartSummary() {
  const cart = getCart();
  const lines = cart
    .map((l) => {
      const p = findProduct(l.id);
      return p ? `${l.qty}x ${p.name}${l.variation ? " (" + l.variation + ")" : ""}` : "";
    })
    .filter(Boolean)
    .join(", ");
  const total = money(cartSubtotal());
  return encodeURIComponent(
    `Olá! Vim pelo site da RitaCell e gostaria de fechar este pedido: ${lines}. Total estimado: ${total}.`
  );
}

// ---------- INTEGRATION POINT ----------
// A InfinitePay, por enquanto, gera links de checkout individuais por
// produto (product.checkoutLink), sem uma API de carrinho com múltiplos
// itens definida para este projeto ainda. Por isso:
//
// - Se o carrinho tem 1 produto só, com checkoutLink definido → redireciona
//   direto para o link de pagamento daquele produto.
// - Se o carrinho tem mais de 1 produto, ou o produto não tem checkoutLink
//   cadastrado ainda → não inventamos um checkout unificado. Levamos o
//   resumo do pedido pronto para o WhatsApp, para não perder a venda,
//   até definirmos a integração de carrinho multi-produto.
function initCartCheckout() {
  const btn = document.getElementById("cartCheckoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const cart = getCart();
    if (cart.length === 0) return;
    window.location.href = "checkout.html";
  });
}
