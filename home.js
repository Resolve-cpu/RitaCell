// RitaCell — Home (index.html)

let homeBound = false;

function bestSellerCardHTML(p) {
  const catLabel = CATEGORY_LABELS[p.category] || p.category;
  const priceHTML = p.price ? `<div class="pcard-price">${money(p.price)}</div>` : `<div class="pcard-price consult">Sob consulta</div>`;
  return `
    <article class="pcard">
      <button type="button" class="pcard-media" data-product-id="${p.id}" aria-label="${p.name}">
        ${productMediaHTML(p)}
      </button>
      <div class="pcard-body">
        <span class="pcard-cat">${catLabel}</span>
        <button type="button" class="pcard-name-btn" data-product-id="${p.id}"><h3 class="pcard-name">${p.name}</h3></button>
        ${priceHTML}
        <div class="pcard-cta">
          ${p.price
            ? `<button class="btn btn-primary" data-add="${p.id}">Comprar</button>`
            : `<button type="button" class="btn btn-outline" data-product-id="${p.id}">Ver detalhes</button>`}
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const grid = document.getElementById("bestSellersGrid");
  if (!grid) return;
  if (!homeBound) {
    homeBound = true;
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      addToCart(btn.dataset.add, 1);
    });
  }
  const featured = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter((p) => p.featured).slice(0, 6);
  grid.innerHTML = featured.length
    ? featured.map(bestSellerCardHTML).join("")
    : `<p style="grid-column:1/-1; color:var(--text-soft); padding:24px 0;">Nenhum produto em destaque no momento.</p>`;
}

window.addEventListener("catalog-ready", () => {
  renderHome();
  initReveal(document);
});
