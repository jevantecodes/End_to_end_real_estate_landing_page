const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const yearNode = document.querySelector("[data-year]");
const revealItems = document.querySelectorAll(".reveal");
const portfolioShell = document.querySelector("[data-portfolio-shell]");
const portfolioTarget = document.querySelector("[data-portfolio-target]");
const zoomButtons = document.querySelectorAll("[data-zoom]");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -48px 0px",
  },
);

revealItems.forEach((item) => revealObserver.observe(item));

if (portfolioShell && portfolioTarget && zoomButtons.length) {
  let scale = 0.84;
  const minScale = 0.68;
  const maxScale = 1.02;
  const step = 0.06;

  const syncPortfolioScale = () => {
    portfolioShell.style.setProperty("--portfolio-scale", String(scale));
    portfolioShell.style.height = `${portfolioTarget.offsetHeight * scale}px`;

    zoomButtons.forEach((button) => {
      const direction = button.getAttribute("data-zoom");
      button.disabled =
        (direction === "in" && scale >= maxScale) ||
        (direction === "out" && scale <= minScale);
    });
  };

  zoomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.getAttribute("data-zoom");

      if (direction === "in") {
        scale = Math.min(maxScale, Number((scale + step).toFixed(2)));
      } else {
        scale = Math.max(minScale, Number((scale - step).toFixed(2)));
      }

      syncPortfolioScale();
    });
  });

  window.addEventListener("resize", syncPortfolioScale);
  syncPortfolioScale();
}
