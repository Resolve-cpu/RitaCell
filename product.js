// RitaCell — página de produto (produto.html)

function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const allProducts = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  const product = allProducts.find((p) => p.id === productId) || allProducts[0];
  if (!product) return; // catálogo ainda vazio

  const isCompatProduct = !!product.compatOptions;

// Sistema antigo de variação simples (ex.: cor) — usado só quando o produto
// não tem compatOptions (marca/modelo).
let selectedVariation = product.variations?.[0]?.options?.[0] || null;

// Sistema de compatibilidade marca → modelo
let selectedBrand = null;
let selectedModel = null;

let qty = 1;

const pageTitleEl = document.getElementById("pageTitle");
if (pageTitleEl) pageTitleEl.textContent = `${product.name} — RitaCell Comércio`;
document.getElementById("breadcrumbName").textContent = product.name;

function compatStockFor(brand, model) {
  const key = `${brand}|${model}`;
  const stock = product.compatStock ? product.compatStock[key] : undefined;
  return typeof stock === "number" ? stock : 0;
}

function benefitsHTML() {
  if (!product.benefits || product.benefits.length === 0) return "";
  const items = product.benefits
    .map(
      (b) => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>${b}</li>`
    )
    .join("");
  return `
    <div class="section-head">
      <p class="eyebrow">Por que escolher</p>
      <h2 style="font-size:1.2rem;">Por que escolher este produto?</h2>
    </div>
    <ul class="benefits-list">${items}</ul>
  `;
}

function variationHTML() {
  if (!product.variations || product.variations.length === 0) return "";
  return product.variations
    .map(
      (v) => `
      <div class="variation-group">
        <label class="vg-label">${v.name}</label>
        <div class="variation-options">
          ${v.options
            .map(
              (opt) =>
                `<button type="button" class="variation-option" data-variation="${opt}" aria-pressed="${opt === selectedVariation}">${opt}</button>`
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");
}

// Seletor de compatibilidade: Marca -> Modelo, com estoque por combinação.
// Estrutura preparada para uma 3ª variação futura (ex.: cor) — bastaria
// adicionar mais um nível aqui e ajustar a chave usada em compatStockFor.
function compatSelectorHTML() {
  if (!isCompatProduct) return "";

  const brands = Object.keys(product.compatOptions);
  const models = selectedBrand ? product.compatOptions[selectedBrand] || [] : [];

  let statusHTML = "";
  if (selectedBrand && selectedModel) {
    const stock = compatStockFor(selectedBrand, selectedModel);
    statusHTML =
      stock > 0
        ? `<p class="compat-status ok"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Compatível com ${selectedModel}</p>`
        : `<p class="compat-status out">Esgotado para ${selectedModel} no momento</p>`;
  }

  return `
    <div class="variation-group">
      <label class="vg-label">Marca</label>
      <div class="variation-options">
        ${brands
          .map(
            (b) =>
              `<button type="button" class="variation-option" data-compat-brand="${b}" aria-pressed="${b === selectedBrand}">${b}</button>`
          )
          .join("")}
      </div>
    </div>
    ${
      selectedBrand
        ? `<div class="variation-group">
            <label class="vg-label">Modelo</label>
            <div class="variation-options">
              ${models
                .map((m) => {
                  const stock = compatStockFor(selectedBrand, m);
                  const out = stock <= 0;
                  return `<button type="button" class="variation-option" data-compat-model="${m}" aria-pressed="${m === selectedModel}" ${out ? "disabled" : ""}>${m}${out ? " (esgotado)" : ""}</button>`;
                })
                .join("")}
            </div>
          </div>`
        : ""
    }
    ${statusHTML}
    <a class="compat-help-link" href="${modeloDuvidaLink()}" target="_blank" rel="noopener">Não sabe qual é o modelo do seu celular?</a>
  `;
}

function isSelectionValid() {
  if (!isCompatProduct) return true;
  if (!selectedBrand || !selectedModel) return false;
  return compatStockFor(selectedBrand, selectedModel) > 0;
}

function renderProduct() {
  const priceHTML = product.price
    ? `<div class="p-price">${money(product.price)}</div>`
    : `<div class="p-price consult">Sob consulta</div>`;

  const buyDisabled = product.price && isCompatProduct && !isSelectionValid();
  const buyLabel =
    isCompatProduct && selectedBrand && selectedModel && compatStockFor(selectedBrand, selectedModel) <= 0
      ? "Esgotado"
      : "Comprar agora";

  const ctaHTML = product.price
    ? `
      <div class="product-cta-row">
        <button class="btn btn-primary" id="buyNowBtn" style="flex:1;" ${buyDisabled ? "disabled" : ""}>${buyLabel}</button>
        <a class="btn btn-outline" href="${duvidaLink()}" target="_blank" rel="noopener">Tirar uma dúvida</a>
      </div>
      ${
        !product.checkoutLink
          ? `<div class="checkout-pending-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0; margin-top:2px;"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              <span>Compra online deste produto em configuração — ao clicar em "Comprar agora" você fala direto com a gente pelo WhatsApp para fechar o pedido.</span>
            </div>`
          : ""
      }
    `
    : `
      <div class="product-cta-row">
        <a class="btn btn-primary" href="${duvidaLink()}" target="_blank" rel="noopener" style="flex:1;">Consultar disponibilidade</a>
      </div>
    `;

  let stockLabel = "";
  if (isCompatProduct) {
    if (selectedBrand && selectedModel) {
      const s = compatStockFor(selectedBrand, selectedModel);
      stockLabel = s > 0 ? `${s} em estoque` : "";
    }
  } else if (product.stock) {
    stockLabel = `${product.stock} em estoque`;
  }

  document.getElementById("productDetail").innerHTML = `
    <div class="product-gallery">
      <div class="product-gallery-main">
        ${productMediaHTML(product, 72)}
      </div>
      <div class="product-gallery-thumbs">
        ${(product.images || []).map(() => `<div class="thumb"></div>`).join("")}
      </div>
    </div>
    <div class="product-info">
      <h1>${product.name}</h1>
      <p class="p-compat">${product.compatibility || ""}</p>
      ${priceHTML}
      <p class="p-desc">${product.description || ""}</p>
      ${isCompatProduct ? compatSelectorHTML() : variationHTML()}
      ${
        product.price
          ? `<div class="qty-row">
              <div class="qty-stepper">
                <button id="qtyMinus" aria-label="Diminuir">−</button>
                <span id="qtyValue">${qty}</span>
                <button id="qtyPlus" aria-label="Aumentar">+</button>
              </div>
              <span class="stock-tag">${stockLabel}</span>
            </div>`
          : ""
      }
      ${ctaHTML}
      <div class="pickup-note">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
        Compre online e retire na RitaCell
      </div>
    </div>
  `;

  document.getElementById("benefitsSection").innerHTML = benefitsHTML();

  wireInteractions();
}

function duvidaLink() {
  return `https://wa.me/5511953672504?text=${encodeURIComponent("Olá! Vi este produto no site da RitaCell e gostaria de tirar uma dúvida: " + product.name)}`;
}

function modeloDuvidaLink() {
  return `https://wa.me/5511953672504?text=${encodeURIComponent("Olá! Estou vendo o produto \"" + product.name + "\" no site da RitaCell, mas não sei qual é o modelo exato do meu celular. Podem me ajudar a identificar?")}`;
}

function wireInteractions() {
  // Variação simples antiga (cor), quando não é produto de compatibilidade
  document.querySelectorAll("[data-variation]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedVariation = btn.dataset.variation;
      document.querySelectorAll("[data-variation]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
    });
  });

  // Seleção de marca
  document.querySelectorAll("[data-compat-brand]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedBrand = btn.dataset.compatBrand;
      selectedModel = null;
      renderProduct();
    });
  });

  // Seleção de modelo (ignora cliques em modelos esgotados/desabilitados)
  document.querySelectorAll("[data-compat-model]").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => {
      selectedModel = btn.dataset.compatModel;
      renderProduct();
    });
  });

  document.getElementById("qtyMinus")?.addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    document.getElementById("qtyValue").textContent = qty;
  });
  document.getElementById("qtyPlus")?.addEventListener("click", () => {
    qty += 1;
    document.getElementById("qtyValue").textContent = qty;
  });

  document.getElementById("buyNowBtn")?.addEventListener("click", () => {
    if (isCompatProduct && !isSelectionValid()) return;
    const variationLabel = isCompatProduct ? `${selectedBrand} ${selectedModel}` : selectedVariation;
    if (product.checkoutLink) {
      window.location.href = product.checkoutLink;
    } else {
      addToCart(product.id, qty, variationLabel);
    }
  });
}

function renderKit() {
  const kit = (typeof KITS !== "undefined" ? KITS : []).find((k) => k.items.includes(product.id));
  if (!kit) return;
  const items = kit.items.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  const sumPrice = items.reduce((s, p) => s + (p.price || 0), 0);
  document.getElementById("kitSection").innerHTML = `
    <div class="kit-card">
      <div class="kit-thumbs">${items.map(() => `<div class="kt"></div>`).join("")}</div>
      <div>
        <div class="kit-name">${kit.name}</div>
        <div class="kit-items">${items.map((p) => p.name).join(" + ")} · ${money(kit.price || sumPrice)}</div>
      </div>
      <a class="btn btn-outline" href="https://wa.me/5511953672504?text=${encodeURIComponent("Olá! Tenho interesse no " + kit.name + " da RitaCell.")}" target="_blank" rel="noopener">Consultar kit</a>
    </div>
  `;
}

function renderRelated() {
  const related = (product.relatedIds || []).map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  const grid = document.getElementById("relatedGrid");
  const section = document.getElementById("relatedSection");
  if (related.length === 0) {
    section.style.display = "none";
    return;
  }
  grid.innerHTML = related
    .map(
      (p) => `
      <article class="pcard">
        <button type="button" class="pcard-media" data-product-id="${p.id}">${productMediaHTML(p, 30)}</button>
        <div class="pcard-body">
          <button type="button" class="pcard-name-btn" data-product-id="${p.id}"><h3 class="pcard-name">${p.name}</h3></button>
          <div class="pcard-price">${p.price ? money(p.price) : "Sob consulta"}</div>
        </div>
      </article>
    `
    )
    .join("");
}

  renderProduct();
  renderKit();
  renderRelated();
}

window.addEventListener("catalog-ready", () => {
  initProductPage();
  initReveal(document);
});
