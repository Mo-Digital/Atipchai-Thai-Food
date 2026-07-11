/* =========================================================
   Atipchai Thai Food — script.js
   Enthält:
   1. Header-Hintergrund beim Scrollen
   2. Mobiles Navigationsmenü
   3. Sanftes Scroll-Reveal (IntersectionObserver)
   4. Bestseller-Karussell (Autoplay, Pfeile, Touch/Wheel-Steuerung)
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

  /* ---------- 4. Bestseller-Karussell (Autoplay, Pfeile, Touch/Wheel-Steuerung) ---------- */
  const track = document.getElementById("dishTrack");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  if (track) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Karten einmal duplizieren, damit der Autoplay nahtlos von vorne beginnen kann
    const originalCards = Array.from(track.children);
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      track.appendChild(clone);
    });

    // Breite eines einzelnen Kartensatzes (= halbe Gesamtbreite nach der Duplikation)
    let singleSetWidth = 0;
    const measureSetWidth = () => {
      singleSetWidth = track.scrollWidth / 2;
    };
    measureSetWidth();
    window.addEventListener("resize", measureSetWidth);
    window.addEventListener("load", measureSetWidth);

    // Springt nahtlos zurück an den Anfang, sobald der zweite (identische) Kartensatz erreicht ist
    track.addEventListener(
      "scroll",
      () => {
        if (singleSetWidth > 0 && track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth;
        }
      },
      { passive: true }
    );

    const AUTOPLAY_SPEED = 34; // px pro Sekunde – gemütliches, gleichmäßiges Lauftempo
    const RESUME_DELAY = 2500; // ms Inaktivität, bevor der Autoplay wieder startet

    let isPaused = false;
    let isInView = true;
    let resumeTimer = null;

    const pauseAutoplay = () => {
      isPaused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };

    const scheduleResume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        isPaused = false;
      }, RESUME_DELAY);
    };

    if (!prefersReducedMotion) {
      let lastFrameTime = null;

      const tick = (now) => {
        if (lastFrameTime === null) lastFrameTime = now;
        const deltaSeconds = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        if (!isPaused && isInView) {
          track.scrollLeft += AUTOPLAY_SPEED * deltaSeconds;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      // Autoplay pausieren, solange das Karussell nicht sichtbar ist (spart unnötige Arbeit)
      if ("IntersectionObserver" in window) {
        const visibilityObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              isInView = entry.isIntersecting;
            });
          },
          { threshold: 0.1 }
        );
        visibilityObserver.observe(track);
      }
    }

    // Manuelle Interaktion (Hover, Touch, Ziehen) pausiert den Autoplay sofort
    track.addEventListener("mouseenter", pauseAutoplay);
    track.addEventListener("mouseleave", scheduleResume);
    ["touchstart", "pointerdown"].forEach((type) => {
      track.addEventListener(type, pauseAutoplay, { passive: true });
    });
    ["touchend", "touchcancel", "pointerup", "pointercancel"].forEach((type) => {
      track.addEventListener(type, scheduleResume, { passive: true });
    });

    // Vertikales Mausrad-Scrollen in horizontales Scrollen umwandeln ("Maus-Scroll")
    track.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          event.preventDefault();
          track.scrollLeft += event.deltaY;
        }
        pauseAutoplay();
        scheduleResume();
      },
      { passive: false }
    );

    // Scrollt um eine Kartenbreite (inkl. Abstand) je Pfeilklick
    const scrollByCard = (direction) => {
      const card = track.querySelector(".dish-card");
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const amount = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: direction * amount, behavior: "smooth" });
      pauseAutoplay();
      scheduleResume();
    };

    if (prevBtn) prevBtn.addEventListener("click", () => scrollByCard(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => scrollByCard(1));
  }

  /* ---------- 5. Live-Status "Geöffnet / Geschlossen" ---------- */
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

  /* ---------- 6. Aktuelles Jahr im Footer ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
