/* pepperle.de — Logik der statischen Unterseiten:
   Lightbox, Sprachumschalter und dieselbe Reichweitenmessung wie auf der Startseite.

   Ausgeliefert wird immer Deutsch, damit Suchmaschinen die deutschen Texte
   indexieren. Englisch wird erst auf Klick eingesetzt (window.PAGE_EN) und in
   localStorage gemerkt, damit die Wahl beim Seitenwechsel erhalten bleibt. */
(function () {
  "use strict";

  var LANG_KEY = "pp_lang";
  var track = window.pptrack || function () {};

  /* ---------- Sprache ---------- */

  var UI = {
    de: {
      lang: "English",
      contact: "Kontakt",
      home: "Start",
      hint: "Bild antippen zum Vergrößern",
      works: function (n) { return n + " Arbeiten in dieser Kategorie"; },
      role: "Illustration & Graphic Design, Frankfurt am Main"
    },
    en: {
      lang: "Deutsch",
      contact: "Contact",
      home: "Home",
      hint: "Click an image to view it",
      works: function (n) { return n + " works in this category"; },
      role: "Illustration & Graphic Design, Frankfurt am Main"
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

    var contact = document.getElementById("contactLink");
    if (contact) contact.textContent = t.contact;

    var crumbHome = document.querySelector(".pg-crumb a");
    if (crumbHome) crumbHome.textContent = t.home;

    var role = document.getElementById("footRole");
    if (role) role.textContent = t.role;

    var count = document.getElementById("pgCount");
    if (count) count.textContent = t.works(workCount) + " — " + t.hint;

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

  if (lb) {
    lb.addEventListener("click", closeLb);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLb();
    });
  }

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
