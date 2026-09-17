// =========================================================
// RitaCell — comportamento compartilhado por todas as páginas
// =========================================================

document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

function updateHeaderScrolled() {
  const scrolled = window.scrollY > 4;
  document.querySelectorAll(".site-header").forEach((h) => h.classList.toggle("scrolled", scrolled));
}
window.addEventListener("scroll", updateHeaderScrolled, { passive: true });
updateHeaderScrolled();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function initReveal(scopeEl) {
  const revealEls = scopeEl.querySelectorAll(".reveal:not(.reveal-bound)");
  revealEls.forEach((el) => el.classList.add("reveal-bound"));
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
}
initReveal(document);

let catCarouselBound = false;
function initCatCarousel(scopeEl) {
  const carousel = scopeEl.querySelector("#catCarousel");
  const dotsWrap = scopeEl.querySelector("#catCarouselDots");
  if (!carousel || !dotsWrap) return;
  const cards = [...carousel.querySelectorAll(".cat-card-v2")];
  dotsWrap.innerHTML = cards.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("");
  const dots = [...dotsWrap.children];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = cards.indexOf(entry.target);
          dots.forEach((d, i) => d.classList.toggle("active", i === idx));
        }
      });
    },
    { root: carousel, threshold: 0.6 }
  );
  cards.forEach((c) => observer.observe(c));

  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;
  let capturedId = null;

  carousel.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    isDown = true;
    moved = 0;
    startX = e.clientX;
    startScroll = carousel.scrollLeft;
    capturedId = e.pointerId;
  });
  carousel.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 6) {
      // só captura o ponteiro (e passa a rolar) depois de confirmar que é
      // um arraste de verdade — assim um clique simples nunca é "sequestrado"
      // pelo carrossel, e o link por baixo do dedo/mouse funciona normalmente
      if (capturedId !== null) {
        carousel.classList.add("dragging");
        try {
          carousel.setPointerCapture(capturedId);
        } catch (err) {
          /* ignora se o ponteiro já não existir mais */
        }
        capturedId = null;
      }
      carousel.scrollLeft = startScroll - dx;
    }
  });
  function endDrag() {
    if (!isDown) return;
    isDown = false;
    carousel.classList.remove("dragging");
  }
  carousel.addEventListener("pointerup", endDrag);
  carousel.addEventListener("pointerleave", endDrag);
  carousel.addEventListener("pointercancel", endDrag);
  carousel.addEventListener("dragstart", (e) => e.preventDefault());
  carousel.addEventListener(
    "click",
    (e) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}


initCatCarousel(document);

// ---------- Menu mobile e carrinho (clique delegado) ----------
document.addEventListener("click", function (e) {
  const navToggle = e.target.closest(".nav-toggle");
  if (navToggle) {
    const header = navToggle.closest(".site-header");
    const mobileNav = header ? header.querySelector(".mobile-nav") : null;
    if (mobileNav) {
      const isOpen = mobileNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    }
    return;
  }

  const cartBtn = e.target.closest(".cart-icon-btn");
  if (cartBtn) {
    openCartDrawer();
    return;
  }

  const cartCloseBtn = e.target.closest("#cartClose");
  if (cartCloseBtn) {
    closeCartDrawer();
    return;
  }

  const cartOverlay = e.target.closest("#cartOverlay");
  if (cartOverlay) {
    closeCartDrawer();
    return;
  }

  // Botões do carrinho lateral (aumentar/diminuir quantidade, remover item)
  const cartMinusBtn = e.target.closest("[data-cart-minus]");
  if (cartMinusBtn) {
    changeCartQty(cartMinusBtn.dataset.cartMinus, -1);
    return;
  }
  const cartPlusBtn = e.target.closest("[data-cart-plus]");
  if (cartPlusBtn) {
    changeCartQty(cartPlusBtn.dataset.cartPlus, 1);
    return;
  }
  const cartRemoveBtn = e.target.closest("[data-cart-remove]");
  if (cartRemoveBtn) {
    removeFromCart(cartRemoveBtn.dataset.cartRemove);
    return;
  }

  // Cards de produto são montados dinamicamente pelo JS (home/catálogo/relacionados)
  // e usam data-product-id para diferenciar entre "adicionar ao carrinho" (data-add)
  // e "abrir a página do produto" (data-product-id sem data-add).
  const addBtn = e.target.closest("[data-add]");
  if (addBtn) return; // já tratado pelo listener específico de cada página

  const prodCard = e.target.closest("[data-product-id]");
  if (prodCard) {
    window.location.href = "produto.html?id=" + encodeURIComponent(prodCard.dataset.productId);
    return;
  }
});

initCartCheckout();

// Garante que o contador do carrinho já apareça certo assim que a página
// carregar (e não só depois de alguma ação do cliente nessa mesma visita)
window.addEventListener("catalog-ready", () => {
  renderCartDrawer();
});
