/* =========================================================
   Atipchai Thai Food — script.js
   Enthält:
   1. Header-Hintergrund beim Scrollen
   2. Mobiles Navigationsmenü
   3. Sanftes Scroll-Reveal (IntersectionObserver)
   4. Live-Status "Geöffnet / Geschlossen" auf Basis der Öffnungszeiten
   5. Aktuelles Jahr im Footer
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

  /* ---------- 4. Live-Status "Geöffnet / Geschlossen" ---------- */
  const hoursStatusEl = document.getElementById("hoursStatus");
  const hoursRows = document.querySelectorAll(".hours-row");

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

    // Passende Öffnungszeiten-Zeile optisch hervorheben
    hoursRows.forEach((row) => {
      const days = (row.dataset.days || "").split(",").map(Number);
      row.classList.toggle("is-today", days.includes(day));
    });
  };

  updateOpenStatus();
  // Status jede Minute neu prüfen, damit er auch bei offener Seite aktuell bleibt
  setInterval(updateOpenStatus, 60 * 1000);

  /* ---------- 5. Aktuelles Jahr im Footer ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
