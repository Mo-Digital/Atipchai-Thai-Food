/* =========================================================
   Atipchai Thai Food — script.js
   Enthält:
   1. Header-Hintergrund beim Scrollen
   2. Mobiles Navigationsmenü
   3. Sanftes Scroll-Reveal (IntersectionObserver)
   4. Bestseller-Karussell (Autoplay, Pfeile, Touch/Wheel-Steuerung)
   5. Live-Status "Geöffnet / Geschlossen" auf Basis der Öffnungszeiten
   6. Cookie-Consent-Banner (inkl. Google-Analytics-Freischaltung)
   7. Aktuelles Jahr im Footer
   8. Allergene-Accordion (Speisekarte)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- 1. Header-Hintergrund beim Scrollen ---------- */
  const header = document.getElementById("siteHeader");

  // rAF-Throttle: der Scroll-Listener selbst bleibt leichtgewichtig
  // (nur ein gespeicherter Wert), die eigentliche DOM-Änderung passiert
  // höchstens einmal pro Frame — verhindert Layout-Thrashing/Jank beim
  // schnellen Scrollen, ganz ohne IntersectionObserver-Overhead für
  // ein simples Schwellenwert-Kriterium (scrollY > 40).
  let scrollTicking = false;

  const updateHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
    scrollTicking = false;
  };
  updateHeaderState();

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateHeaderState);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  /* ---------- 2. Mobiles Navigationsmenü ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  // Öffnet/schließt das Overlay-Menü und sperrt währenddessen den
  // Hintergrund-Scroll (body.nav-open { overflow: hidden }), damit sich
  // Seite und Menü nicht gleichzeitig durcheinander scrollen lassen.
  const setNavOpen = (isOpen) => {
    mainNav.classList.toggle("is-open", isOpen);
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  };

  navToggle.addEventListener("click", () => {
    setNavOpen(!mainNav.classList.contains("is-open"));
  });

  // Menü schließen, sobald ein Link angeklickt wird (mobile UX)
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setNavOpen(false);
    });
  });

  // Menü per Escape-Taste schließen
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav.classList.contains("is-open")) {
      setNavOpen(false);
    }
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
  // Nur auf index.html vorhanden – auf Impressum/Datenschutz gibt es diesen Block nicht.
  const hoursStatusEl = document.getElementById("hoursStatus");
  const hoursRows = document.querySelectorAll(".hours-row");

  if (hoursStatusEl) {
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
  }

  /* ---------- 6. Cookie-Consent-Banner (inkl. Google-Analytics-Freischaltung) ---------- */
  // Banner ist auf allen Seiten eingebunden (index.html, impressum.html, datenschutz.html).
  const cookieBanner = document.getElementById("cookieBanner");
  const cookieAcceptBtn = document.getElementById("cookieAccept");
  const cookieDeclineBtn = document.getElementById("cookieDecline");
  const CONSENT_STORAGE_KEY = "atipchai-cookie-consent"; // Werte: "accepted" | "declined"

  // TODO: Echte GA4-Mess-ID eintragen, sobald ein Google-Analytics-Konto eingerichtet ist.
  const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

  const loadGoogleAnalytics = () => {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.includes("XXXXXXXXXX")) {
      // Solange keine echte Mess-ID hinterlegt ist, wird bewusst nichts nachgeladen.
      return;
    }
    const gaScript = document.createElement("script");
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    gaScript.async = true;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  };

  if (cookieBanner) {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);

    if (storedConsent === "accepted") {
      loadGoogleAnalytics();
    } else if (storedConsent !== "declined") {
      // Noch keine Entscheidung gespeichert: Banner einblenden
      cookieBanner.hidden = false;
    }

    if (cookieAcceptBtn) {
      cookieAcceptBtn.addEventListener("click", () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
        cookieBanner.hidden = true;
        loadGoogleAnalytics();
      });
    }

    if (cookieDeclineBtn) {
      cookieDeclineBtn.addEventListener("click", () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, "declined");
        cookieBanner.hidden = true;
      });
    }
  }

  /* ---------- 7. Aktuelles Jahr im Footer ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 8. Allergene-Accordion (Speisekarte) ---------- */
  // Nur auf speisekarte.html vorhanden.
  const allergensToggle = document.getElementById("allergensToggle");
  const allergensPanel = document.getElementById("allergensPanel");

  if (allergensToggle && allergensPanel) {
    allergensToggle.addEventListener("click", () => {
      const isOpen = allergensPanel.classList.toggle("is-open");
      allergensToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
});
