const CATEGORY_LABELS = {
  capinhas: "Capinhas",
  peliculas: "Películas",
  carregadores: "Carregadores",
  cabos: "Cabos",
  fones: "Fones",
  suportes: "Suportes",
};

// Retorna a foto real do produto quando cadastrada, ou um ícone genérico como fallback
function productMediaHTML(p, iconSize) {
  iconSize = iconSize || 34;
  if (p.image) {
    return `<img src="${p.image}" alt="${p.name}" loading="lazy" />`;
  }
  return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none"><rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
