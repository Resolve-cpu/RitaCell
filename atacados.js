// RitaCell — Catálogo de Atacado (atacados.html)

let atacadoCat = "todos";
let atacadoQuery = "";

function wholesaleCardHTML(p) {
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
        <div class="wholesale-min-tag">Mínimo: ${p.minOrderQty || 10} unidades</div>
        <div class="pcard-cta">
          <button type="button" class="btn btn-outline" data-product-id="${p.id}">Ver detalhes</button>
        </div>
      </div>
    </article>
  `;
}

function renderAtacadoGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const all = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter((p) => p.isWholesale);
  let list = atacadoCat === "todos" ? all : all.filter((p) => p.category === atacadoCat);
  if (atacadoQuery.trim()) {
    const q = atacadoQuery.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
  }
  grid.innerHTML = list.length
    ? list.map(wholesaleCardHTML).join("")
    : `<p style="grid-column:1/-1; color:var(--text-soft); padding:24px 0;">Nenhum produto de atacado disponível no momento. Fale no <a href="https://wa.me/5511953672504" target="_blank" rel="noopener" style="color:var(--blue); font-weight:700;">WhatsApp</a> para consultar condições especiais.</p>`;
}

function initAtacadoPage() {
  const row = document.getElementById("filterRow");
  if (!row) return;

  const params = new URLSearchParams(window.location.search);
  const catFromUrl = params.get("cat");
  const cats = Object.keys(CATEGORY_LABELS);
  atacadoCat = catFromUrl && cats.includes(catFromUrl) ? catFromUrl : "todos";
  atacadoQuery = "";

  cats.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip";
    btn.type = "button";
    btn.dataset.cat = c;
    btn.setAttribute("aria-pressed", c === atacadoCat ? "true" : "false");
    btn.textContent = CATEGORY_LABELS[c] || c;
    row.appendChild(btn);
  });

  row.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    atacadoCat = btn.dataset.cat;
    [...row.querySelectorAll(".filter-chip")].forEach((c) => c.setAttribute("aria-pressed", c === btn ? "true" : "false"));
    renderAtacadoGrid();
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    atacadoQuery = e.target.value;
    renderAtacadoGrid();
  });

  renderAtacadoGrid();
}

window.addEventListener("catalog-ready", () => {
  initAtacadoPage();
  initReveal(document);
});
