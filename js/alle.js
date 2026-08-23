/* pepperle.de — Raster für /alle.html: alle Werke aus allen Kategorien,
   sortiert nach echten Klickzahlen aus der eigenen, anonymen Statistik.

   Läuft VOR js/page.js (das erst am Ende dieser Datei nachgeladen wird), damit
   page.js beim Verdrahten von Lightbox und Scroll-Einblendung bereits das
   fertig sortierte Raster im DOM vorfindet. */
(function () {
  "use strict";

  var POPULAR_URL = "https://pepperle-analytics.a347157.workers.dev/api/popular";
  var FETCH_TIMEOUT_MS = 1500;

  // Dieselbe gespeicherte Wahl wie js/page.js lesen (das erst später nachgeladen
  // wird) — sonst würden Alt-Texte und Rang-Abzeichen kurz auf Deutsch
  // aufblitzen, bevor page.js auf eine gespeicherte EN-Wahl umschaltet.
  var isEn = (function () {
    try { return localStorage.getItem("pp_lang") === "en"; } catch (e) { return false; }
  })();

  function titleFromSrc(src) {
    var s = src.split("/").pop().replace(/\.[a-z]+$/i, "").replace(/^\d+-/, "");
    s = s.replace(/-/g, " ").replace(/\s+/g, " ").trim();
    s = s.replace(/ae/g, "ä").replace(/oe/g, "ö").replace(/ue/g, "ü").replace(/ss(?= |$)/g, "ß");
    return s.split(" ").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }

  // Sowohl "images/tiles/…" (Klicks von der Startseite) als auch
  // "images/full/…" (Klicks von den Kategorieseiten) meinen dasselbe Werk —
  // für die Rangliste auf einen gemeinsamen Schlüssel zusammenführen.
  function canonical(path) {
    return path.replace(/^images\/(tiles|full)\//, "");
  }

  // Reihenfolge, in der die Kategorien zusammengeführt werden, solange noch
  // keine (oder keine frischen) Klickzahlen vorliegen — deterministisch, damit
  // Suchmaschinen-Crawler und Erstbesucher ohne JavaScript-Wartezeit ein
  // sinnvolles Bild bekommen.
  var CAT_ORDER = ["food", "transport", "landscape", "people", "items", "poster", "pharma", "logos", "packaging"];

  function buildList() {
    var out = [];
    CAT_ORDER.forEach(function (cat) {
      (IMAGES[cat] || []).forEach(function (tile) {
        out.push({ cat: cat, tile: tile, full: tile.replace("images/tiles/", "images/full/"), key: canonical(tile) });
      });
    });
    return out;
  }

  function fetchPopularity() {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, FETCH_TIMEOUT_MS);
    return fetch(POPULAR_URL, { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .then(function (d) {
        var clicks = {};
        (d.items || []).forEach(function (it) {
          var key = canonical(it.img);
          clicks[key] = (clicks[key] || 0) + it.clicks;
        });
        return clicks;
      })
      .catch(function () { return {}; })
      .finally(function () { clearTimeout(timer); });
  }

  function render(list, clicks) {
    // Stabil sortieren: höhere Klickzahl zuerst, sonst Kategorie-Reihenfolge erhalten
    var ranked = list.map(function (it, i) {
      return { it: it, n: clicks[it.key] || 0, i: i };
    }).sort(function (a, b) { return b.n - a.n || a.i - b.i; });

    var grid = document.getElementById("grid");
    var frag = document.createDocumentFragment();
    ranked.forEach(function (r, idx) {
      var top = idx < 3 && r.n > 0;
      var title = titleFromSrc(r.it.tile);
      var li = document.createElement("li");
      li.className = "work" + (top ? " work-feat" : "");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "work-btn";
      btn.setAttribute("data-full", r.it.full);
      btn.setAttribute("data-title", title);
      var picture = document.createElement("picture");
      var source = document.createElement("source");
      source.srcset = r.it.tile.replace(/\.jpg$/, ".webp");
      source.type = "image/webp";
      var img = document.createElement("img");
      img.src = r.it.tile;
      img.alt = title + (isEn ? " — illustration by Walter Pepperle" : " — Illustration von Walter Pepperle");
      img.loading = idx < 12 ? "eager" : "lazy";
      img.decoding = "async";
      picture.appendChild(source);
      picture.appendChild(img);
      btn.appendChild(picture);
      if (top) {
        var badge = document.createElement("span");
        badge.className = "work-badge";
        var rankNum = document.createElement("b");
        rankNum.textContent = "0" + (idx + 1);
        var rankLabel = document.createElement("span");
        rankLabel.textContent = isEn ? "Most viewed" : "Meistgesehen";
        badge.appendChild(rankNum);
        badge.appendChild(rankLabel);
        btn.appendChild(badge);
      }
      var cap = document.createElement("span");
      cap.className = "work-cap";
      cap.textContent = title;
      btn.appendChild(cap);
      li.appendChild(btn);
      frag.appendChild(li);
    });
    grid.textContent = "";
    grid.appendChild(frag);

    var count = document.getElementById("pgCount");
    if (count) {
      count.textContent = ranked.length + (isEn ? " works — sorted by popularity" : " Arbeiten — sortiert nach Beliebtheit");
    }

    // page.js erst jetzt laden: es verdrahtet Lightbox und Scroll-Einblendung
    // anhand des DOM-Stands zum Ladezeitpunkt.
    var s = document.createElement("script");
    s.src = "js/page.js";
    document.body.appendChild(s);
  }

  var list = buildList();
  fetchPopularity().then(function (clicks) { render(list, clicks); });
})();
