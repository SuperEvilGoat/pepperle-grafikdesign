/* pepperle.de — Logik der Kategorie- und Rechtsseiten: dieselbe Bühne wie die
   Startseite (Logo, Tagline, Kontakt, Kategorien-Leiste, Blur-Fades), nur mit
   einem Werk-Raster statt der Drift-Collage.

   Anders als die Startseite scrollen diese Seiten im DOKUMENT, nicht in einem
   inneren Panel — siehe html.seite-scroll in css/style.css. Logo, Kontakt und
   Navigation stehen dort per position: fixed, sehen also unverändert aus.

   Seit der Sprachumstellung ist jede Seite statisch einsprachig: alle Texte
   stehen fertig im HTML (erzeugt aus Quellen/texte/<lang>.json über
   Quellen/seiten-vorlage.mjs). Der frühere Laufzeit-Textaustausch samt
   UI-Tabelle, applyLang() und window.PAGE_EN ist deshalb entfallen — dieses
   Skript kennt keine Sprache mehr. Die Auswahlliste steckt in
   js/sprache.js, die automatische Erkennung als Inline-Skript im <head>. */
(function () {
  "use strict";

  var track = window.pptrack || function () {};

  // Gleicher Endpunkt wie auf der Startseite (js/app.js) — eigener Cloudflare
  // Worker, Anfragen landen im Dashboard statt per E-Mail.
  var FORM_ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/contact";

  var stage = document.getElementById("stage");

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
     Seite geladen wird. Dort blenden die Bilder einzeln wieder auf, sobald
     sie dekodiert sind (siehe "Bilder einblenden" unten). */
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
     Sprachwechsel/Zeilenumbruch neu, wie schon auf der Startseite.

     Früher lief das zusätzlich alle 800 ms in einem setInterval — für immer,
     auch mitten im Scrollen. Jede Messung liest getBoundingClientRect() und
     erzwingt damit eine Layout-Berechnung; das war eine der Dauerlasten hinter
     dem Ruckeln. Der ResizeObserver meldet sich stattdessen genau dann, wenn
     sich die Höhe wirklich ändert.

     Kein window-"resize" mehr: iOS feuert ihn jedes Mal, wenn beim Scrollen
     die Adressleiste ein- oder ausfährt. Die Messung schrieb dann --navh neu,
     .om-pad bekam einen neuen Abstand, und die Seite wurde mitten im Wischen
     neu berechnet — der Moment, in dem Safari die feststehende Leiste mit dem
     Inhalt mitwandern ließ. Aus demselben Grund wird nur geschrieben, wenn
     sich der Wert tatsächlich ändert. */
  var navH = "";
  function measureNav() {
    var nav = document.querySelector(".bottom");
    if (!nav) return;
    var h = Math.round(nav.getBoundingClientRect().height) + "px";
    if (h === navH) return;
    navH = h;
    document.documentElement.style.setProperty("--navh", h);
  }
  measureNav();
  if (window.ResizeObserver) {
    var navEl = document.querySelector(".bottom");
    if (navEl) new ResizeObserver(measureNav).observe(navEl);
  } else {
    // Ohne ResizeObserver: nur echte Breitenänderungen (Drehen, Fenster),
    // nicht die Höhenänderung durch die Safari-Leiste.
    var lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      measureNav();
    });
  }

  /* ---------- Scroll sperren, solange ein Overlay offen ist ----------
     Gescrollt wird jetzt das Dokument, nicht mehr das innere Panel (.om-scroll)
     — siehe html.seite-scroll in css/style.css. Die Sperre muss deshalb am
     Wurzelelement ansetzen.

     Die Scrollposition wird gemerkt und beim Entsperren wiederhergestellt:
     overflow: hidden am <html> setzt die Position sonst auf 0 zurück, und
     nach dem Schließen der Lightbox stünde man wieder ganz oben. Den
     Breitensprung durch die verschwindende Bildlaufleiste fängt
     scrollbar-gutter: stable im CSS ab. */
  var lockCount = 0;
  var scrollPos = 0;
  function lockScroll() {
    lockCount++;
    if (lockCount > 1) return;
    scrollPos = window.scrollY || window.pageYOffset || 0;
    document.documentElement.style.overflow = "hidden";
  }
  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount) return;
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollPos);
  }

  /* ---------- Bilder einblenden ----------

     Jedes Bild blendet für sich auf, sobald es dekodiert ist. Das Raster
     selbst steht davon unabhängig schon vollständig da: Breite und Höhe jedes
     Bildes stehen als Attribut im HTML, die Zeilenspannen im style-Attribut —
     es gibt nichts zu messen und nichts zu sortieren.

     Vorher lief hier revealGrid(): 27-mal getBoundingClientRect(), Sortierung
     nach Bildschirmposition, dann gestaffelte Animationsverzögerungen. Nötig
     war das nur, weil das Spaltenlayout die Kacheln in einer anderen
     Reihenfolge anordnete als im Quelltext. Es war zugleich die Ursache des
     Hauptfehlers: Die Kachel startete auf opacity: 0 und wurde erst durch
     diese Klasse sichtbar. Blieb sie aus, war "geladen, aber unsichtbar" ein
     Endzustand, aus dem nur ein erzwungener Repaint befreite — der Hover.

     Jetzt ist die Richtung umgedreht (siehe html.js in css/style.css):
     sichtbar ist der Grundzustand. Ohne JavaScript, bei einem Fehler in
     diesem Skript oder bei einem verpassten Ereignis bleibt das Bild sichtbar.
     Zusätzlich schaltet eine Notbremse nach zwei Sekunden pauschal alles frei. */
  var gitter = document.querySelector(".om-grid");

  function markiereGeladen(img) {
    if (img.classList.contains("geladen")) return;
    img.classList.add("geladen");
  }

  if (gitter) {
    Array.prototype.forEach.call(gitter.querySelectorAll("img"), function (img) {
      // complete deckt zwei Fälle ab, in denen "load" nie mehr feuert: das Bild
      // lag schon im Cache, oder die Seite kommt aus dem bfcache zurück.
      if (img.complete && img.naturalWidth) {
        markiereGeladen(img);
        return;
      }
      img.addEventListener("load", function () { markiereGeladen(img); });
      // Auch ein kaputtes Bild darf die Kachel nicht dauerhaft leer lassen —
      // sichtbar ist dann immerhin das alt-Attribut statt gar nichts.
      img.addEventListener("error", function () { markiereGeladen(img); });
    });
    setTimeout(function () { gitter.classList.add("alle-sichtbar"); }, 2000);
  }

  /* ---------- Lightbox ---------- */

  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var lbDesc = document.getElementById("lbDesc");
  var openedAt = 0;
  var openSrc = null;
  var ladeLauf = 0;

  function flushView() {
    if (!openSrc || !openedAt) return;
    track({ type: "img_view", img: openSrc, cat: window.PAGE_CAT || null, dur_ms: Date.now() - openedAt });
    openedAt = 0;
  }

  /* Das große Bild wird in zwei Stufen gezeigt.

     Stufe eins ist die Kachel, die auf dem Bildschirm ohnehin schon dekodiert
     im Speicher liegt: sie steht sofort da, in der richtigen Größe, nur
     weicher. Stufe zwei ist die 1600-px-Fassung, die im Hintergrund lädt und
     stillschweigend eingesetzt wird, sobald sie fertig ist.

     Vorher wurde direkt das unskalierte Original aus images/full geladen (bis
     3543 px, bis 2,6 MB) und bis dahin blieb die Fläche leer — das war die
     Wartezeit beim Öffnen.

     ladeLauf zählt die Öffnungen mit: klickt man schnell durch mehrere Bilder,
     darf ein spät eintreffendes großes Bild nicht mehr in eine inzwischen
     andere Lightbox einsetzen. */
  function zeige(fig) {
    if (!lb) return;
    var kachel = fig.querySelector("img");
    var gross = fig.getAttribute("data-large") || fig.getAttribute("data-full");
    var voll = fig.getAttribute("data-full");
    var title = fig.getAttribute("data-title") || "";
    var desc = fig.getAttribute("data-desc") || "";
    var lauf = ++ladeLauf;

    lbImg.src = (kachel && kachel.currentSrc) || (kachel && kachel.src) || gross;
    lbImg.alt = desc || title;
    lbTitle.textContent = title;
    if (lbDesc) {
      lbDesc.textContent = desc;
      lbDesc.hidden = !desc;
    }
    lb.hidden = false;
    lockScroll();

    var hoch = new Image();
    hoch.onload = function () {
      if (lauf === ladeLauf && !lb.hidden) lbImg.src = hoch.src;
    };
    /* Die 1600er ist WebP. Kann ein Browser sie nicht (oder fehlt sie für
       dieses Bild), wird das JPEG-Original nachgeladen — dann eben langsam,
       aber nie gar nicht. */
    hoch.onerror = function () {
      if (lauf !== ladeLauf || lb.hidden || !voll || voll === gross) return;
      var ersatz = new Image();
      ersatz.onload = function () {
        if (lauf === ladeLauf && !lb.hidden) lbImg.src = ersatz.src;
      };
      ersatz.src = voll;
    };
    hoch.src = gross;

    openSrc = voll;
    openedAt = Date.now();
    track({ type: "img_click", img: voll, cat: window.PAGE_CAT || null });
  }

  function closeLb() {
    if (!lb || lb.hidden) return;
    flushView();
    ladeLauf++;
    lb.hidden = true;
    lbImg.src = "";
    openSrc = null;
    unlockScroll();
  }

  document.addEventListener("click", function (e) {
    var fig = e.target.closest && e.target.closest(".om-grid figure[data-full]");
    if (!fig) return;
    zeige(fig);
  });

  /* Geschlossen wird über den Knopf oben rechts und über den Hintergrund —
     aber NICHT über das Bild selbst. Vorher hing der Handler am gesamten
     #lightbox, weshalb ein Klick auf das gerade geöffnete Bild es wieder
     zuklappte; wer hineinzoomen oder es nur ansehen wollte, verlor es. */
  if (lb) {
    lb.addEventListener("click", function (e) {
      if (e.target === lb || (e.target.closest && e.target.closest(".lb-close"))) closeLb();
    });
  }

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
    // Eine stehen gebliebene Fehlermeldung vom letzten Versuch zurücksetzen
    if (contactThanks) { contactThanks.hidden = true; contactThanks.classList.remove("fehler"); }
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
    /* Erfolg und Fehler auseinanderhalten — siehe die ausführliche Begründung
       in js/app.js. Eine stille Fehlmeldung kostet eine Kundenanfrage. */
    var UI = window.PP_UI || {};
    var fSend = document.getElementById("fSend");
    var geglueckt = function () {
      if (contactForm) contactForm.hidden = true;
      if (contactThanks) {
        contactThanks.textContent = UI.thanks || contactThanks.textContent;
        contactThanks.classList.remove("fehler");
        contactThanks.hidden = false;
      }
    };
    var gescheitert = function () {
      if (contactThanks) {
        contactThanks.textContent = UI.sendError || "";
        contactThanks.classList.add("fehler");
        contactThanks.hidden = false;
      }
      if (fSend) { fSend.disabled = false; fSend.textContent = UI.send || fSend.textContent; }
    };
    if (fSend) fSend.disabled = true;
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: fName ? fName.value : "",
        email: fMail ? fMail.value : "",
        message: fMsg ? fMsg.value : ""
      })
    }).then(function (r) {
      if (!r.ok) { gescheitert(); return; }
      return r.json().then(function (d) {
        if (d && d.ok) geglueckt(); else gescheitert();
      }, geglueckt);
    }, gescheitert);
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
    // Ohne die Klasse "cat-pill" fehlte den Klonen jede Pillen-Optik (Rahmen,
    // Hintergrund) — übrig blieb nur die globale rote Link-Farbe. Das ließ
    // dieses Blatt anders aussehen als das Pendant auf der Startseite
    // (js/app.js), das seinen Einträgen dieselbe Optik per pillStyle() gibt.
    // ".home" (Startseite-Button) wird nicht mitgeklont — der steht in der
    // Leiste ohnehin schon direkt daneben.
    document.querySelectorAll(".cats-nav a.cat-pill:not(.home)").forEach(function (a) {
      var clone = document.createElement("a");
      clone.href = a.getAttribute("href");
      clone.textContent = a.textContent;
      clone.className = "cat-pill" + (a.classList.contains("current") ? " current" : "");
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
