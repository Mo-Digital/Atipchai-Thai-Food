/* =========================================================
   Atipchai Thai Food — script.js
   Enthält:
   1. Header-Hintergrund beim Scrollen
   2. Mobiles Navigationsmenü
   3. Sanftes Scroll-Reveal (IntersectionObserver)
   4. Bestseller-Karussell (Pfeile + Drag-to-Scroll)
   5. Live-Status "Geöffnet / Geschlossen" auf Basis der Öffnungszeiten
   6. Aktuelles Jahr im Footer
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- 1. Header-Hintergrund beim Scrollen ---------- */
  const header = document.getElementById("siteHeader");

  const updateHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  /* ---------- 2. Mobiles Navigationsmenü ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Menü schließen, sobald ein Link angeklickt wird (mobile UX)
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- 3. Sanftes Scroll-Reveal ---------- */
  const revealTargets = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback ohne IntersectionObserver: Elemente sofort anzeigen
    revealTargets.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- 4. Bestseller-Karussell ---------- */
  const track = document.getElementById("carouselTrack");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  if (track && prevBtn && nextBtn) {
    // Scrollt um eine Kartenbreite (inkl. Abstand) je Klick
    const scrollByCard = (direction) => {
      const card = track.querySelector(".dish-card");
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const amount = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: direction * amount, behavior: "smooth" });
    };

    prevBtn.addEventListener("click", () => scrollByCard(-1));
    nextBtn.addEventListener("click", () => scrollByCard(1));

    // Pfeile am Anfang/Ende deaktivieren
    const updateArrowState = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
    };
    updateArrowState();
    track.addEventListener("scroll", updateArrowState, { passive: true });
    window.addEventListener("resize", updateArrowState);

    // Drag-to-Scroll per Maus für Desktop-Nutzer (zusätzlich zum Touch-Wischen)
    let isDragging = false;
    let dragStartX = 0;
    let scrollStartLeft = 0;

    track.addEventListener("mousedown", (event) => {
      isDragging = true;
      track.classList.add("is-dragging");
      dragStartX = event.pageX;
      scrollStartLeft = track.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      track.classList.remove("is-dragging");
    });

    window.addEventListener("mousemove", (event) => {
      if (!isDragging) return;
      event.preventDefault();
      track.scrollLeft = scrollStartLeft - (event.pageX - dragStartX);
    });
  }

  /* ---------- 5. Live-Status "Geöffnet / Geschlossen" ---------- */
  const hoursStatusEl = document.getElementById("hoursStatus");
  const hoursCards = document.querySelectorAll(".hours-card");

  // Öffnungszeiten als Minuten seit Mitternacht, je Wochentag (0 = Sonntag ... 6 = Samstag)
  const openingHours = {
    0: [[11 * 60, 21 * 60]], // Sonntag: durchgehend
    1: [], // Montag: Ruhetag
    2: [[11 * 60, 14 * 60 + 30], [17 * 60, 21 * 60]], // Dienstag
    3: [[11 * 60, 14 * 60 + 30], [17 * 60, 21 * 60]], // Mittwoch
    4: [[11 * 60, 14 * 60 + 30], [17 * 60, 21 * 60]], // Donnerstag
    5: [[11 * 60, 14 * 60 + 30], [17 * 60, 21 * 60]], // Freitag
    6: [[11 * 60, 21 * 60]], // Samstag: durchgehend
  };

  const updateOpenStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const ranges = openingHours[day];

    const isOpen = ranges.some(([start, end]) => minutesNow >= start && minutesNow < end);

    hoursStatusEl.textContent = isOpen
      ? "Aktuell geöffnet"
      : "Aktuell geschlossen";
    hoursStatusEl.classList.toggle("is-open", isOpen);
    hoursStatusEl.classList.toggle("is-closed", !isOpen);

    // Passende Öffnungszeiten-Karte optisch hervorheben
    hoursCards.forEach((card) => {
      const days = (card.dataset.days || "").split(",").map(Number);
      card.classList.toggle("is-today", days.includes(day));
    });
  };

  updateOpenStatus();
  // Status jede Minute neu prüfen, damit er auch bei offener Seite aktuell bleibt
  setInterval(updateOpenStatus, 60 * 1000);

  /* ---------- 6. Aktuelles Jahr im Footer ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
