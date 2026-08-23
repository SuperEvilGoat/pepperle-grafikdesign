/* pepperle.de — Logik der Kategorie- und Rechtsseiten: dieselbe feststehende
   Bühne wie die Startseite (Logo, Tagline, Kontakt, Kategorien-Leiste,
   Blur-Fades), nur mit einem scrollbaren Werk-Raster statt der Drift-Collage.

   Ausgeliefert wird immer Deutsch, damit Suchmaschinen die deutschen Texte
   indexieren. Englisch wird erst auf Klick eingesetzt (window.PAGE_EN) und in
   localStorage gemerkt (gleicher Schlüssel wie js/app.js), damit die Wahl
   beim Seitenwechsel erhalten bleibt. */
(function () {
  "use strict";

  var LANG_KEY = "pp_lang";
  var track = window.pptrack || function () {};

  // Gleicher Endpunkt wie auf der Startseite (js/app.js) — eigener Cloudflare
  // Worker, Anfragen landen im Dashboard statt per E-Mail.
  var FORM_ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/contact";

  var stage = document.getElementById("stage");
  var scrollPanel = document.querySelector(".om-scroll");

  /* ---------- Auftritt ----------
     Logo, Tagline, Kontakt/Sprache und die Kategorien-Leiste starten mit
     opacity:0 (siehe css/style.css) und blenden über die Klasse .intro-ready
     am #stage ein — aber nur bei einem echten Seitenaufruf (erster Besuch
     oder Neuladen). Kommt man dagegen per Klick von einer anderen Seite
     dieser Website hierher (z. B. Logo → Startseite, Kategorie → Kategorie),
     soll die Bühne einfach sofort da sein, statt bei jedem Wechsel erneut
     aus- und wieder einzublenden. */
  function cameFromThisSite() {
    try {
      return !!document.referrer && new URL(document.referrer).origin === location.origin;
    } catch (e) { return false; }
  }
  function isReload() {
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      return !!nav && nav.type === "reload";
    } catch (e) { return false; }
  }
  if (stage) {
    if (cameFromThisSite() && !isReload()) {
      stage.classList.add("stage-instant", "intro-ready");
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { stage.classList.add("intro-ready"); });
      });
    }
  }

  /* ---------- Abgang ----------
     Beim Wechsel zwischen Kategorien blendet nur das Raster aus (nicht Logo,
     Kontakt oder Navigation — die bleiben ja stehen), bevor die nächste
     Seite geladen wird. Diese blendet ihr eigenes Raster dann wieder ein
     (siehe revealGrid() unten). */
  document.querySelectorAll(".cats-nav a.cat-pill").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var href = a.getAttribute("href");
      if (!href) return;
      e.preventDefault();
      var grid = document.querySelector(".om-grid");
      if (grid) {
        grid.style.transition = "opacity 0.22s ease";
        grid.style.opacity = "0";
      }
      setTimeout(function () { location.href = href; }, grid ? 200 : 0);
    });
  });

  /* --navh-- misst die tatsächliche Höhe der unteren Leiste, damit das Raster
     nicht darunter verschwindet (Fallback im CSS: 150px). Läuft auch bei
     Sprachwechsel/Zeilenumbruch neu, wie schon auf der Startseite. */
  function measureNav() {
    var nav = document.querySelector(".bottom");
    if (!nav) return;
    document.documentElement.style.setProperty("--navh", Math.round(nav.getBoundingClientRect().height) + "px");
  }
  measureNav();
  window.addEventListener("resize", measureNav);
  setInterval(measureNav, 800);

  /* ---------- Sprache ---------- */

  var UI = {
    de: {
      lang: "English",
      contact: "Kontakt",
      tagline: "Illustration und Packungsdesign",
      hint: "Bild anklicken zum Vergrößern",
      works: function (n) { return n + " Arbeiten in dieser Kategorie"; },
      more: "Weitere Kategorien",
      formTitle: "Kontakt aufnehmen",
      formNote: "Anfrage für Illustration oder Verpackungsgrafik",
      name: "Name", mail: "E-Mail", msg: "Nachricht", send: "Senden",
      thanks: "Danke — die Nachricht ist unterwegs."
    },
    en: {
      lang: "Deutsch",
      contact: "Contact",
      tagline: "Illustration and Packaging Design",
      hint: "Click an image to view it",
      works: function (n) { return n + " works in this category"; },
      more: "More categories",
      formTitle: "Get in touch",
      formNote: "Enquiry for illustration or packaging graphics",
      name: "Name", mail: "Email", msg: "Message", send: "Send",
      thanks: "Thank you — your message is on its way."
    }
  };

  function stored() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function store(v) {
    try { localStorage.setItem(LANG_KEY, v); } catch (e) { /* Privatmodus */ }
  }

  var lang = stored() === "en" ? "en" : "de";
  var EN = window.PAGE_EN || null;

  // Deutsche Fassung sichern, bevor sie ersetzt wird (nur Kategorieseiten
  // haben pgH1/pgIntro — auf der Rechtsseite bleiben diese null, applyLang()
  // überspringt den Textwechsel dann einfach).
  var h1El = document.getElementById("pgH1");
  var introEl = document.getElementById("pgIntro");
  var DE = h1El && introEl
    ? { h1: h1El.textContent, intro: Array.prototype.map.call(introEl.querySelectorAll("p"), function (p) { return p.textContent; }) }
    : null;

  function applyLang(next) {
    lang = next;
    var t = UI[next];
    document.documentElement.lang = next === "en" ? "en" : "de";

    var btn = document.getElementById("langBtn");
    if (btn) btn.textContent = t.lang;

    var contact = document.getElementById("contactBtn");
    if (contact) contact.textContent = t.contact;

    var tagline = document.getElementById("tagline");
    if (tagline) tagline.textContent = t.tagline;

    var count = document.getElementById("pgCount");
    if (count) {
      var workCount = document.querySelectorAll(".om-grid figure").length;
      count.textContent = t.works(workCount) + " — " + t.hint;
    }

    var more = document.getElementById("moreCatsBtn");
    if (more) more.textContent = t.more;

    var cTitle = document.getElementById("contactTitle");
    if (cTitle) cTitle.textContent = t.formTitle;
    var cNote = document.getElementById("contactNote");
    if (cNote) cNote.textContent = t.formNote;
    var fName = document.getElementById("fName");
    if (fName) fName.placeholder = t.name;
    var fMail = document.getElementById("fMail");
    if (fMail) fMail.placeholder = t.mail;
    var fMsg = document.getElementById("fMsg");
    if (fMsg) fMsg.placeholder = t.msg;
    var fSend = document.getElementById("fSend");
    if (fSend) fSend.textContent = t.send;
    var cThanks = document.getElementById("thanks");
    if (cThanks) cThanks.textContent = t.thanks;

    // Überschrift und Einleitung nur auf den Kategorieseiten
    var src = next === "en" ? EN : DE;
    if (src && h1El && introEl) {
      h1El.textContent = src.h1;
      introEl.textContent = "";
      src.intro.forEach(function (text) {
        var p = document.createElement("p");
        p.textContent = text;
        introEl.appendChild(p);
      });
    }
  }

  var langBtn = document.getElementById("langBtn");
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      var next = lang === "de" ? "en" : "de";
      store(next);
      applyLang(next);
      track({ type: "cat_select", cat: "lang:" + next });
    });
  }
  // Beim Laden anwenden, falls die Wahl schon getroffen wurde
  if (lang === "en") applyLang("en");

  /* ---------- Scroll sperren, solange ein Overlay offen ist ----------
     Betrifft das innere Raster-Panel (.om-scroll), nicht den body — die
     Bühne selbst ist feststehend (position: fixed), wie auf der Startseite. */
  var lockCount = 0;
  function lockScroll() {
    lockCount++;
    if (scrollPanel) scrollPanel.style.overflowY = "hidden";
  }
  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (!lockCount && scrollPanel) scrollPanel.style.overflowY = "auto";
  }

  /* ---------- Bilder einblenden: oben vor unten ----------
     Das Masonry-Raster (CSS-Spalten) füllt Spalte für Spalte, nicht Zeile
     für Zeile — die Reihenfolge im Quelltext entspricht also nicht der
     Reihenfolge auf dem Bildschirm. Breite/Höhe jedes Bilds stehen schon vor
     dem Laden als width/height-Attribut fest, das Layout ist damit sofort
     korrekt messbar; erst danach gestaffelt von oben nach unten einblenden. */
  function revealGrid() {
    var figures = document.querySelectorAll(".om-grid figure");
    if (!figures.length) return;
    requestAnimationFrame(function () {
      var items = Array.prototype.map.call(figures, function (f) {
        var r = f.getBoundingClientRect();
        return { f: f, top: r.top, left: r.left };
      });
      items.sort(function (a, b) { return (a.top - b.top) || (a.left - b.left); });
      items.forEach(function (item, i) {
        item.f.style.animationDelay = Math.min(0.9, 0.05 + i * 0.025).toFixed(3) + "s";
        item.f.classList.add("om-figure-in");
      });
    });
  }
  revealGrid();

  /* ---------- Lightbox ---------- */

  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var openedAt = 0;
  var openSrc = null;

  function flushView() {
    if (!openSrc || !openedAt) return;
    track({ type: "img_view", img: openSrc, cat: window.PAGE_CAT || null, dur_ms: Date.now() - openedAt });
    openedAt = 0;
  }

  function openLb(full, title) {
    if (!lb) return;
    lbImg.src = full;
    lbImg.alt = title;
    lbTitle.textContent = title;
    lb.hidden = false;
    lockScroll();
    openSrc = full;
    openedAt = Date.now();
    track({ type: "img_click", img: full, cat: window.PAGE_CAT || null });
  }

  function closeLb() {
    if (!lb || lb.hidden) return;
    flushView();
    lb.hidden = true;
    lbImg.src = "";
    openSrc = null;
    unlockScroll();
  }

  document.addEventListener("click", function (e) {
    var fig = e.target.closest && e.target.closest(".om-grid figure[data-full]");
    if (!fig) return;
    openLb(fig.getAttribute("data-full"), fig.getAttribute("data-title") || "");
  });

  if (lb) lb.addEventListener("click", closeLb);

  /* ---------- Kontakt ----------
     Eingebettetes Formular statt Sprung auf index.html#kontakt — so bleibt man
     auf der Seite, genau wie im Design vorgesehen. */

  var contactBtn = document.getElementById("contactBtn");
  var contactModal = document.getElementById("contactModal");
  var contactForm = document.getElementById("contactForm");
  var contactThanks = document.getElementById("thanks");
  var fName = document.getElementById("fName");
  var fMail = document.getElementById("fMail");
  var fMsg = document.getElementById("fMsg");

  function openContact() {
    if (!contactModal) return;
    track({ type: "contact_open" });
    if (contactThanks) contactThanks.hidden = true;
    if (contactForm) contactForm.hidden = false;
    contactModal.hidden = false;
    lockScroll();
  }
  function closeContact() {
    if (!contactModal || contactModal.hidden) return;
    contactModal.hidden = true;
    unlockScroll();
  }
  function submitContact(e) {
    e.preventDefault();
    track({ type: "contact_submit" });
    var done = function () {
      if (contactForm) contactForm.hidden = true;
      if (contactThanks) contactThanks.hidden = false;
    };
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: fName ? fName.value : "",
        email: fMail ? fMail.value : "",
        message: fMsg ? fMsg.value : ""
      })
    }).then(done, done);
  }

  if (contactBtn) contactBtn.addEventListener("click", openContact);
  var contactClose = document.getElementById("contactClose");
  if (contactClose) contactClose.addEventListener("click", closeContact);
  if (contactForm) contactForm.addEventListener("submit", submitContact);

  // Alte Verweise auf "…html#kontakt" (z. B. Lesezeichen) sollen weiterhin funktionieren
  if (location.hash === "#kontakt") openContact();

  /* ---------- Kategorien-Blatt (mobil) ----------
     Ab 760px zeigt die Navigation nur noch "Alle" + aktuelle Kategorie (siehe
     css/style.css); der Rest zieht in dieses Blatt, aufgeklappt über
     "Weitere Kategorien" — Pendant zur Startseite (js/app.js). */

  var moreCatsBtn = document.getElementById("moreCatsBtn");
  var sheetModal = document.getElementById("sheetModal");
  var sheetInner = document.getElementById("sheetInner");

  function openSheet() {
    if (!sheetModal || !sheetInner) return;
    sheetInner.textContent = "";
    document.querySelectorAll(".cats-nav a.cat-pill").forEach(function (a) {
      var clone = document.createElement("a");
      clone.href = a.getAttribute("href");
      clone.textContent = a.textContent;
      if (a.classList.contains("current")) clone.className = "current";
      sheetInner.appendChild(clone);
    });
    sheetModal.hidden = false;
    lockScroll();
  }
  function closeSheet() {
    if (!sheetModal || sheetModal.hidden) return;
    sheetModal.hidden = true;
    unlockScroll();
  }

  if (moreCatsBtn) moreCatsBtn.addEventListener("click", openSheet);
  if (sheetModal) sheetModal.addEventListener("click", closeSheet);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (sheetModal && !sheetModal.hidden) closeSheet();
    else if (contactModal && !contactModal.hidden) closeContact();
    else closeLb();
  });

  // Wie auf der Startseite: im Hintergrund liegende Tabs verfälschen sonst die
  // durchschnittliche Betrachtungsdauer
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      flushView();
    } else if (openSrc) {
      openedAt = Date.now();
    }
  });
  window.addEventListener("pagehide", flushView);
})();
