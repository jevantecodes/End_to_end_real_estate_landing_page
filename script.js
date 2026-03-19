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
  const boardColumns = [...snapshot.querySelectorAll("[data-board-column]")];

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

  const stageConfig = {
    underwriting: {
      label: "Leads / Underwriting",
      defaultStatus: "Under Review",
      statuses: ["Under Review"],
      bubbleClass: "bubble-underwriting",
      dotClass: "board-stage-underwriting",
    },
    escrow: {
      label: "Under Contract / Escrow",
      defaultStatus: "In Escrow",
      statuses: ["In Escrow"],
      bubbleClass: "bubble-escrow",
      dotClass: "board-stage-escrow",
    },
    precon: {
      label: "Pre-Construction",
      defaultStatus: "Design Intake",
      statuses: ["Design Intake", "Bidding Active"],
      bubbleClass: "bubble-precon",
      dotClass: "board-stage-precon",
    },
    active: {
      label: "Active Construction",
      defaultStatus: "Active Construction",
      statuses: ["Active Construction"],
      bubbleClass: "bubble-active",
      dotClass: "board-stage-active",
    },
    listed: {
      label: "Listed / Sold",
      defaultStatus: "Listed / Sold",
      statuses: ["Listed / Sold"],
      bubbleClass: "bubble-listed",
      dotClass: "board-stage-listed",
    },
  };

  const stageOrder = Object.keys(stageConfig);
  const allStatuses = stageOrder.flatMap((stageKey) => stageConfig[stageKey].statuses);
  const bubbleClasses = stageOrder.map((stageKey) => stageConfig[stageKey].bubbleClass);
  const dotClasses = stageOrder.map((stageKey) => stageConfig[stageKey].dotClass);
  const statusToStage = {};
  const statusClassMap = {
    "Under Review": "portfolio-status-neutral",
    "In Escrow": "portfolio-status-escrow",
    "Design Intake": "portfolio-status-neutral",
    "Bidding Active": "portfolio-status-warning",
    "Active Construction": "portfolio-status-success",
    "Listed / Sold": "portfolio-status-listed",
  };

  stageOrder.forEach((stageKey) => {
    stageConfig[stageKey].statuses.forEach((status) => {
      statusToStage[status] = stageKey;
    });
  });

  const listTable = snapshot.querySelector(".portfolio-list-table");
  const listRows = [...snapshot.querySelectorAll(".portfolio-list-row[data-property]")];
  const cards = [...snapshot.querySelectorAll("[data-board-card][data-property]")];
  const lanes = [...snapshot.querySelectorAll("[data-board-lane]")];
  const lanesByStage = new Map(
    boardColumns.map((column) => [column.dataset.boardTheme, column.querySelector("[data-board-lane]")]),
  );
  const progressBar = snapshot.querySelector(".snapshot-progress");
  const progressSegments = new Map(
    [...snapshot.querySelectorAll("[data-progress-stage]")].map((segment) => [
      segment.dataset.progressStage,
      segment,
    ]),
  );
  const mapPins = new Map(
    [...snapshot.querySelectorAll(".map-pin[data-property]")].map((pin) => [
      pin.dataset.property,
      pin.querySelector(".map-pin-dot"),
    ]),
  );

  const rowMap = new Map();
  const cardMap = new Map();
  const propertyState = new Map();

  const updateStatusCell = (statusCell, select, status) => {
    statusCell.className = "portfolio-status-dot portfolio-status-control";
    statusCell.classList.add(statusClassMap[status] ?? "portfolio-status-neutral");
    select.value = status;
  };

  listRows.forEach((row, index) => {
    const propertyId = row.dataset.property;
    const stageCell = row.querySelector("[data-stage-cell]");
    const statusCell = row.querySelector("[data-status-cell]");
    const initialStatus = statusCell?.textContent.trim() || "";
    const stageKey =
      statusToStage[initialStatus] ||
      stageOrder.find((candidate) => stageConfig[candidate].label === stageCell?.textContent.trim()) ||
      "underwriting";

    const statusSelect = document.createElement("select");
    statusSelect.className = "portfolio-status-select";
    statusSelect.setAttribute("aria-label", `${row.querySelector("strong")?.textContent ?? "Property"} status`);

    allStatuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });

    statusCell.textContent = "";
    statusCell.appendChild(statusSelect);
    updateStatusCell(statusCell, statusSelect, initialStatus || stageConfig[stageKey].defaultStatus);

    rowMap.set(propertyId, {
      row,
      stageCell,
      statusCell,
      statusSelect,
      baseOrder: index,
    });

    propertyState.set(propertyId, {
      stageKey,
      status: statusSelect.value,
      order: index,
    });
  });

  cards.forEach((card) => {
    cardMap.set(card.dataset.property, {
      card,
      statusNode: card.querySelector("[data-card-status]"),
    });
  });

  const sortListRows = () => {
    const orderedIds = [...propertyState.entries()]
      .sort(([, left], [, right]) => {
        const stageDifference =
          stageOrder.indexOf(left.stageKey) - stageOrder.indexOf(right.stageKey);

        if (stageDifference !== 0) {
          return stageDifference;
        }

        return left.order - right.order;
      })
      .map(([propertyId]) => propertyId);

    orderedIds.forEach((propertyId) => {
      const row = rowMap.get(propertyId)?.row;

      if (row) {
        listTable?.appendChild(row);
      }
    });
  };

  const placeCardInLane = (card, lane, clientY = null) => {
    const emptyNode = lane.querySelector("[data-board-empty]");

    if (typeof clientY === "number") {
      const candidates = [...lane.querySelectorAll("[data-board-card]:not(.is-dragging)")];
      const afterElement = candidates.reduce(
        (closest, candidate) => {
          const box = candidate.getBoundingClientRect();
          const offset = clientY - box.top - box.height / 2;

          if (offset < 0 && offset > closest.offset) {
            return { offset, element: candidate };
          }

          return closest;
        },
        { offset: Number.NEGATIVE_INFINITY, element: null },
      ).element;

      if (afterElement) {
        lane.insertBefore(card, afterElement);
        return;
      }
    }

    if (emptyNode) {
      lane.insertBefore(card, emptyNode);
      return;
    }

    lane.appendChild(card);
  };

  const updateMapPin = (propertyId, stageKey) => {
    const pinDot = mapPins.get(propertyId);

    if (!pinDot) {
      return;
    }

    pinDot.classList.remove(...dotClasses);
    pinDot.classList.add(stageConfig[stageKey].dotClass);
  };

  const updateBoardColumns = () => {
    const counts = {};

    boardColumns.forEach((column) => {
      const stageKey = column.dataset.boardTheme;
      const lane = column.querySelector("[data-board-lane]");
      const countNode = column.querySelector("[data-board-count]");
      const emptyNode = lane?.querySelector("[data-board-empty]");
      const cardCount = lane?.querySelectorAll("[data-board-card]").length ?? 0;

      counts[stageKey] = cardCount;

      if (countNode) {
        countNode.textContent = String(cardCount);
      }

      if (emptyNode) {
        emptyNode.hidden = cardCount > 0;
      }
    });

    if (progressBar) {
      stageOrder.forEach((stageKey) => {
        const segment = progressSegments.get(stageKey);

        if (segment) {
          segment.style.flexGrow = String(counts[stageKey] ?? 0);
        }
      });
    }

    progressSegments.forEach((segment, stageKey) => {
      segment.style.opacity = (counts[stageKey] ?? 0) > 0 ? "1" : "0.28";
    });
  };

  const applyPropertyState = (propertyId, stageKey, nextStatus = null, clientY = null) => {
    const state = propertyState.get(propertyId);
    const rowEntry = rowMap.get(propertyId);
    const cardEntry = cardMap.get(propertyId);
    const lane = lanesByStage.get(stageKey);

    if (!state || !rowEntry || !cardEntry || !lane) {
      return;
    }

    const resolvedStatus =
      nextStatus && statusToStage[nextStatus] === stageKey
        ? nextStatus
        : statusToStage[state.status] === stageKey
          ? state.status
          : stageConfig[stageKey].defaultStatus;

    state.stageKey = stageKey;
    state.status = resolvedStatus;

    rowEntry.stageCell.textContent = stageConfig[stageKey].label;
    updateStatusCell(rowEntry.statusCell, rowEntry.statusSelect, resolvedStatus);

    placeCardInLane(cardEntry.card, lane, clientY);
    cardEntry.card.classList.remove(...bubbleClasses);
    cardEntry.card.classList.add(stageConfig[stageKey].bubbleClass);

    if (cardEntry.statusNode) {
      cardEntry.statusNode.textContent = resolvedStatus;
    }

    updateMapPin(propertyId, stageKey);
    sortListRows();
    updateBoardColumns();
  };

  rowMap.forEach((entry, propertyId) => {
    entry.statusSelect.addEventListener("change", () => {
      applyPropertyState(
        propertyId,
        statusToStage[entry.statusSelect.value] ?? propertyState.get(propertyId)?.stageKey ?? "underwriting",
        entry.statusSelect.value,
      );
    });
  });

  let selectedCard = null;

  const clearSelectedCard = () => {
    if (selectedCard) {
      selectedCard.classList.remove("is-picked");
    }

    selectedCard = null;
    lanes.forEach((lane) => lane.classList.remove("is-over"));
  };

  const setSelectedCard = (card) => {
    clearSelectedCard();
    selectedCard = card;
    selectedCard.classList.add("is-picked");
    lanes.forEach((lane) => lane.classList.add("is-over"));
  };

  cards.forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      clearSelectedCard();
      card.classList.add("is-dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.property ?? "");
      }
    });

    card.addEventListener("dragend", () => {
      const lane = card.closest("[data-board-lane]");
      const stageKey = lane?.closest("[data-board-column]")?.dataset.boardTheme;

      card.classList.remove("is-dragging");
      lanes.forEach((boardLane) => boardLane.classList.remove("is-over"));

      if (stageKey && card.dataset.property) {
        applyPropertyState(card.dataset.property, stageKey);
      } else {
        updateBoardColumns();
      }
    });

    card.addEventListener("click", (event) => {
      event.stopPropagation();

      if (selectedCard === card) {
        clearSelectedCard();
        return;
      }

      setSelectedCard(card);
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

      placeCardInLane(activeCard, lane, event.clientY);
      lane.classList.add("is-over");
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
    });

    lane.addEventListener("click", (event) => {
      if (!selectedCard || event.target.closest("[data-board-card]")) {
        return;
      }

      const propertyId = selectedCard.dataset.property;
      const stageKey = lane.closest("[data-board-column]")?.dataset.boardTheme;

      clearSelectedCard();

      if (propertyId && stageKey) {
        applyPropertyState(propertyId, stageKey);
      }
    });
  });

  snapshot.addEventListener("click", (event) => {
    if (!event.target.closest("[data-board-card]") && !event.target.closest("[data-board-lane]")) {
      clearSelectedCard();
    }
  });

  propertyState.forEach((entry, propertyId) => {
    applyPropertyState(propertyId, entry.stageKey, entry.status);
  });
});

const heroSection = document.querySelector(".hero-intro");
const heroVideo = document.querySelector("[data-hero-video]");
const heroCopy = document.querySelector("[data-hero-copy]");
const heroScrollCue = document.querySelector(".hero-scroll-cue");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let queueHeroVideoProgressUpdate = () => {};

const syncHeroVideoToScroll = () => {
  if (!heroSection || !heroVideo || prefersReducedMotion.matches) {
    return;
  }

  let rafId = 0;
  let scrubDuration = 0;
  let isPrimed = false;

  const applyScrollProgress = () => {
    rafId = 0;

    if (!scrubDuration) {
      return;
    }

    const sectionRect = heroSection.getBoundingClientRect();
    const scrollSpan = Math.max(sectionRect.height - window.innerHeight * 0.3, 1);
    const progress = Math.min(Math.max((0 - sectionRect.top) / scrollSpan, 0), 1);

    heroVideo.currentTime = progress * scrubDuration;
  };

  const queueProgressUpdate = () => {
    if (rafId) {
      return;
    }

    rafId = window.requestAnimationFrame(applyScrollProgress);
  };

  queueHeroVideoProgressUpdate = queueProgressUpdate;

  const primeVideo = () => {
    if (isPrimed) {
      return;
    }

    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;

    const playAttempt = heroVideo.play();

    if (playAttempt && typeof playAttempt.then === "function") {
      playAttempt
        .then(() => {
          heroVideo.pause();
          isPrimed = true;
          queueProgressUpdate();
        })
        .catch(() => {
          // Mobile browsers may still require a gesture; keep the fallback listeners below.
        });
    }
  };

  const handleMetadata = () => {
    scrubDuration = Math.max(heroVideo.duration - 0.1, 0);
    heroVideo.pause();
    primeVideo();
    queueProgressUpdate();
  };

  if (heroVideo.readyState >= 1 && Number.isFinite(heroVideo.duration)) {
    handleMetadata();
  } else {
    heroVideo.addEventListener("loadedmetadata", handleMetadata, { once: true });
  }

  heroVideo.pause();
  window.addEventListener("scroll", queueProgressUpdate, { passive: true });
  window.addEventListener("touchmove", queueProgressUpdate, { passive: true });
  window.addEventListener("resize", queueProgressUpdate);
  window.addEventListener("orientationchange", queueProgressUpdate);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      heroVideo.pause();
    } else {
      queueProgressUpdate();
    }
  });

  ["touchstart", "pointerdown", "click"].forEach((eventName) => {
    window.addEventListener(
      eventName,
      () => {
        primeVideo();
        queueProgressUpdate();
      },
      { passive: true, once: true },
    );
  });
};

if (heroVideo) {
  heroVideo.pause();
}

if (heroVideo && prefersReducedMotion.matches) {
  heroVideo.currentTime = 0;
}

syncHeroVideoToScroll();

if (!prefersReducedMotion.matches && window.Lenis) {
  const lenis = new window.Lenis({
    lerp: 0.08,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: 1.05,
  });

  document.documentElement.classList.add("has-lenis");

  lenis.on("scroll", () => {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.update();
    }

    queueHeroVideoProgressUpdate();
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();
      lenis.scrollTo(target, {
        duration: 1.1,
        offset: -18,
      });
    });
  });

  const raf = (time) => {
    lenis.raf(time);
    window.requestAnimationFrame(raf);
  };

  window.requestAnimationFrame(raf);
}

if (!prefersReducedMotion.matches && heroSection && heroCopy && window.gsap) {
  const heroMotionTargets = heroCopy.querySelectorAll(
    ".eyebrow, .hero-stacked-kicker, .hero-stacked-divider, .hero-stacked-word, .hero-stacked-bottom, .hero-actions .button",
  );

  const introTimeline = window.gsap.timeline({
    defaults: {
      ease: "power3.out",
    },
  });

  if (heroVideo) {
    introTimeline.from(heroVideo, {
      opacity: 0.28,
      scale: 1.14,
      duration: 1.8,
      ease: "power2.out",
    });
  }

  introTimeline.from(
    heroMotionTargets,
    {
      opacity: 0,
      y: 36,
      duration: 0.95,
      stagger: 0.08,
    },
    0.12,
  );

  if (heroScrollCue) {
    introTimeline.from(
      heroScrollCue,
      {
        opacity: 0,
        y: 18,
        duration: 0.75,
      },
      0.72,
    );

    window.gsap.to(heroScrollCue, {
      y: 8,
      duration: 1.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  if (window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.to(heroCopy, {
      yPercent: -7,
      ease: "none",
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
}
