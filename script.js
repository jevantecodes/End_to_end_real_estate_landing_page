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
  const boardColumns = snapshot.querySelectorAll("[data-board-column]");

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

  if (!boardColumns.length) {
    return;
  }

  const updateBoardColumns = () => {
    boardColumns.forEach((column) => {
      const lane = column.querySelector("[data-board-lane]");
      const countNode = column.querySelector("[data-board-count]");
      const emptyNode = lane?.querySelector("[data-board-empty]");
      const cards = lane?.querySelectorAll("[data-board-card]") ?? [];

      if (countNode) {
        countNode.textContent = String(cards.length);
      }

      if (emptyNode) {
        emptyNode.hidden = cards.length > 0;
      }
    });
  };

  const setCardTheme = (card, lane) => {
    const theme = lane.closest("[data-board-column]")?.dataset.boardTheme;
    const bubbleClasses = [
      "bubble-underwriting",
      "bubble-escrow",
      "bubble-precon",
      "bubble-active",
      "bubble-listed",
    ];

    card.classList.remove(...bubbleClasses);

    if (theme) {
      card.classList.add(`bubble-${theme}`);
    }
  };

  const getDragAfterElement = (lane, clientY) => {
    const candidates = [...lane.querySelectorAll("[data-board-card]:not(.is-dragging)")];

    return candidates.reduce(
      (closest, card) => {
        const box = card.getBoundingClientRect();
        const offset = clientY - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset, element: card };
        }

        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null },
    ).element;
  };

  const cards = snapshot.querySelectorAll("[data-board-card]");
  const lanes = snapshot.querySelectorAll("[data-board-lane]");

  cards.forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      card.classList.add("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.querySelector("h3")?.textContent ?? "");
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      lanes.forEach((lane) => lane.classList.remove("is-over"));
      updateBoardColumns();
    });
  });

  lanes.forEach((lane) => {
    lane.addEventListener("dragenter", (event) => {
      event.preventDefault();
      lane.classList.add("is-over");
    });

    lane.addEventListener("dragover", (event) => {
      event.preventDefault();
      const activeCard = snapshot.querySelector(".is-dragging");

      if (!activeCard) {
        return;
      }

      const afterElement = getDragAfterElement(lane, event.clientY);
      const emptyNode = lane.querySelector("[data-board-empty]");

      if (afterElement) {
        lane.insertBefore(activeCard, afterElement);
      } else if (emptyNode) {
        lane.insertBefore(activeCard, emptyNode);
      } else {
        lane.appendChild(activeCard);
      }

      setCardTheme(activeCard, lane);
    });

    lane.addEventListener("dragleave", (event) => {
      if (event.relatedTarget instanceof Node && lane.contains(event.relatedTarget)) {
        return;
      }

      lane.classList.remove("is-over");
    });

    lane.addEventListener("drop", (event) => {
      event.preventDefault();
      lane.classList.remove("is-over");
      updateBoardColumns();
    });
  });

  updateBoardColumns();
});
