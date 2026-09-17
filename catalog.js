// RitaCell — Catálogo de produtos (produtos.html)

let produtosCat = "todos";
let produtosQuery = "";

function productCardHTML(p) {
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
            : `<a class="btn btn-outline" href="https://wa.me/5511953672504?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre: " + p.name)}" target="_blank" rel="noopener">Consultar</a>`}
        </div>
      </div>
    </article>
  `;
}

function renderProdutosGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const all = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter((p) => !p.isWholesale);
  let list = produtosCat === "todos" ? all : all.filter((p) => p.category === produtosCat);
  if (produtosQuery.trim()) {
    const q = produtosQuery.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
  }
  grid.innerHTML = list.length
    ? list.map(productCardHTML).join("")
    : `<p style="grid-column:1/-1; color:var(--text-soft); padding:24px 0;">Nenhum produto encontrado. Tente outro termo ou fale no <a href="https://wa.me/5511953672504" target="_blank" rel="noopener" style="color:var(--blue); font-weight:700;">WhatsApp</a>.</p>`;
}

function initProdutosPage() {
  const row = document.getElementById("filterRow");
  if (!row) return;

  const params = new URLSearchParams(window.location.search);
  const catFromUrl = params.get("cat");

  // Usa a lista fixa de categorias do site (não só as que têm produto
  // cadastrado agora) — assim um link "Capinhas" sempre filtra por
  // capinhas de verdade, mesmo que essa categoria esteja vazia no momento.
  const cats = Object.keys(CATEGORY_LABELS);
  produtosCat = catFromUrl && cats.includes(catFromUrl) ? catFromUrl : "todos";
  produtosQuery = "";

  cats.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip";
    btn.type = "button";
    btn.dataset.cat = c;
    btn.setAttribute("aria-pressed", c === produtosCat ? "true" : "false");
    btn.textContent = CATEGORY_LABELS[c] || c;
    row.appendChild(btn);
  });

  row.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    produtosCat = btn.dataset.cat;
    [...row.querySelectorAll(".filter-chip")].forEach((c) => c.setAttribute("aria-pressed", c === btn ? "true" : "false"));
    renderProdutosGrid();
  });

  document.getElementById("productGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    addToCart(btn.dataset.add, 1);
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    produtosQuery = e.target.value;
    renderProdutosGrid();
  });

  renderProdutosGrid();
}

window.addEventListener("catalog-ready", () => {
  initProdutosPage();
  initReveal(document);
});
