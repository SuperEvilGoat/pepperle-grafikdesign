/* pepperle.de — Startseite: nur die animierte Featured-Auswahl (FEATURED in
   data.js). Kategorien werden hier nicht mehr gefiltert — jede Kachel im
   unteren Menü, auch "Alle", ist ein echter Link auf die jeweilige statische
   Rasteransicht (siehe js/page.js bzw. js/alle.js). */
(function () {
  "use strict";

  // Kontaktformular-Endpunkt: eigener Cloudflare Worker — Anfragen landen im
  // Dashboard (keine E-Mail). Nach dem DNS-Umzug auf api.pepperle.de umstellen.
  var FORM_ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/contact";

  // slug = Adresse der zugehoerigen statischen Kategorieseite. Die Pfade sind
  // die der alten Contao-Seite und duerfen nicht geaendert werden, sonst gehen
  // die vorhandenen Suchmaschinen-Platzierungen verloren.
  var CATS = [
    { id: "all", de: "Alle", en: "All", slug: "alle" },
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
      langSwitch: "English"
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
      langSwitch: "Deutsch"
    }
  };

  var TIERS = {
    large: { dur: 21, z: 3, shadow: "0 90px 160px rgba(0,9,20,0.85), 0 34px 66px rgba(0,9,20,0.6)" },
    medium: { dur: 30, z: 2, shadow: "0 46px 92px rgba(0,9,20,0.68), 0 16px 32px rgba(0,9,20,0.48)" },
    small: { dur: 41, z: 1, shadow: "0 20px 42px rgba(0,9,20,0.5), 0 6px 14px rgba(0,9,20,0.38)" }
  };

  // Eine Geschwindigkeitsstufe pro Bahn, damit Kacheln gleichmäßig verteilt bleiben;
  // "speed" variiert das Lauftempo leicht pro Bahn für einen organischeren Rhythmus,
  // "z" (aus TIERS) staffelt große vor kleine Kacheln, wo sie sich überlappen.
  var LANES = [
    { left: 1, w: 20, tier: "large", speed: 1 },
    { left: 23.5, w: 14, tier: "medium", speed: 1.09 },
    { left: 40, w: 20, tier: "large", speed: 0.93 },
    { left: 62.5, w: 14, tier: "medium", speed: 1 },
    { left: 79, w: 20, tier: "large", speed: 1.07 }
  ];
  var MOBILE_LANES = [
    { left: 3, w: 46, tier: "large", speed: 1 },
    { left: 52, w: 45, tier: "medium", speed: 1.08 }
  ];
  var PER_LANE = 4;
  var MOBILE_PER_LANE = 5;

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

  var state = { lightbox: null, mobile: false };

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
      var dur = Math.round(tier.dur * (lane.speed || 1) * 10) / 10;
      var spacing = dur / perLane;
      for (var k = 0; k < perLane; k++) {
        tiles.push({
          src: shuffled[n % shuffled.length],
          left: lane.left,
          w: lane.w,
          dur: dur,
          z: tier.z,
          shadow: tier.shadow,
          // Kleiner Versatz nach (li+k)%3, damit die Bahnen nicht im starren
          // Gleichtakt loslaufen
          delay: Math.round((base + li * gap + k * spacing + ((li + k) % 3) * 0.7) * 10) / 10
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
      if (t.z) d.style.zIndex = t.z;
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

  /* ---------- Navigation ----------
     Die Startseite zeigt ausschliesslich die animierte Featured-Auswahl; sie
     ist selbst keine "Kategorie" und filtert auch keine mehr um. Jede Kachel
     im unteren Menue — inklusive "Alle" — ist ein ganz normaler Link auf die
     jeweilige statische Rasteransicht. Hier wird nur noch die Beschriftung
     (Sprache) und die Desktop/Mobil-Variante gepflegt. */

  function pillStyle(btn) {
    btn.style.border = "1px solid rgba(238,243,248,0.28)";
    btn.style.background = "rgba(238,243,248,0.04)";
    btn.style.color = "rgba(238,243,248,0.78)";
  }

  function makePill(cc, mobile) {
    var pill = document.createElement("a");
    pill.href = cc.slug + ".html";
    pill.className = "cat-pill" + (mobile ? " mobile" : "");
    pill.setAttribute("data-cat", cc.id);
    pill.textContent = lang === "de" ? cc.de : cc.en;
    pillStyle(pill);
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

    // Mobil: "Alle" + "Weitere Kategorien" (öffnet die restlichen als Liste) + Rechtliches
    el.mobileNav.textContent = "";
    var nav = document.createElement("nav");
    nav.className = "cats-nav";
    nav.appendChild(makePill(CATS[0], true));
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
  }

  /* ---------- Lightbox ---------- */

  function openLightbox(tileSrc) {
    state.lightbox = tileSrc;
    state.lightboxSince = Date.now();
    if (window.pptrack) window.pptrack({ type: "img_click", img: tileSrc, cat: "all" });
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
      window.pptrack({ type: "img_view", img: state.lightbox, cat: "all", dur_ms: Date.now() - state.lightboxSince });
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
    // Die erste Kachel ("Alle") steht schon in der Mobil-Leiste, hier nur der Rest
    CATS.slice(1).forEach(function (cc) {
      var a = document.createElement("a");
      a.href = cc.slug + ".html";
      a.textContent = lang === "de" ? cc.de : cc.en;
      pillStyle(a);
      el.sheetInner.appendChild(a);
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
    var tiles = buildTiles("all", 0.1, 1.9);
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
