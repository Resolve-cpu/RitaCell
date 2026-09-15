function mapProductRow(row) {
  const hasCompat = !!row.has_compat_variation;
  const compatOptions = {};
  const compatStock = {};

  if (hasCompat && Array.isArray(row.product_variants)) {
    row.product_variants.forEach((v) => {
      if (!compatOptions[v.brand]) compatOptions[v.brand] = [];
      compatOptions[v.brand].push(v.model);
      compatStock[`${v.brand}|${v.model}`] = v.stock;
    });
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    brand: row.brand || "Universal",
    model: hasCompat ? "Vários modelos" : row.brand || "",
    price: row.price_cents,
    stock: row.stock || 0,
    images: row.images && row.images.length ? row.images : [],
    image: row.images && row.images[0] ? row.images[0] : null,
    description: row.description || "",
    compatibility: row.compatibility_note || "",
    compatOptions: hasCompat ? compatOptions : undefined,
    compatStock: hasCompat ? compatStock : undefined,
    variations: [],
    benefits: row.benefits || [],
    relatedIds: [],
    checkoutLink: row.checkout_link || null,
    featured: !!row.featured,
  };
}

function mapKitRow(row) {
  return {
    id: row.id,
    name: row.name,
    items: row.item_ids || [],
    price: row.price_cents,
    checkoutLink: row.checkout_link || null,
  };
}

async function loadCatalogData() {
  if (!publicSupabaseClient) {
    window.PRODUCTS = [];
    window.KITS = [];
    window.dispatchEvent(new Event("catalog-ready"));
    return;
  }

  const { data: productRows, error: productsError } = await publicSupabaseClient
    .from("products")
    .select("*, product_variants(*)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  const { data: kitRows } = await publicSupabaseClient
    .from("kits")
    .select("*")
    .eq("active", true);

  if (productsError) {
    console.error("Erro ao carregar produtos:", productsError.message);
  }

  window.PRODUCTS = (productRows || []).map(mapProductRow);
  window.KITS = (kitRows || []).map(mapKitRow);

  window.dispatchEvent(new Event("catalog-ready"));
}

loadCatalogData();
