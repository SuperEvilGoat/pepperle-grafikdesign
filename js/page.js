/* pepperle.de — Logik der statischen Unterseiten:
   Lightbox, Sprachumschalter und dieselbe Reichweitenmessung wie auf der Startseite.

   Ausgeliefert wird immer Deutsch, damit Suchmaschinen die deutschen Texte
   indexieren. Englisch wird erst auf Klick eingesetzt (window.PAGE_EN) und in
   localStorage gemerkt, damit die Wahl beim Seitenwechsel erhalten bleibt. */
(function () {
  "use strict";

  var LANG_KEY = "pp_lang";
  var track = window.pptrack || function () {};

  // Gleicher Endpunkt wie auf der Startseite (js/app.js) — eigener Cloudflare
  // Worker, Anfragen landen im Dashboard statt per E-Mail.
  var FORM_ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/contact";

  /* ---------- Sprache ---------- */

  var isAllePage = window.PAGE_CAT === "alle";

  var UI = {
    de: {
      lang: "English",
      contact: "Kontakt",
      home: "Start",
      hint: "Bild antippen zum Vergrößern",
      works: function (n) {
        return isAllePage ? n + " Arbeiten — sortiert nach Beliebtheit" : n + " Arbeiten in dieser Kategorie";
      },
      role: "Illustration & Graphic Design, Frankfurt am Main",
      more: "Weitere Kategorien",
      formTitle: "Kontakt aufnehmen",
      formNote: "Anfrage für Illustration oder Verpackungsgrafik",
      name: "Name", mail: "E-Mail", msg: "Nachricht", send: "Senden",
      thanks: "Danke — die Nachricht ist unterwegs."
    },
    en: {
      lang: "Deutsch",
      contact: "Contact",
      home: "Home",
      hint: "Click an image to view it",
      works: function (n) {
        return isAllePage ? n + " works — sorted by popularity" : n + " works in this category";
      },
      role: "Illustration & Graphic Design, Frankfurt am Main",
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
  var workCount = document.querySelectorAll(".grid .work").length;

  // Deutsche Fassung sichern, bevor sie ersetzt wird
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

    var crumbHome = document.querySelector(".pg-crumb a");
    if (crumbHome) crumbHome.textContent = t.home;

    var role = document.getElementById("footRole");
    if (role) role.textContent = t.role;

    var count = document.getElementById("pgCount");
    if (count) count.textContent = t.works(workCount) + " — " + t.hint;

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
      var crumbCur = document.getElementById("crumbCur");
      if (crumbCur) crumbCur.textContent = src.h1;
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
  if (lang === "en" && EN) applyLang("en");

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
    document.body.style.overflow = "hidden";
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
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".work-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openLb(btn.getAttribute("data-full"), btn.getAttribute("data-title") || "");
    });
  });

  /* ---------- Sanftes Einblenden der Kacheln beim Scrollen ins Bild ---------- */

  var works = document.querySelectorAll(".grid .work");
  if (works.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("work-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    works.forEach(function (el) { io.observe(el); });
  } else {
    works.forEach(function (el) { el.classList.add("work-in"); });
  }

  if (lb) lb.addEventListener("click", closeLb);

  /* ---------- Kontakt ----------
     Eingebettetes Formular statt Sprung auf index.html#kontakt — so bleibt man
     auf der Kategorieseite, genau wie im neuen Design vorgesehen. */

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
  }
  function closeContact() {
    if (contactModal) contactModal.hidden = true;
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
     page.css); der Rest zieht in dieses Blatt, aufgeklappt über "Weitere
     Kategorien" — Pendant zur Startseite (js/app.js). */

  var moreCatsBtn = document.getElementById("moreCatsBtn");
  var sheetModal = document.getElementById("sheetModal");
  var sheetInner = document.getElementById("sheetInner");

  function openSheet() {
    if (!sheetModal || !sheetInner) return;
    sheetInner.textContent = "";
    document.querySelectorAll(".pg-cats a").forEach(function (a) {
      var clone = document.createElement("a");
      clone.href = a.getAttribute("href");
      clone.textContent = a.textContent;
      if (a.classList.contains("current")) clone.className = "current";
      sheetInner.appendChild(clone);
    });
    sheetModal.hidden = false;
  }
  function closeSheet() {
    if (sheetModal) sheetModal.hidden = true;
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
