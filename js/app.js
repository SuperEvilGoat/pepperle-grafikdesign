/* pepperle.de — Logik, portiert aus dem Claude-Design-Entwurf.
   Kategorie "Alle" zeigt die kuratierte Featured-Auswahl (FEATURED in data.js). */
(function () {
  "use strict";

  // Kontaktformular-Endpunkt: eigener Cloudflare Worker — Anfragen landen im
  // Dashboard (keine E-Mail). Nach dem DNS-Umzug auf api.pepperle.de umstellen.
  var FORM_ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/contact";

  // slug = Adresse der zugehoerigen statischen Kategorieseite. Die Pfade sind
  // die der alten Contao-Seite und duerfen nicht geaendert werden, sonst gehen
  // die vorhandenen Suchmaschinen-Platzierungen verloren.
  var CATS = [
    { id: "all", de: "Alle", en: "All", slug: null },
    { id: "food", de: "Food & Drinks", en: "Food & Drinks", slug: "food-drinks" },
    { id: "transport", de: "Verkehr & Technik", en: "Transportation & Technology", slug: "transportation-technology" },
    { id: "landscape", de: "Landschaft", en: "Landscape & Scenery", slug: "landscape-scenery" },
    { id: "people", de: "Menschen & Tiere", en: "People & Animals", slug: "people-animals" },
    { id: "items", de: "Objekte", en: "Realistic Items", slug: "realistic-items" },
    { id: "poster", de: "Poster & Anzeigen", en: "Poster & Ads", slug: "poster-ads" },
    { id: "pharma", de: "Pharma & Medizin", en: "Pharma & Medical", slug: "pharma-medical" },
    { id: "logos", de: "Logos & Icons", en: "Logos & Icons", slug: "logos-icons" },
    { id: "packaging", de: "Verpackung & Display", en: "Packaging & Display", slug: "packaging-display" }
  ];

  var COPY = {
    de: {
      empty: "Bilder folgen — Ordner noch nicht hochgeladen",
      contact: "Kontakt", formTitle: "Kontakt aufnehmen",
      formNote: "Anfrage für Illustration oder Verpackungsgrafik",
      tagline: "Illustration und Packungsdesign",
      name: "Name", mail: "E-Mail", msg: "Nachricht", send: "Senden",
      thanks: "Danke — die Nachricht ist unterwegs.",
      hint: "Bild antippen zum Vergrößern",
      legal: "Impressum & Datenschutz",
      more: "Weitere Kategorien",
      langSwitch: "English",
      seeAll: function (n) { return "Alle " + n + " Arbeiten ansehen \u2192"; }
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
      more: "More categories",
      langSwitch: "Deutsch",
      seeAll: function (n) { return "View all " + n + " works \u2192"; }
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

  // Ausgeliefert wird immer Deutsch: der Googlebot ruft die Seite mit
  // Accept-Language en-US ab und hat bisher die englische Fassung indexiert,
  // obwohl im HTML lang="de" steht. Englisch gibt es weiterhin, aber nur auf
  // ausdruecklichen Klick — die Wahl merkt sich localStorage und gilt auch auf
  // den Kategorieseiten (gleicher Schluessel wie in js/page.js).
  var LANG_KEY = "pp_lang";
  var lang = (function () {
    try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "de"; } catch (e) { return "de"; }
  })();
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
    langBtn: document.getElementById("langBtn"),
    catLink: document.getElementById("catLink"),
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

  // Nur für den allerersten Seitenaufbau: Kacheln nicht erst von ganz unten
  // starten lassen (das hieße mehrere Sekunden leerer Bildschirm), sondern
  // schon vorab so weit oben positionieren, wie sie zu diesem Zeitpunkt normal
  // stünden — die vorderste Kachel bis zu MAX_INITIAL_PROGRESS ihrer Strecke.
  // Reihenfolge/Rhythmus bleiben erhalten, nur zeitlich zusammengestaucht.
  var MAX_INITIAL_PROGRESS = 0.75;
  function preAdvance(tiles) {
    var maxDelay = tiles.reduce(function (m, t) { return Math.max(m, t.delay); }, 0) || 1;
    tiles.forEach(function (t) {
      var progress = MAX_INITIAL_PROGRESS * (1 - t.delay / maxDelay);
      t.delay = -Math.round(progress * t.dur * 10) / 10;
    });
    return tiles;
  }

  // Bei reduzierter Bewegung: ruhende Collage statt Animation. Die Kacheln
  // mitten im Flug anzuhalten würde einen Teil von ihnen außerhalb des
  // Sichtfelds stehen lassen — hier werden sie stattdessen fest im Bild verteilt.
  function staticLayout(tiles) {
    var perLane = {};
    return tiles.filter(function (t) {
      perLane[t.left] = (perLane[t.left] || 0) + 1;
      return perLane[t.left] <= 2;
    }).map(function (t, i) {
      t.top = (i % 2 ? 54 : 6) + (i * 5) % 11;
      return t;
    });
  }

  function renderTiles(tiles) {
    el.drift.textContent = "";
    tiles.forEach(function (t) {
      var d = document.createElement("div");
      d.className = "tile";
      d.style.left = t.left + "%";
      d.style.width = "min(" + t.w + "vw, 460px)";
      if (reducedMotion) {
        d.style.animation = "none";
        d.style.top = t.top + "%";
        d.style.opacity = "1";
      } else {
        d.style.animationDuration = t.dur + "s";
        d.style.animationDelay = t.delay + "s";
      }
      var img = document.createElement("img");
      img.src = t.src;
      img.alt = titleFromSrc(t.src);
      img.style.boxShadow = t.shadow;
      // Bewusst nicht "lazy": die Kacheln sind der Hauptinhalt und sollen sofort
      // da sein. Bei "lazy" verzögerte der Browser sie so weit, dass Logo und
      // Navigation vor den Bildern erschienen — genau die falsche Reihenfolge.
      img.loading = "eager";
      img.draggable = false;
      d.appendChild(img);
      d.addEventListener("click", function () { openLightbox(t.src); });
      el.drift.appendChild(d);
    });
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
    if (reducedMotion) next = staticLayout(next);
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

  // Kategorien sind echte Links auf ihre Seite. Ein normaler Klick filtert die
  // Collage wie bisher an Ort und Stelle; Cmd/Strg-, Mittel- und Rechtsklick
  // oeffnen die Kategorieseite. So bleibt die Bedienung wie gewohnt, und
  // Suchmaschinen finden trotzdem einen verfolgbaren Verweis.
  function makePill(cc, mobile) {
    var pill = document.createElement(cc.slug ? "a" : "button");
    if (cc.slug) {
      pill.href = cc.slug + ".html";
    } else {
      pill.type = "button";
    }
    pill.className = "cat-pill" + (mobile ? " mobile" : "");
    pill.setAttribute("data-cat", cc.id);
    pill.textContent = lang === "de" ? cc.de : cc.en;
    pillStyle(pill, cc, cc.id === state.cat);
    pill.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      select(cc.id);
    });
    return pill;
  }

  function renderNavs() {
    // Desktop
    el.catsNav.textContent = "";
    CATS.forEach(function (cc) { el.catsNav.appendChild(makePill(cc, false)); });
    var legalBtn = document.createElement("a");
    legalBtn.className = "legal-link";
    legalBtn.href = "impressum.html";
    legalBtn.textContent = C.legal;
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
    var legalM = document.createElement("a");
    legalM.className = "legal-link mobile";
    legalM.href = "impressum.html";
    legalM.textContent = C.legal;
    el.mobileNav.appendChild(legalM);

    var mob = isMobileView();
    el.catsNav.hidden = mob;
    el.mobileNav.hidden = !mob;

    renderCatLink();
  }

  // Macht die Kategorieseiten auch fuer Besucher erreichbar: sobald eine
  // Kategorie gewaehlt ist, fuehrt ein sichtbarer Verweis auf die vollstaendige
  // Uebersicht mit allen Arbeiten dieser Kategorie.
  function renderCatLink() {
    if (!el.catLink) return;
    var cc = CATS.filter(function (x) { return x.id === state.cat; })[0];
    if (!cc || !cc.slug) {
      el.catLink.hidden = true;
      return;
    }
    el.catLink.href = cc.slug + ".html";
    el.catLink.textContent = C.seeAll(pool(cc.id).length);
    el.catLink.hidden = false;
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

  // Betrachtungsdauer nur zählen, solange der Tab wirklich sichtbar ist —
  // sonst verfälschen im Hintergrund offen gelassene Bilder den Durchschnitt
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

  /* ---------- Rechtliches ----------
     Impressum und Datenschutzerklaerung stehen seit dem SEO-Umbau unter
     impressum.html und datenschutz.html — eigene, verlinkbare Adressen statt
     eines Overlays. Der Text wird aus js/legal.js erzeugt (Quellen/build-seiten.mjs);
     hier im Skript ist dafuer nichts mehr noetig. */

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

  function applyTexts() {
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
    if (el.langBtn) el.langBtn.textContent = C.langSwitch;
  }
  applyTexts();

  if (el.langBtn) {
    el.langBtn.addEventListener("click", function () {
      lang = lang === "de" ? "en" : "de";
      C = COPY[lang];
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* Privatmodus */ }
      applyTexts();
      renderNavs();
      if (window.pptrack) window.pptrack({ type: "cat_select", cat: "lang:" + lang });
    });
  }

  el.contactBtn.addEventListener("click", openContact);
  document.getElementById("contactClose").addEventListener("click", closeContact);
  el.contactForm.addEventListener("submit", submitForm);
  el.lightbox.addEventListener("click", closeLightbox);
  el.sheetModal.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!el.sheetModal.hidden) closeSheet();
    else if (!el.contactModal.hidden) closeContact();
    else if (!el.lightbox.hidden) closeLightbox();
  });

  var mq = window.matchMedia("(max-width: 760px)");
  var onMq = function () {
    closeSheet();
    var tiles = buildTiles(state.cat, 0.1, 1.9);
    if (reducedMotion) tiles = staticLayout(tiles);
    renderTiles(tiles);
    renderNavs();
  };
  mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);

  // Der Kontaktknopf auf den Kategorieseiten verweist auf index.html#kontakt —
  // dort soll sich das Formular dann von selbst oeffnen.
  if (location.hash === "#kontakt") openContact();
  window.addEventListener("hashchange", function () {
    if (location.hash === "#kontakt") openContact();
  });

  // Offene Bildbetrachtung beim Verlassen der Seite noch erfassen
  window.addEventListener("pagehide", trackLightboxView);

  // Tab-Wechsel: laufende Messung abschließen, bei Rückkehr neu starten
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      trackLightboxView();
    } else if (state.lightbox && !state.lightboxSince) {
      state.lightboxSince = Date.now();
    }
  });

  /* ---------- Auftritt der Startseite ----------
     Reihenfolge: zuerst die bereits fahrenden Bilder einblenden, eine Sekunde
     später Logo, Tagline, Kontakt und die Navigation unten (Klasse
     .intro-ready, die Feinabstufung steckt im CSS).

     Der zweite Schritt hängt bewusst am tatsächlichen Laden der Bilder und
     nicht an festen CSS-Verzögerungen: Letztere liefen ab Seitenaufbau und
     waren durch, bevor die Bilddateien überhaupt da waren — dann erschien das
     Logo vor den Bildern, also genau verkehrt herum. */
  var stage = document.getElementById("stage");
  var INTRO_GAP_MS = 1000;      // Abstand zwischen Bildern und dem Rest
  var INTRO_MAX_WAIT_MS = 2000; // Notbremse: nie länger auf Bilder warten
  var INTRO_WAIT_TILES = 6;     // nur auf die vordersten Kacheln warten

  function startIntro() {
    if (!reducedMotion) {
      // Reflow erzwingen, damit der Browser den unsichtbaren Ausgangszustand
      // registriert, bevor die Klasse fällt — sonst greift der CSS-Übergang
      // nicht zuverlässig (unabhängig von requestAnimationFrame/Tab-Sichtbarkeit).
      void el.drift.offsetHeight;
      el.drift.classList.remove("faded");
    }
    setTimeout(function () { stage.classList.add("intro-ready"); }, INTRO_GAP_MS);
  }

  // Auf die vordersten Kacheln warten — das sind die, die beim Aufbau schon
  // weit oben stehen und damit als Erstes ins Auge fallen. Bewusst nicht auf
  // alle: die hinteren fahren ohnehin erst später ins Bild, und beim ersten
  // Besuch (rund 2,7 MB) hieße Warten auf alle einen sekundenlang leeren
  // Bildschirm. INTRO_MAX_WAIT_MS begrenzt das Warten zusätzlich nach oben.
  function whenTilesVisible(done) {
    var imgs = [].slice.call(el.drift.querySelectorAll("img")).slice(0, INTRO_WAIT_TILES);
    var pending = imgs.filter(function (im) { return !im.complete; });
    if (!pending.length) return done();
    var fired = false;
    function finish() {
      if (fired) return;
      fired = true;
      clearTimeout(timer);
      done();
    }
    var left = pending.length;
    pending.forEach(function (im) {
      function tick() {
        im.removeEventListener("load", tick);
        im.removeEventListener("error", tick);
        if (--left <= 0) finish();
      }
      im.addEventListener("load", tick);
      im.addEventListener("error", tick);
    });
    var timer = setTimeout(finish, INTRO_MAX_WAIT_MS);
  }

  var initial = buildTiles("all", 0.25, 1.3);
  if (reducedMotion) {
    initial = staticLayout(initial);
  } else {
    // Kacheln stehen sofort da (bis zu 75 % ihrer Strecke schon zurückgelegt,
    // siehe preAdvance), statt erst von unten hereinfahren zu müssen.
    initial = preAdvance(initial);
    el.drift.classList.add("faded");
  }
  renderTiles(initial);
  renderNavs();
  whenTilesVisible(startIntro);
})();
