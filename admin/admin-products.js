// =========================================================
// RitaCell Admin — painel de produtos
// =========================================================

if (requireSupabaseConfigured()) {
  main();
}

const CATEGORY_LABELS = {
  capinhas: "Capinhas",
  peliculas: "Películas",
  carregadores: "Carregadores",
  cabos: "Cabos",
  fones: "Fones",
  suportes: "Suportes",
};

let allProducts = [];
let searchTerm = "";
let uploadedImages = []; // URLs já enviadas ao Storage para o produto em edição
let variantRows = []; // [{brand, model, stock}]

async function main() {
  // ---------- Guarda de autenticação ----------
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });

  // Se a sessão expirar enquanto o admin está no painel, manda de volta pro login
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.href = "index.html";
  });

  wireUI();
  await loadProducts();
}

// ---------- Carregar produtos ----------
async function loadProducts() {
  const tbody = document.getElementById("productsTableBody");
  const { data, error } = await supabaseClient
    .from("products")
    .select("*, product_variants(*)")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Erro ao carregar produtos: ${error.message}</td></tr>`;
    return;
  }

  allProducts = data || [];
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("productsTableBody");
  const term = searchTerm.trim().toLowerCase();
  const list = term
    ? allProducts.filter((p) => p.name.toLowerCase().includes(term))
    : allProducts;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((p) => {
      const thumb = p.images && p.images[0]
        ? `<img class="pthumb" src="${p.images[0]}" alt="" />`
        : `<div class="pthumb"></div>`;
      const priceLabel = p.price_cents != null ? formatPrice(p.price_cents) : "Sob consulta";
      const stockLabel = p.has_compat_variation
        ? `${(p.product_variants || []).reduce((s, v) => s + (v.stock || 0), 0)} (por modelo)`
        : (p.stock ?? 0);
      const statusBadges = `
        <span class="badge ${p.active ? "badge-active" : "badge-inactive"}">${p.active ? "Ativo" : "Inativo"}</span>
        ${p.featured ? `<span class="badge badge-featured">Destaque</span>` : ""}
      `;
      return `
        <tr>
          <td>${thumb}</td>
          <td>${p.name}</td>
          <td>${CATEGORY_LABELS[p.category] || p.category}</td>
          <td>${priceLabel}</td>
          <td>${stockLabel}</td>
          <td>${statusBadges}</td>
          <td>
            <div class="row-actions">
              <button type="button" class="icon-btn" data-edit="${p.id}" title="Editar">✎</button>
              <button type="button" class="icon-btn" data-toggle-active="${p.id}" title="${p.active ? "Desativar" : "Ativar"}">${p.active ? "⏻" : "▶"}</button>
              <button type="button" class="icon-btn danger" data-delete="${p.id}" title="Excluir">🗑</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openModal(btn.dataset.edit))
  );
  tbody.querySelectorAll("[data-toggle-active]").forEach((btn) =>
    btn.addEventListener("click", () => toggleActive(btn.dataset.toggleActive))
  );
  tbody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete))
  );
}

function formatPrice(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function toggleActive(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;
  const { error } = await supabaseClient.from("products").update({ active: !product.active }).eq("id", id);
  if (error) {
    showToast("Erro ao atualizar: " + error.message, true);
    return;
  }
  showToast(product.active ? "Produto desativado." : "Produto ativado.");
  await loadProducts();
}

async function deleteProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;
  const confirmed = window.confirm(`Excluir "${product.name}"? Essa ação não pode ser desfeita.`);
  if (!confirmed) return;

  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) {
    showToast("Erro ao excluir: " + error.message, true);
    return;
  }
  showToast("Produto excluído.");
  await loadProducts();
}

// ---------- Modal de produto (novo/editar) ----------
function wireUI() {
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderTable();
  });

  document.getElementById("newProductBtn").addEventListener("click", () => openModal(null));
  document.getElementById("cancelModalBtn").addEventListener("click", closeModal);

  document.getElementById("fHasCompat").addEventListener("change", (e) => {
    const on = e.target.checked;
    document.getElementById("variantEditorWrap").style.display = on ? "block" : "none";
    document.getElementById("compatNoteWrap").style.display = on ? "block" : "none";
    document.getElementById("stockFieldWrap").style.display = on ? "none" : "block";
  });

  document.getElementById("addVariantBtn").addEventListener("click", () => {
    variantRows.push({ brand: "", model: "", stock: 0 });
    renderVariantRows();
  });

  document.getElementById("imageInput").addEventListener("change", handleImageUpload);

  document.getElementById("productForm").addEventListener("submit", saveProduct);
}

function openModal(id) {
  const product = id ? allProducts.find((p) => p.id === id) : null;

  document.getElementById("modalTitle").textContent = product ? "Editar produto" : "Novo produto";
  document.getElementById("productId").value = product ? product.id : "";
  document.getElementById("fName").value = product ? product.name : "";
  document.getElementById("fCategory").value = product ? product.category : "capinhas";
  document.getElementById("fBrand").value = product ? product.brand || "Universal" : "Universal";
  document.getElementById("fPrice").value = product && product.price_cents != null
    ? (product.price_cents / 100).toFixed(2).replace(".", ",")
    : "";
  document.getElementById("fStock").value = product ? product.stock ?? 0 : 0;
  document.getElementById("fDescription").value = product ? product.description || "" : "";
  document.getElementById("fBenefits").value = product ? (product.benefits || []).join("\n") : "";
  document.getElementById("fCompatNote").value = product ? product.compatibility_note || "" : "";
  document.getElementById("fCheckoutLink").value = product ? product.checkout_link || "" : "";
  document.getElementById("fActive").checked = product ? product.active : true;
  document.getElementById("fFeatured").checked = product ? !!product.featured : false;

  const hasCompat = product ? !!product.has_compat_variation : false;
  document.getElementById("fHasCompat").checked = hasCompat;
  document.getElementById("variantEditorWrap").style.display = hasCompat ? "block" : "none";
  document.getElementById("compatNoteWrap").style.display = hasCompat ? "block" : "none";
  document.getElementById("stockFieldWrap").style.display = hasCompat ? "none" : "block";

  uploadedImages = product ? [...(product.images || [])] : [];
  renderImageThumbs();

  variantRows = product && product.product_variants
    ? product.product_variants.map((v) => ({ brand: v.brand, model: v.model, stock: v.stock }))
    : [];
  renderVariantRows();

  document.getElementById("formError").classList.remove("show");
  document.getElementById("productModalOverlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("productModalOverlay").classList.add("hidden");
}

function renderVariantRows() {
  const wrap = document.getElementById("variantEditor");
  wrap.innerHTML = variantRows
    .map(
      (v, i) => `
      <div class="variant-row">
        <input type="text" placeholder="Marca (ex.: Apple)" value="${v.brand}" data-variant-brand="${i}" />
        <input type="text" placeholder="Modelo (ex.: iPhone 12)" value="${v.model}" data-variant-model="${i}" />
        <input type="number" min="0" placeholder="Estoque" value="${v.stock}" data-variant-stock="${i}" />
        <button type="button" class="icon-btn danger" data-remove-variant="${i}" title="Remover">✕</button>
      </div>
    `
    )
    .join("");

  wrap.querySelectorAll("[data-variant-brand]").forEach((el) =>
    el.addEventListener("input", (e) => (variantRows[e.target.dataset.variantBrand].brand = e.target.value))
  );
  wrap.querySelectorAll("[data-variant-model]").forEach((el) =>
    el.addEventListener("input", (e) => (variantRows[e.target.dataset.variantModel].model = e.target.value))
  );
  wrap.querySelectorAll("[data-variant-stock]").forEach((el) =>
    el.addEventListener("input", (e) => (variantRows[e.target.dataset.variantStock].stock = Number(e.target.value) || 0))
  );
  wrap.querySelectorAll("[data-remove-variant]").forEach((el) =>
    el.addEventListener("click", (e) => {
      variantRows.splice(Number(e.target.dataset.removeVariant), 1);
      renderVariantRows();
    })
  );
}

function renderImageThumbs() {
  const row = document.getElementById("imageUploadRow");
  const uploadBtn = row.querySelector(".image-upload-btn");
  row.querySelectorAll(".image-thumb-wrap").forEach((el) => el.remove());
  uploadedImages.forEach((url, i) => {
    const wrap = document.createElement("div");
    wrap.className = "image-thumb-wrap";
    wrap.innerHTML = `<img src="${url}" alt="" /><button type="button" data-remove-image="${i}">✕</button>`;
    row.insertBefore(wrap, uploadBtn);
  });
  row.querySelectorAll("[data-remove-image]").forEach((btn) =>
    btn.addEventListener("click", () => {
      uploadedImages.splice(Number(btn.dataset.removeImage), 1);
      renderImageThumbs();
    })
  );
}

async function handleImageUpload(e) {
  const files = [...e.target.files];
  if (files.length === 0) return;

  for (const file of files) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
    const { error } = await supabaseClient.storage.from("product-images").upload(path, file);
    if (error) {
      showToast("Erro ao enviar foto: " + error.message, true);
      continue;
    }
    const { data: publicUrlData } = supabaseClient.storage.from("product-images").getPublicUrl(path);
    uploadedImages.push(publicUrlData.publicUrl);
  }
  renderImageThumbs();
  e.target.value = "";
}

function parsePriceInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const asNumber = parseFloat(normalized);
  if (Number.isNaN(asNumber)) return null;
  return Math.round(asNumber * 100);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function saveProduct(e) {
  e.preventDefault();
  const errorBox = document.getElementById("formError");
  errorBox.classList.remove("show");

  const saveBtn = document.getElementById("saveProductBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const id = document.getElementById("productId").value || null;
    const name = document.getElementById("fName").value.trim();
    const hasCompat = document.getElementById("fHasCompat").checked;

    if (!name) throw new Error("Informe o nome do produto.");
    if (hasCompat && variantRows.some((v) => !v.brand.trim() || !v.model.trim())) {
      throw new Error("Preencha marca e modelo em todas as linhas de variação, ou remova as linhas vazias.");
    }

    const payload = {
      name,
      slug: slugify(name) + (id ? "" : "-" + Date.now().toString(36)),
      category: document.getElementById("fCategory").value,
      brand: document.getElementById("fBrand").value.trim() || "Universal",
      price_cents: parsePriceInput(document.getElementById("fPrice").value),
      stock: hasCompat ? 0 : Number(document.getElementById("fStock").value) || 0,
      description: document.getElementById("fDescription").value.trim(),
      benefits: document
        .getElementById("fBenefits")
        .value.split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      images: uploadedImages,
      compatibility_note: document.getElementById("fCompatNote").value.trim(),
      has_compat_variation: hasCompat,
      checkout_link: document.getElementById("fCheckoutLink").value.trim() || null,
      active: document.getElementById("fActive").checked,
      featured: document.getElementById("fFeatured").checked,
    };

    let productId = id;

    if (id) {
      // ao editar, mantém o slug original
      delete payload.slug;
      const { error } = await supabaseClient.from("products").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await supabaseClient.from("products").insert(payload).select("id").single();
      if (error) throw error;
      productId = data.id;
    }

    // Substitui as variações por completo (mais simples e sem risco de duplicar)
    if (hasCompat) {
      await supabaseClient.from("product_variants").delete().eq("product_id", productId);
      if (variantRows.length > 0) {
        const rows = variantRows.map((v) => ({
          product_id: productId,
          brand: v.brand.trim(),
          model: v.model.trim(),
          stock: v.stock,
        }));
        const { error } = await supabaseClient.from("product_variants").insert(rows);
        if (error) throw error;
      }
    } else if (id) {
      // se o produto deixou de ter variação, limpa as antigas
      await supabaseClient.from("product_variants").delete().eq("product_id", productId);
    }

    showToast("Produto salvo com sucesso.");
    closeModal();
    await loadProducts();
  } catch (err) {
    errorBox.textContent = err.message || "Não foi possível salvar o produto.";
    errorBox.classList.add("show");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar produto";
  }
}

// ---------- Toast ----------
let toastTimer;
function showToast(message, isError) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("error", !!isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
