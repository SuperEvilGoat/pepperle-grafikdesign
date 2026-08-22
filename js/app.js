/* pepperle.de — Logik, portiert aus dem Claude-Design-Entwurf.
   Kategorie "Alle" zeigt die kuratierte Featured-Auswahl (FEATURED in data.js). */
(function () {
  "use strict";

  // Kontaktformular-Endpunkt: eigener Cloudflare Worker — Anfragen landen im
  // Dashboard (keine E-Mail). Nach dem DNS-Umzug auf api.pepperle.de umstellen.
  var FORM_ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/contact";

  var CATS = [
    { id: "all", de: "Alle", en: "All" },
    { id: "food", de: "Food & Drinks", en: "Food & Drinks" },
    { id: "transport", de: "Verkehr & Technik", en: "Transportation & Technology" },
    { id: "landscape", de: "Landschaft", en: "Landscape & Scenery" },
    { id: "people", de: "Menschen & Tiere", en: "People & Animals" },
    { id: "items", de: "Objekte", en: "Realistic Items" },
    { id: "poster", de: "Poster & Anzeigen", en: "Poster & Ads" },
    { id: "pharma", de: "Pharma & Medizin", en: "Pharma & Medical" },
    { id: "logos", de: "Logos & Icons", en: "Logos & Icons" },
    { id: "packaging", de: "Verpackung & Display", en: "Packaging & Display" }
  ];

  var COPY = {
    de: {
      empty: "Bilder folgen — Ordner noch nicht hochgeladen",
      contact: "Kontakt", formTitle: "Kontakt aufnehmen",
      formNote: "Anfrage für Illustration oder Verpackungsgrafik",
      tagline: "Illustration und Packungsdesign",
      name: "Name", mail: "E-Mail", msg: "Nachricht", send: "Senden",
      thanks: "Danke — die Nachricht ist unterwegs.",
      hint: "Bild anklicken zum Vergrößern",
      legal: "Impressum & Datenschutz",
      more: "Weitere Kategorien"
    },
    en: {
      empty: "Images coming — folder not uploaded yet",
      contact: "Contact", formTitle: "Get in touch",
      formNote: "Enquiry for illustration or packaging graphics",
      tagline: "Illustration and Packaging Design",
      name: "Name", mail: "Email", msg: "Message", send: "Send",
      thanks: "Thank you — your message is on its way.",
      hint: "Click an image to view it",
      legal: "Imprint & Privacy",
      more: "More categories"
    }
  };

  var TIERS = {
    large: { dur: 21, shadow: "0 90px 160px rgba(0,9,20,0.85), 0 34px 66px rgba(0,9,20,0.6)" },
    medium: { dur: 30, shadow: "0 46px 92px rgba(0,9,20,0.68), 0 16px 32px rgba(0,9,20,0.48)" },
    small: { dur: 41, shadow: "0 20px 42px rgba(0,9,20,0.5), 0 6px 14px rgba(0,9,20,0.38)" }
  };

  // Eine Geschwindigkeitsstufe pro Bahn, damit Kacheln gleichmäßig verteilt bleiben
  var LANES = [
    { left: 1, w: 22, tier: "large" },
    { left: 20, w: 16, tier: "medium" },
    { left: 34, w: 22, tier: "large" },
    { left: 53, w: 16, tier: "medium" },
    { left: 66, w: 22, tier: "large" },
    { left: 84, w: 15, tier: "medium" }
  ];
  var MOBILE_LANES = [
    { left: 6, w: 55, tier: "large" },
    { left: 45, w: 49, tier: "medium" }
  ];
  var PER_LANE = 3;
  var MOBILE_PER_LANE = 4;

  var lang = /^de\b|-de\b/i.test(navigator.language || "") ? "de" : "en";
  var C = COPY[lang];
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = { cat: "all", swapping: false, lightbox: null, mobile: false };

  var el = {
    drift: document.getElementById("drift"),
    tagline: document.getElementById("tagline"),
    hint: document.getElementById("hint"),
    note: document.getElementById("note"),
    catsNav: document.getElementById("catsNav"),
    mobileNav: document.getElementById("mobileNav"),
    contactBtn: document.getElementById("contactBtn"),
    contactModal: document.getElementById("contactModal"),
    contactTitle: document.getElementById("contactTitle"),
    contactNote: document.getElementById("contactNote"),
    contactForm: document.getElementById("contactForm"),
    fName: document.getElementById("fName"),
    fMail: document.getElementById("fMail"),
    fMsg: document.getElementById("fMsg"),
    fSend: document.getElementById("fSend"),
    thanks: document.getElementById("thanks"),
    lightbox: document.getElementById("lightbox"),
    lbImg: document.getElementById("lbImg"),
    lbTitle: document.getElementById("lbTitle"),
    legalModal: document.getElementById("legalModal"),
    legalBlocks: document.getElementById("legalBlocks"),
    sheetModal: document.getElementById("sheetModal"),
    sheetInner: document.getElementById("sheetInner")
  };

  /* ---------- Hilfen ---------- */

  function pool(cat) {
    if (cat === "all") return FEATURED;
    return IMAGES[cat] || [];
  }

  function titleFromSrc(src) {
    if (!src) return "";
    var s = src.split("/").pop().replace(/\.[a-z]+$/i, "");
    s = s.replace(/^\d+-/, "");
    s = s.replace(/-/g, " ").replace(/\s+/g, " ").trim();
    s = s.replace(/ae/g, "ä").replace(/oe/g, "ö").replace(/ue/g, "ü").replace(/ss(?= |$)/g, "ß");
    return s.split(" ").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }

  function fullSrc(tileSrc) {
    return tileSrc.replace("images/tiles/", "images/full/");
  }

  function isMobileView() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function buildTiles(cat, base, gap) {
    base = base === undefined ? 3.4 : base;
    gap = gap === undefined ? 1.8 : gap;
    var src = pool(cat);
    if (!src.length) return [];
    var shuffled = src.slice().sort(function () { return Math.random() - 0.5; });
    var tiles = [];
    var n = 0;
    var mob = isMobileView();
    var lanes = mob ? MOBILE_LANES : LANES;
    var perLane = mob ? MOBILE_PER_LANE : PER_LANE;
    lanes.forEach(function (lane, li) {
      var tier = TIERS[lane.tier];
      var spacing = tier.dur / perLane;
      for (var k = 0; k < perLane; k++) {
        tiles.push({
          src: shuffled[n % shuffled.length],
          left: lane.left,
          w: lane.w,
          dur: tier.dur,
          shadow: tier.shadow,
          delay: Math.round((base + li * gap + k * spacing) * 10) / 10
        });
        n++;
      }
    });
    return tiles;
  }

  // Bei reduzierter Bewegung: alle Kacheln eingefroren über den Bildschirm verteilt
  function freezeTiles(tiles) {
    tiles.forEach(function (t, i) {
      t.delay = -Math.round(t.dur * (0.18 + (i % 7) * 0.1) * 10) / 10;
    });
    return tiles;
  }

  function renderTiles(tiles) {
    el.drift.textContent = "";
    tiles.forEach(function (t) {
      var d = document.createElement("div");
      d.className = "tile";
      d.style.left = t.left + "%";
      d.style.width = "min(" + t.w + "vw, 460px)";
      d.style.animationDuration = t.dur + "s";
      d.style.animationDelay = t.delay + "s";
      var img = document.createElement("img");
      img.src = t.src;
      img.alt = titleFromSrc(t.src);
      img.style.boxShadow = t.shadow;
      img.loading = "lazy";
      img.draggable = false;
      d.appendChild(img);
      d.addEventListener("click", function () { openLightbox(t.src); });
      el.drift.appendChild(d);
    });
    if (reducedMotion) el.drift.classList.add("paused");
    el.note.textContent = tiles.length === 0 ? C.empty : "";
    el.note.classList.toggle("warn", tiles.length === 0);
  }

  function preload(tiles) {
    return Promise.all(tiles.map(function (t) {
      return new Promise(function (res) {
        var im = new Image();
        im.onload = im.onerror = res;
        im.src = t.src;
      });
    }));
  }

  function select(cat) {
    if (cat === state.cat || state.swapping) return;
    if (window.pptrack) window.pptrack({ type: "cat_select", cat: cat });
    state.swapping = true;
    el.drift.classList.add("faded");
    el.catsNav.classList.add("nav-swap");
    el.mobileNav.classList.add("nav-swap");
    var next = buildTiles(cat, 0.1, 1.9);
    if (reducedMotion) freezeTiles(next);
    var faded = new Promise(function (res) { setTimeout(res, 520); });
    Promise.all([preload(next), faded]).then(function () {
      state.cat = cat;
      renderTiles(next);
      renderNavs();
      setTimeout(function () {
        state.swapping = false;
        el.drift.classList.remove("faded");
        el.catsNav.classList.remove("nav-swap");
        el.mobileNav.classList.remove("nav-swap");
      }, 80);
    });
  }

  /* ---------- Navigation ---------- */

  function pillStyle(btn, cc, active) {
    var has = cc.id === "all" || pool(cc.id).length > 0;
    btn.style.border = "1px solid " + (active ? "rgba(234,79,67,0.9)" : has ? "rgba(238,243,248,0.28)" : "rgba(238,243,248,0.13)");
    btn.style.background = active ? "rgba(234,79,67,0.16)" : "rgba(238,243,248,0.04)";
    btn.style.color = active ? "#ffffff" : has ? "rgba(238,243,248,0.78)" : "rgba(238,243,248,0.38)";
  }

  function makePill(cc, mobile) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-pill" + (mobile ? " mobile" : "");
    btn.textContent = lang === "de" ? cc.de : cc.en;
    pillStyle(btn, cc, cc.id === state.cat);
    btn.addEventListener("click", function () { select(cc.id); });
    return btn;
  }

  function renderNavs() {
    // Desktop
    el.catsNav.textContent = "";
    CATS.forEach(function (cc) { el.catsNav.appendChild(makePill(cc, false)); });
    var legalBtn = document.createElement("button");
    legalBtn.type = "button";
    legalBtn.className = "legal-link";
    legalBtn.textContent = C.legal;
    legalBtn.addEventListener("click", openLegal);
    el.catsNav.appendChild(legalBtn);

    // Mobil: [Alle] (+ aktive Kategorie) + "Weitere Kategorien" + Rechtliches
    el.mobileNav.textContent = "";
    var nav = document.createElement("nav");
    nav.className = "cats-nav";
    nav.appendChild(makePill(CATS[0], true));
    if (state.cat !== "all") {
      var current = CATS.filter(function (x) { return x.id === state.cat; })[0];
      if (current) nav.appendChild(makePill(current, true));
    }
    var more = document.createElement("button");
    more.type = "button";
    more.className = "cat-pill mobile";
    more.textContent = C.more;
    more.style.border = "1px solid rgba(238,243,248,0.28)";
    more.style.background = "rgba(238,243,248,0.04)";
    more.style.color = "rgba(238,243,248,0.78)";
    more.addEventListener("click", openSheet);
    nav.appendChild(more);
    el.mobileNav.appendChild(nav);
    var legalM = document.createElement("button");
    legalM.type = "button";
    legalM.className = "legal-link mobile";
    legalM.textContent = C.legal;
    legalM.addEventListener("click", openLegal);
    el.mobileNav.appendChild(legalM);

    var mob = isMobileView();
    el.catsNav.hidden = mob;
    el.mobileNav.hidden = !mob;
  }

  /* ---------- Lightbox ---------- */

  function openLightbox(tileSrc) {
    state.lightbox = tileSrc;
    state.lightboxSince = Date.now();
    if (window.pptrack) window.pptrack({ type: "img_click", img: tileSrc, cat: state.cat });
    el.lbImg.src = fullSrc(tileSrc);
    el.lbImg.alt = titleFromSrc(tileSrc);
    el.lbTitle.textContent = titleFromSrc(tileSrc);
    el.lightbox.hidden = false;
    el.drift.classList.add("faded", "paused");
  }

  function trackLightboxView() {
    if (state.lightbox && state.lightboxSince && window.pptrack) {
      window.pptrack({ type: "img_view", img: state.lightbox, cat: state.cat, dur_ms: Date.now() - state.lightboxSince });
    }
    state.lightboxSince = null;
  }

  function closeLightbox() {
    trackLightboxView();
    state.lightbox = null;
    el.lightbox.hidden = true;
    el.lbImg.src = "";
    el.drift.classList.remove("faded");
    if (!reducedMotion) el.drift.classList.remove("paused");
  }

  /* ---------- Kontakt ---------- */

  function openContact() {
    if (window.pptrack) window.pptrack({ type: "contact_open" });
    el.thanks.hidden = true;
    el.contactForm.hidden = false;
    el.contactModal.hidden = false;
  }
  function closeContact() { el.contactModal.hidden = true; }

  function submitForm(e) {
    e.preventDefault();
    if (window.pptrack) window.pptrack({ type: "contact_submit" });
    var done = function () {
      el.contactForm.hidden = true;
      el.thanks.hidden = false;
    };
    if (!FORM_ENDPOINT) { done(); return; }
    var payload = {
      name: el.fName.value,
      email: el.fMail.value,
      message: el.fMsg.value
    };
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(done, done);
  }

  /* ---------- Rechtliches ---------- */

  var legalBuilt = false;
  function buildLegal() {
    if (legalBuilt) return;
    legalBuilt = true;
    var mono = "'IBM Plex Mono', monospace";
    var sans = "Archivo, Helvetica, Arial, sans-serif";
    var src = LEGAL_TEXT.impressum + "\n# Datenschutzerklärung\n" + LEGAL_TEXT.datenschutz;
    src.split("\n").filter(function (l) { return l.trim(); }).forEach(function (line) {
      var p = document.createElement("p");
      var st = p.style;
      if (line.indexOf("# ") === 0 && line.indexOf("## ") !== 0) {
        p.textContent = line.slice(2);
        st.fontFamily = sans; st.fontSize = "28px"; st.fontWeight = "500"; st.lineHeight = "1.2";
        st.letterSpacing = "-0.01em"; st.color = "#ffffff"; st.margin = "54px 0 22px";
      } else if (line.indexOf("### ") === 0) {
        p.textContent = line.slice(4);
        st.fontFamily = sans; st.fontSize = "15px"; st.fontWeight = "600"; st.lineHeight = "1.4";
        st.letterSpacing = "0.01em"; st.color = "#ffffff"; st.margin = "26px 0 8px";
      } else if (line.indexOf("## ") === 0) {
        p.textContent = line.slice(3);
        st.fontFamily = mono; st.fontSize = "11px"; st.fontWeight = "400"; st.lineHeight = "1.5";
        st.letterSpacing = "0.22em"; st.textTransform = "uppercase"; st.color = "#ea4f43"; st.margin = "34px 0 12px";
      } else {
        p.textContent = line;
        st.fontFamily = sans; st.fontSize = "14.5px"; st.fontWeight = "400"; st.lineHeight = "1.72";
        st.color = "rgba(238,243,248,0.78)"; st.margin = "0 0 11px";
      }
      el.legalBlocks.appendChild(p);
    });
  }

  function openLegal() {
    buildLegal();
    el.legalModal.hidden = false;
    el.legalModal.querySelector(".legal-card").scrollTop = 0;
  }
  function closeLegal() { el.legalModal.hidden = true; }

  /* ---------- Kategorien-Sheet (mobil) ---------- */

  function openSheet() {
    el.sheetInner.textContent = "";
    CATS.forEach(function (cc) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = lang === "de" ? cc.de : cc.en;
      pillStyle(btn, cc, cc.id === state.cat);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeSheet();
        select(cc.id);
      });
      el.sheetInner.appendChild(btn);
    });
    el.sheetModal.hidden = false;
  }
  function closeSheet() { el.sheetModal.hidden = true; }

  /* ---------- Init ---------- */

  document.documentElement.lang = lang;
  el.tagline.textContent = C.tagline;
  el.hint.textContent = C.hint;
  el.contactBtn.textContent = C.contact;
  el.contactTitle.textContent = C.formTitle;
  el.contactNote.textContent = C.formNote;
  el.fName.placeholder = C.name;
  el.fMail.placeholder = C.mail;
  el.fMsg.placeholder = C.msg;
  el.fSend.textContent = C.send;
  el.thanks.textContent = C.thanks;

  el.contactBtn.addEventListener("click", openContact);
  document.getElementById("contactClose").addEventListener("click", closeContact);
  el.contactForm.addEventListener("submit", submitForm);
  el.lightbox.addEventListener("click", closeLightbox);
  document.getElementById("legalClose").addEventListener("click", closeLegal);
  el.sheetModal.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!el.sheetModal.hidden) closeSheet();
    else if (!el.legalModal.hidden) closeLegal();
    else if (!el.contactModal.hidden) closeContact();
    else if (!el.lightbox.hidden) closeLightbox();
  });

  var mq = window.matchMedia("(max-width: 760px)");
  var onMq = function () {
    closeSheet();
    var tiles = buildTiles(state.cat, 0.1, 1.9);
    if (reducedMotion) freezeTiles(tiles);
    renderTiles(tiles);
    renderNavs();
  };
  mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);

  // Offene Bildbetrachtung beim Verlassen der Seite noch erfassen
  window.addEventListener("pagehide", trackLightboxView);

  // Frischer Seitenaufbau: alle Kacheln kommen von unten ins Bild
  var initial = buildTiles("all", 0.25, 1.3);
  if (reducedMotion) freezeTiles(initial);
  renderTiles(initial);
  renderNavs();
})();
