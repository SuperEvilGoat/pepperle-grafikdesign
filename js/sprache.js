/* pepperle.de — Sprachwähler.

   Der frühere Umschalter in der Topbar ist entfallen: jede Sprachfassung ist
   eine eigene, statische Seite (/en/, /es/, /fr/, /it/ — Deutsch ohne Präfix).
   Zur Laufzeit wird deshalb kein Text mehr getauscht, hier steht nur noch die
   Auswahlliste hinter dem kleinen Link "Sprache" unten in der Fußleiste.

   Die Liste benutzt dieselbe Überblendung wie "Alle Kategorien" auf dem Handy
   (#sheetModal / .sheet-inner) — kein eigenes Design.

   Die automatische Erkennung passiert woanders: als winziges Inline-Skript im
   <head>, damit sie vor dem ersten Rendern greift (siehe erkennung() in
   Quellen/seiten-vorlage.mjs). Hier wird nur die AUSDRÜCKLICHE Wahl
   gespeichert. Das ist nötig, weil Deutsch als einzige Fassung kein Präfix in
   der Adresse hat: Ohne diese Notiz würde die Erkennung einen Besucher, der
   sich bewusst für Deutsch entscheidet, sofort wieder in seine Gerätesprache
   zurückschicken. */
(function () {
  "use strict";

  var LANG_KEY = "pp_lang";
  var STANDARD = "de";

  var liste = window.PP_LANGS || [];
  var aktuell = window.PP_LANG || STANDARD;
  var modal = document.getElementById("sheetModal");
  var inner = document.getElementById("sheetInner");
  if (!modal || !inner || !liste.length) return;

  /* Zieladresse derselben Seite in einer anderen Sprache.
     Bewusst relativ gerechnet, damit es auch unter der Testadresse
     superevilgoat.github.io/pepperle-grafikdesign/ stimmt. */
  function ziel(code) {
    var teile = location.pathname.split("/");
    var datei = teile[teile.length - 1] || "";
    var imOrdner = false;
    for (var i = 0; i < liste.length; i++) {
      if (teile[teile.length - 2] === liste[i].code) { imOrdner = true; break; }
    }
    var hoch = imOrdner ? "../" : "";
    // Impressum und Datenschutz gibt es nur auf Deutsch und Englisch; aus den
    // übrigen Sprachen führt die Wahl deshalb auf die Startseite.
    if (/^(impressum|datenschutz)\.html$/.test(datei) && code !== "de" && code !== "en") {
      datei = "index.html";
    }
    return hoch + (code === STANDARD ? "" : code + "/") + datei;
  }

  function merken(code) {
    try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* Privatmodus */ }
  }

  function oeffnen() {
    inner.textContent = "";
    liste.forEach(function (s, i) {
      var a = document.createElement("a");
      a.href = ziel(s.code);
      a.textContent = s.name;
      a.setAttribute("lang", s.code);
      // Deutsch und Englisch stehen immer oben; darunter beginnt der
      // alphabetisch sortierte Rest, optisch abgesetzt.
      if (i === 2) a.classList.add("sheet-sep");
      if (s.code === aktuell) a.setAttribute("aria-current", "true");
      a.style.border = "1px solid rgba(238,243,248,0.28)";
      a.style.background = s.code === aktuell ? "rgba(238,243,248,0.12)" : "rgba(238,243,248,0.04)";
      a.style.color = "rgba(238,243,248,0.78)";
      a.addEventListener("click", function () {
        merken(s.code);
        if (window.pptrack) window.pptrack({ type: "lang_pick", cat: s.code });
      });
      inner.appendChild(a);
    });
    modal.hidden = false;
  }

  function schliessen() { modal.hidden = true; }

  // Bewusst über das Dokument statt direkt am Knopf: js/app.js baut die untere
  // Leiste beim Wechsel zwischen Handy- und Desktop-Ansicht komplett neu
  // (renderNavs), wodurch ein direkt gebundener Handler verloren ginge.
  // Aufhänger ist eine Klasse, keine id: js/app.js baut auf der Startseite
  // sowohl die Desktop- als auch die Mobilleiste, beide mit eigenem Knopf —
  // zwei Elemente mit derselben id wären ungültiges HTML.
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains("js-lang")) { e.preventDefault(); oeffnen(); }
  });
  modal.addEventListener("click", schliessen);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) schliessen();
  });
})();
