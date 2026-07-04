/* =========================================================
   Atipchai Thai Food — script.js
   Enthält:
   1. Header-Hintergrund beim Scrollen
   2. Mobiles Navigationsmenü
   3. Sanftes Scroll-Reveal (IntersectionObserver)
   4. Lightbox für die Bildergalerie
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

  /* ---------- 4. Lightbox für die Bildergalerie ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const galleryImages = document.querySelectorAll(".gallery-item img");

  const openLightbox = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightboxImg.src = "";
    document.body.style.overflow = "";
  };

  galleryImages.forEach((img) => {
    img.addEventListener("click", () => openLightbox(img.currentSrc || img.src, img.alt));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
  });

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
