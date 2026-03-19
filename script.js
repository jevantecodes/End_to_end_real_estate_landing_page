const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const yearNode = document.querySelector("[data-year]");
const revealItems = document.querySelectorAll(".reveal");
const portfolioSnapshots = document.querySelectorAll(".portfolio-snapshot");

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

portfolioSnapshots.forEach((snapshot) => {
  const tabs = snapshot.querySelectorAll("[data-portfolio-view-tab]");
  const views = snapshot.querySelectorAll("[data-portfolio-view]");

  if (!tabs.length || !views.length) {
    return;
  }

  const setActiveView = (viewName) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.portfolioViewTab === viewName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    views.forEach((view) => {
      const isActive = view.dataset.portfolioView === viewName;
      view.classList.toggle("is-active", isActive);
      view.hidden = !isActive;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveView(tab.dataset.portfolioViewTab);
    });
  });
});
