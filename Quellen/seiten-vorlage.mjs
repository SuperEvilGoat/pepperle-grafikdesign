/* Geteilte Seitenvorlage für pepperle.de.

   Diese Datei ist die EINZIGE Stelle, an der das HTML der Seiten entsteht.
   Sie wird von zwei Seiten benutzt:
     • Quellen/build-seiten.mjs — lokaler Build, normaler Import
     • worker/src/site-gen.js   — Dashboard-Veröffentlichung, lädt diese Datei
       zur Laufzeit aus dem Repo und wertet sie per new Function aus (wie
       schon Quellen/texte/*.json und seiten-texte.mjs)

   Deshalb: keine Importe, kein Dateisystem, keine Node-Bausteine — nur reine
   Funktionen über hereingereichte Daten. Vorher liefen die beiden Generatoren
   auseinander (unterschiedliche theme-color, ein Preload auf eine Schrift, die
   es nicht mehr gibt); genau das soll nicht wieder passieren.

   Sprachen: Deutsch liegt ohne Präfix auf den alten Contao-URLs, alle anderen
   in einem Unterordner (/en/, /es/, /fr/, /it/). Verweise innerhalb der Seiten
   sind bewusst RELATIV — die Seite muss auch unter der Testadresse
   superevilgoat.github.io/pepperle-grafikdesign/ funktionieren, wo ein
   absoluter Pfad ins Leere liefe. */

export const SPRACHEN = ["de", "en", "es", "fr", "it"];
export const STANDARD = "de";
export const AUSWEICH = "en";

/* Reihenfolge im Sprachwähler: Deutsch und Englisch immer oben, der Rest
   alphabetisch nach dem Endonym (entschieden 2026-09-06). */
export function sprachReihenfolge(namen) {
  const rest = SPRACHEN.filter((l) => l !== "de" && l !== "en");
  const coll = new Intl.Collator("de");
  rest.sort((a, b) => coll.compare(namen[a], namen[b]));
  return ["de", "en", ...rest];
}

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Verzeichnis-Vorsatz einer Sprachfassung, aus Sicht der Seite selbst */
export function rel(lang) {
  return lang === STANDARD ? "" : "../";
}

/* Vorsatz nur für relative Pfade. Neu hochgeladene Bilder liegen in R2 und
   kommen als absolute URL (IMG_ORIGIN) — die darf nicht präfixiert werden. */
export function pfad(vorsatz, p) {
  return !p || /^(https?:)?\/\//.test(p) ? p : vorsatz + p;
}

/* Adresse einer CSS- oder JS-Datei mit Versionsstempel.

   GitHub Pages liefert HTML, CSS und JS mit Cache-Control: max-age=600 aus,
   und die Adressen css/style.css oder js/page.js ändern sich bei einem
   Deploy nie. Nach jedem Deploy gab es deshalb ein Zeitfenster, in dem ein
   wiederkehrender Besucher neues HTML gegen altes CSS bekam — Safari
   besonders hartnäckig, weil sein "Reload From Origin" die Unterressourcen
   weniger gründlich neu anfragt als Chromes Hard Reload. Genau so entstand
   am 10.09.2026 eine halb umgestellte Kategorieseite.

   Der Stempel ist der gekürzte SHA-256 des Dateiinhalts: Ändert sich die
   Datei, ändert sich die Adresse, und das neue HTML zeigt zwangsläufig auf
   die neue Fassung. Unveränderte Dateien behalten ihre Adresse und bleiben
   im Browser-Cache gültig.

   Die Stempel rechnet Quellen/build-seiten.mjs aus den Dateien und legt sie
   in website/Quellen/asset-versionen.json ab; der Worker liest dieselbe
   Datei. Diese Vorlage bleibt dadurch frei von Dateisystem und Node-Bausteinen.

   Fehlt ein Stempel, entsteht die blanke Adresse wie bisher — nie eine
   kaputte. js/data.js bekommt bewusst KEINEN: der Worker schreibt sie bei
   jeder Bildänderung neu, erzeugt index.html aber nicht mit. Ein Stempel
   dort bliebe auf der Startseite also stehen und zeigte auf eine veraltete
   Adresse. */
export function asset(vorsatz, datei, versionen) {
  const v = versionen && versionen[datei];
  return `${vorsatz}${datei}${v ? `?v=${v}` : ""}`;
}

/* Logo als Inline-SVG. Steht hier, damit beide Generatoren dasselbe erzeugen. */
export function logoSvg(vorsatz, name) {
  return `<svg viewBox="0 0 3543 1417" role="img" aria-label="${esc(name)} — Logo">
        <polygon points="1606,75 2612,1307 595,1307" fill="#ea4f43"></polygon>
        <image href="${vorsatz}assets/signature-720.png" x="0" y="0" width="3543" height="1417"></image>
      </svg>`;
}

/* Öffentliche Adresse einer Datei in einer Sprache */
export function url(origin, lang, datei) {
  const d = datei === "index.html" ? "" : datei;
  return lang === STANDARD ? `${origin}/${d}` : `${origin}/${lang}/${d}`;
}

/* hreflang-Verbund: jede Fassung nennt alle Sprachen einschließlich sich
   selbst, dazu x-default auf Deutsch. Fehlt die Rückverlinkung, verwirft
   Google die Auszeichnung vollständig — deshalb wird sie erzeugt und nie von
   Hand gepflegt. `nur` beschränkt den Verbund (Rechtsseiten: nur de + en). */
export function hreflang(origin, datei, nur) {
  const liste = nur || SPRACHEN;
  const zeilen = liste.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="${url(origin, l, datei)}">`
  );
  zeilen.push(`  <link rel="alternate" hreflang="x-default" href="${url(origin, STANDARD, datei)}">`);
  return zeilen.join("\n");
}

/* Spracherkennung — läuft inline im <head>, vor dem ersten Rendern.
   Reihenfolge: Sprachpräfix in der Adresse > gemerkte Wahl > Gerätesprache.
   Ausschließlich die Gerätesprache, nie Standort oder Zeitzone. */
export function erkennung() {
  const S = JSON.stringify(SPRACHEN);
  return `<script>(function(){var S=${S},D="${STANDARD}",F="${AUSWEICH}",K="pp_lang";
try{var g=location.pathname.split("/"),i=g.length-2;if(i>=0&&S.indexOf(g[i])>-1)return;
if(navigator.webdriver||/bot|crawl|spider|slurp|mediapartners|inspectiontool/i.test(navigator.userAgent||""))return;
var z=null;try{var w=localStorage.getItem(K);if(w&&S.indexOf(w)>-1)z=w;}catch(e){}
if(!z){var L=navigator.languages||(navigator.language?[navigator.language]:null);if(!L||!L.length)return;
for(var a=0;a<L.length&&!z;a++){var t=String(L[a]||"").toLowerCase();
while(t){if(S.indexOf(t)>-1){z=t;break;}var c=t.lastIndexOf("-");t=c>0?t.slice(0,c):"";}}
if(!z)z=F;}
if(z===D)return;var f=g[g.length-1]||"";
location.replace(z+"/"+f+location.search+location.hash);}catch(e){}})();</script>`;
}

/* Gemeinsamer Kopfbereich aller Seiten */
export function kopf(o) {
  const r = rel(o.lang);
  return `  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(o.title)}</title>
  <meta name="description" content="${esc(o.description)}">
  <link rel="canonical" href="${o.canonical}">
  <meta name="robots" content="${o.robots || "index, follow, max-image-preview:large, max-snippet:-1"}">
${hreflang(o.origin, o.datei, o.hreflangNur)}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(o.siteName)}">
  <meta property="og:locale" content="${o.locale.replace("-", "_")}">
${SPRACHEN.filter((l) => l !== o.lang && (!o.hreflangNur || o.hreflangNur.indexOf(l) > -1))
  .map((l) => `  <meta property="og:locale:alternate" content="${o.locales[l].replace("-", "_")}">`)
  .join("\n")}
  <meta property="og:url" content="${o.canonical}">
  <meta property="og:title" content="${esc(o.ogTitle)}">
  <meta property="og:description" content="${esc(o.ogDescription || o.description)}">
  <meta property="og:image" content="${o.ogImage}">${
    o.ogImageMeta
      ? `\n  <meta property="og:image:width" content="${o.ogImageMeta.w}">\n  <meta property="og:image:height" content="${o.ogImageMeta.h}">\n  <meta property="og:image:alt" content="${esc(o.ogImageMeta.alt)}">`
      : ""
  }
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(o.ogTitle)}">
  <meta name="twitter:description" content="${esc(o.ogDescription || o.description)}">
  <meta name="twitter:image" content="${o.ogImage}">
  <meta name="theme-color" content="#01172c">
  <link rel="icon" type="image/svg+xml" href="${r}assets/favicon.svg">
  <link rel="preload" href="${r}assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${r}assets/fonts/ibm-plex-mono-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${r}assets/signature-720.png" as="image">
  <link rel="stylesheet" href="${asset(r, "css/fonts.css", o.assetV)}">
  <link rel="stylesheet" href="${asset(r, "css/base.css", o.assetV)}">
  <link rel="stylesheet" href="${asset(r, `css/${o.stylesheet || "style.css"}`, o.assetV)}">
  <script>document.documentElement.className+=" js";</script>
  ${erkennung()}`;
}

/* Fußleiste: Kategorien, Sprache, Rechtliches — identisch auf allen Seiten.
   Der Sprachlink ist bewusst so klein und zurückhaltend wie der Rechtslink
   (Klasse .legal-link), nicht als auffälliger Knopf. */
export function fussLeiste(o) {
  const pillen = o.seiten
    .map((p) => {
      const jetzt = p.slug === o.slug;
      // Bewusst ohne Vorsatz: von /fr/ aus führt "food-drinks.html" nach
      // /fr/food-drinks.html — jede Sprachfassung bleibt so in sich geschlossen,
      // ohne dass dafür etwas gespeichert werden müsste.
      return `        <a class="cat-pill${jetzt ? " current" : ""}" href="${p.slug}.html"${
        jetzt ? ' aria-current="page"' : ""
      }>${esc(o.texte.seiten[p.slug].h1)}</a>`;
    })
    .join("\n");
  // Reihenfolge wie bisher: Kategorien, dann die Zusatzknöpfe der Seite
  // (Weitere Kategorien / Startseite), zuletzt die beiden kleinen Textlinks.
  // "Sprache" steht bewusst direkt neben "Impressum & Datenschutz" und in
  // derselben Größe — kein auffälliger Knopf. Die Hülle .legal-row ist am
  // Desktop per display: contents unsichtbar; auf dem Handy stellt sie beide
  // Links gemeinsam in eine eigene Zeile (css/style.css).
  return `${pillen}${o.extra ? "\n" + o.extra : ""}
        <span class="legal-row">
          <button type="button" class="legal-link js-lang">${esc(o.texte.ui.language)}</button>
          <a class="legal-link" href="${rechtsZiel(o.lang)}">${esc(o.texte.ui.legal)}</a>
        </span>`;
}

/* Impressum und Datenschutzerklärung gibt es nur auf Deutsch und Englisch
   (Entscheidung 2026-09-06). Aus den übrigen Sprachfassungen führt der
   Rechtslink deshalb auf die englische Seite — beschriftet aber in der
   jeweiligen Sprache, damit es eine erkennbare Wahl ist und keine Sackgasse. */
export function rechtsZiel(lang) {
  if (lang === "de" || lang === "en") return "impressum.html";
  return "../en/impressum.html";
}

/* Sprachwähler: dieselbe Überblendung wie "Alle Kategorien" auf dem Handy
   (#sheetModal / .sheet-inner). Die Liste entsteht zur Laufzeit in
   js/sprache.js — hier stehen nur die Daten, die sie dafür braucht. */
export function sprachDaten(namen, lang, ui, kategorien) {
  const teile = [
    `window.PP_LANG=${JSON.stringify(lang)}`,
    // Vorsatz für Pfade, die erst zur Laufzeit entstehen: die Drift-Collage auf
    // der Startseite baut ihre Bilder aus js/data.js zusammen, und dort stehen
    // die Pfade ohne Sprachordner. Ohne diesen Vorsatz lüde /fr/index.html
    // seine Kacheln von /fr/images/… — die es nicht gibt.
    `window.PP_BASE=${JSON.stringify(rel(lang))}`,
    `window.PP_LANGS=${JSON.stringify(sprachReihenfolge(namen).map((l) => ({ code: l, name: namen[l] })))}`
  ];
  // Die Oberflächentexte reisen als Daten mit, statt wie früher doppelt in
  // js/app.js und js/page.js zu stehen. Beide Skripte kennen dadurch keine
  // Sprache mehr — sie lesen nur noch, was die Seite mitbringt.
  if (ui) teile.push(`window.PP_UI=${JSON.stringify(ui)}`);
  if (kategorien) teile.push(`window.PP_CATS=${JSON.stringify(kategorien)}`);
  teile.push(MAIL_SKRIPT);
  return `<script>${teile.join(";")};</script>`;
}

/* ---------- E-Mail-Adresse gegen Adress-Sammler ----------
   Im ausgelieferten HTML steht die Adresse nirgends am Stück: nur rückwärts
   und mit "!" statt "@" im Attribut data-m. Sichtbar ist ohne JavaScript
   "info", ein per CSS erzeugtes "@" (.mail-at in css/base.css) und
   "pepperle.de" — für Menschen lesbar, im Quelltext aber keine Adresse.
   MAIL_SKRIPT setzt beim Laden daraus den echten mailto-Link zusammen und
   füllt den Platzhalter {email} in der Fehlermeldung des Formulars. Es steht
   in sprachDaten(), weil das jede Seite am Ende des <body> mitbringt — alle
   .js-mail-Elemente sind dann schon da. */
export function mailLink(email, klasse) {
  const [name, domain] = email.split("@");
  const verdeckt = email.split("").reverse().join("").replace("@", "!");
  return `<a class="${klasse ? klasse + " " : ""}js-mail" data-m="${esc(verdeckt)}">${esc(name)}<span class="mail-at"></span>${esc(domain)}</a>`;
}

const MAIL_SKRIPT =
  '(function(){function m(a){return a.getAttribute("data-m").split("").reverse().join("").replace("!","@")}' +
  'var l=document.querySelectorAll(".js-mail");' +
  'for(var i=0;i<l.length;i++){var e=m(l[i]);l[i].href="mailto:"+e;l[i].textContent=e}' +
  'var k=document.querySelector(".contact-mail.js-mail"),u=window.PP_UI;' +
  'if(k&&u&&u.sendError)u.sendError=u.sendError.replace("{email}",m(k))})()';

/* ---------- Werk-Raster ----------

   Das Raster der Kategorieseiten ist ein CSS-Grid mit vorberechneten
   Zeilenspannen (siehe .om-grid in css/style.css), kein Spaltenlayout mehr.
   Die Spannen entstehen hier, weil nur der Build die Bildmaße kennt. */

/* Wie viele Rasterzeilen eine Kachel überspannt.

   Muss zahlengenau zu css/style.css passen:
     Rasterfeinheit  grid-auto-rows: 0.1cqw   → EINHEIT
     Spaltenabstand  column-gap: 2cqw         → ABSTAND
     Kachelabstand   margin-bottom: 2cqw      → derselbe Wert

   Gerechnet wird in cqw, also in Prozent der Rasterbreite. Dadurch hängen die
   Spannen nur noch von der Spaltenzahl ab und gelten in jeder Fenstergröße —
   sonst bräuchte jede Bildschirmbreite eigene Zahlen.

   Aufgerundet wird bewusst nach oben: der Rest von höchstens einer
   Rasterzeile (≈ 1,4 px) fällt durch align-self: start als Zwischenraum unter
   die Kachel statt als Beschnitt ins Bild. */
const RASTER_EINHEIT = 0.1;
const RASTER_ABSTAND = 2;

export function spanne(w, h, spalten) {
  if (!w || !h) return Math.ceil((75 + RASTER_ABSTAND) / RASTER_EINHEIT);
  const spaltenBreite = (100 - RASTER_ABSTAND * (spalten - 1)) / spalten;
  const hoehe = spaltenBreite * (h / w);
  return Math.ceil((hoehe + RASTER_ABSTAND) / RASTER_EINHEIT);
}

/* Die sizes-Angabe beschreibt dem Browser, wie breit die Kachel im Layout
   tatsächlich wird — nur so kann er aus dem srcset die passende Fassung
   wählen, und zwar bevor das CSS ausgewertet ist. Die Werte folgen den
   Umbruchpunkten in css/style.css (4 / 3 / 2 / 1 Spalten) und sind eine Spur
   großzügig gerechnet: zu klein geschätzt lieferte er ein unscharfes Bild,
   zu groß nur ein paar Kilobyte zu viel. */
export const KACHEL_SIZES =
  "(max-width: 620px) calc(100vw - 32px), (max-width: 860px) 46vw, " +
  "(max-width: 1180px) 31vw, min(24vw, 345px)";

/* Baut aus den vorhandenen Fassungen eines Bildes das srcset.
   b.quellen ist [{ w, src }, …] und kommt aus dem jeweiligen Generator —
   lokal aus dem Dateisystem (Quellen/build-seiten.mjs), im Dashboard aus D1
   (worker/src/site-gen.js). Fehlen die neuen Fassungen (Bild von vor der
   Umstellung), bleibt genau die 800er übrig und alles funktioniert wie
   bisher, nur ohne Auswahl. */
export function kachelSrcset(vorsatz, b) {
  const q = (b.quellen || []).filter((x) => x && x.src);
  if (!q.length) return "";
  return q.map((x) => `${esc(pfad(vorsatz, x.src))} ${x.w}w`).join(", ");
}

/* Ladepriorität nach der Position im Raster.

   Das ist der Punkt, an dem der Umbau seinen Zweck erfüllt: Weil das Grid in
   Lesereihenfolge platziert, sind die ersten vier Bilder im Quelltext auch
   die vier der sichtbaren ersten Reihe. Vorher (column-count, spaltenweise
   gefüllt) waren das die Bilder 1, 8, 15 und 22 — deshalb brachte die frühere
   Regel "nur Bild 0 lädt eager" für die erste Reihe so gut wie nichts.

   Bild 2–4 stehen bewusst auf lazy UND fetchpriority=high: die beiden
   Angaben sind unabhängig voneinander. lazy entscheidet, OB jetzt geladen
   wird (auf dem Desktop ja, sie stehen im Bild; auf dem Handy nein, dort
   liegen sie weit unten), fetchpriority entscheidet, WIE DRINGEND. So ist die
   erste Reihe auf dem Desktop sofort da, ohne auf dem Handy Daten zu
   verschwenden. */
function ladeArt(i) {
  if (i === 0) return 'loading="eager" fetchpriority="high"';
  if (i < 4) return 'loading="lazy" fetchpriority="high"';
  if (i < 12) return 'loading="lazy"';
  return 'loading="lazy" fetchpriority="low"';
}

/* ---------- Kategorieseite ---------- */

export function kategorieSeite(o) {
  const r = rel(o.lang);
  const t = o.texte;
  const seite = t.seiten[o.slug];
  const kind = seite.altKind || t.alt.kindDefault;
  const canonical = url(o.origin, o.lang, `${o.slug}.html`);

  // Ganzer Beschreibungssatz, wenn vorhanden — er sagt bereits, was zu sehen
  // ist, und braucht den festen Anhang "— Illustration von … " nicht mehr.
  // Fehlt er, greift unverändert das bisherige Muster aus den Sprachdateien.
  // Deshalb kann der Umbau ausgerollt werden, bevor eine einzige Beschreibung
  // geschrieben ist.
  const bilder = o.bilder.map((b) => ({
    ...b,
    alt: b.description || t.alt.pattern
      .replace("{title}", b.title)
      .replace("{kind}", kind)
      .replace("{name}", o.site.name)
      .replace("{city}", t.ui.city || o.site.city)
  }));

  const raster = bilder
    .map((b, i) => {
      const srcset = kachelSrcset(r, b);
      /* Die Spannen für 4, 3 und 2 Spalten stehen als Custom Properties an der
         Kachel; css/style.css greift je Umbruchpunkt die passende ab. Einspaltig
         (Handy) braucht keine — dort ist das Raster ein schlichter Flex-Stapel. */
      const spannen = `--s4:${spanne(b.w, b.h, 4)};--s3:${spanne(b.w, b.h, 3)};--s2:${spanne(b.w, b.h, 2)}`;
      /* data-title und data-desc sind getrennt: die Kachel zeigt beim
         Überfahren nur den kurzen Titel, die Lightbox darunter Titel UND
         Beschreibungssatz. Vorher lag in data-title beides vermischt. */
      return `          <figure style="${spannen}" data-large="${esc(pfad(r, b.large || b.full))}" data-full="${esc(
        pfad(r, b.full)
      )}" data-title="${esc(b.title)}" data-desc="${esc(b.description || "")}">
            <picture>${
              srcset
                ? `\n              <source srcset="${srcset}" sizes="${KACHEL_SIZES}" type="image/webp">`
                : ""
            }
              <img src="${esc(pfad(r, b.tile))}" alt="${esc(b.alt)}" width="${b.w}" height="${b.h}"
                   ${ladeArt(i)} decoding="async" draggable="false">
            </picture>
            <figcaption>${esc(b.title)}</figcaption>
          </figure>`;
    })
    .join("\n");

  /* Das erste Bild wird schon im <head> angefordert, bevor der Browser das
     CSS ausgewertet oder den Body geparst hat — es ist der LCP-Kandidat der
     Seite. imagesrcset/imagesizes müssen exakt dem <img> unten entsprechen,
     sonst lädt der Browser zwei verschiedene Fassungen statt einer. */
  const erstesBild = bilder[0];
  const vorladen = erstesBild
    ? (() => {
        const srcset = kachelSrcset(r, erstesBild);
        return srcset
          ? `\n  <link rel="preload" as="image" fetchpriority="high" type="image/webp" imagesrcset="${srcset}" imagesizes="${KACHEL_SIZES}">`
          : `\n  <link rel="preload" as="image" fetchpriority="high" href="${esc(pfad(r, erstesBild.tile))}">`;
      })()
    : "";

  const pad2 = (n) => String(n).padStart(2, "0");
  const nr = o.seiten.findIndex((p) => p.slug === o.slug) + 1;
  const eyebrow = `${t.ui.categoryWord} ${pad2(nr)} / ${pad2(o.seiten.length)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.ui.home, item: url(o.origin, o.lang, "index.html") },
          { "@type": "ListItem", position: 2, name: seite.h1, item: canonical }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": canonical,
        url: canonical,
        name: seite.h1,
        description: seite.description,
        inLanguage: t.locale,
        // Person und Website bleiben bewusst die deutschen @id — es ist EINE
        // Person und EINE Website in fünf Fassungen, nicht fünf davon.
        isPartOf: { "@id": `${o.origin}/#website` },
        about: { "@id": `${o.origin}/#person` },
        hasPart: bilder.slice(0, 60).map((b) => ({
          "@type": "ImageObject",
          contentUrl: pfad(`${o.origin}/`, b.full),
          thumbnailUrl: pfad(`${o.origin}/`, b.tile),
          name: b.title,
          caption: b.alt,
          creator: { "@id": `${o.origin}/#person` },
          creditText: o.site.name,
          copyrightNotice: `© ${o.site.name}`,
          license: url(o.origin, o.lang === "de" ? "de" : "en", "impressum.html")
        }))
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="${o.lang}" class="seite-scroll">
<head>
${kopf({
  ...o,
  datei: `${o.slug}.html`,
  title: `${seite.title} | ${o.site.name}`,
  description: seite.description,
  ogTitle: `${seite.h1} — ${o.site.name}`,
  ogImage: pfad(`${o.origin}/`, bilder[0] ? bilder[0].full : "assets/og-image.png"),
  canonical,
  siteName: `${o.site.name} — ${o.site.role}`,
  locale: t.locale
})}${vorladen}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <div id="stage">
    <div class="glow"></div>

    <div class="om-chrome">
      <div class="vignette"></div>
      <a class="om-logo" href="index.html" aria-label="${esc(o.site.name)} — ${esc(t.ui.home)}">${o.logoSvg}</a>
      <p class="om-tag"><span class="vh">${esc(o.site.name)} — </span><span id="tagline">${esc(t.ui.tagline)}</span></p>
      <a class="back-btn" href="index.html" aria-label="${esc(t.ui.home)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <div class="om-fade-top"></div>
      <div class="om-fade"></div>
      <div class="bottom">
        <nav class="cats-nav" id="catsNav" aria-label="${esc(t.ui.categoryWord)}">
${fussLeiste({
  ...o,
  texte: t,
  extra: `        <button type="button" class="cat-pill more" id="moreCatsBtn">${esc(t.ui.moreCats)}</button>
        <button type="button" class="cat-pill contact-pill js-contact">${esc(t.ui.contact)}</button>`
})}
        </nav>
      </div>
    </div>

    <div class="om-scroll">
      <div class="om-pad">
        <header class="om-head">
          <div>
            <p class="om-eyebrow"><span id="pgEyebrow">${esc(eyebrow)}</span></p>
            <h1 id="pgH1">${esc(seite.h1)}</h1>
          </div>
          <div class="om-head-side">
            <div class="om-intro" id="pgIntro">
${seite.intro.map((x) => `              <p>${esc(x)}</p>`).join("\n")}
            </div>
            <p class="om-count"><span class="om-count-num" id="pgCountNum">${bilder.length}</span><span id="pgCount">${esc(
    t.ui.worksLabel
  )} — ${esc(t.ui.hint)}</span></p>
          </div>
        </header>
        <div class="om-grid-wrap">
          <div class="om-grid">
${raster}
          </div>
        </div>
      </div>
    </div>

    <div class="topbar">
      <button type="button" class="contact-btn" id="contactBtn">${esc(t.ui.contact)}</button>
    </div>

    <div id="lightbox" hidden>
      <div class="lb-inner">
        <img id="lbImg" alt="">
        <p class="lb-title" id="lbTitle"></p>
        <p class="lb-desc" id="lbDesc" hidden></p>
        <button type="button" class="lb-close" aria-label="${esc(t.ui.close)}">×</button>
      </div>
    </div>

    <div id="sheetModal" hidden>
      <div class="sheet-inner" id="sheetInner"></div>
    </div>

${kontaktModal(t, o.site.email)}
  </div>

  <script>window.PAGE_CAT = ${JSON.stringify(o.cat)};</script>
  ${sprachDaten(o.namen, o.lang, t.ui, o.kategorien)}
  <script src="${asset(r, "js/track.js", o.assetV)}"></script>
  <script src="${asset(r, "js/sprache.js", o.assetV)}"></script>
  <script src="${asset(r, "js/page.js", o.assetV)}"></script>
</body>
</html>
`;
}

/* Kontaktformular — auf jeder Seite gleich, Texte aus der Sprachdatei */
export function kontaktModal(t, email) {
  return `    <div id="contactModal" hidden>
      <div class="contact-card">
        <button type="button" class="contact-close" id="contactClose" aria-label="${esc(t.ui.close)}"><span aria-hidden="true">×</span><span id="contactCloseLabel">${esc(t.ui.close)}</span></button>
        <h2 id="contactTitle">${esc(t.ui.formTitle)}</h2>
        <p class="form-note" id="contactNote">${esc(t.ui.formNote)}</p>
        ${mailLink(email, "contact-mail")}
        <p class="thanks" id="thanks" hidden>${esc(t.ui.thanks)}</p>
        <form id="contactForm">
          <input type="text" id="fName" name="name" placeholder="${esc(t.ui.name)}" required>
          <input type="email" id="fMail" name="email" placeholder="${esc(t.ui.mail)}" required>
          <textarea id="fMsg" name="message" rows="4" placeholder="${esc(t.ui.msg)}" required></textarea>
          <button type="submit" id="fSend">${esc(t.ui.send)}</button>
        </form>
      </div>
    </div>`;
}

/* ---------- Startseite ----------
   War bis zur Sprachumstellung handgepflegt (website/index.html) und wurde
   deshalb als einzige Seite nicht erzeugt. Für fünf Sprachfassungen geht das
   nicht mehr — die Vorlage steht jetzt hier. */

export function startSeite(o) {
  const r = rel(o.lang);
  const t = o.texte;
  const canonical = url(o.origin, o.lang, "index.html");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${o.origin}/#website`,
        url: `${o.origin}/`,
        name: `${o.site.name} — ${o.site.role}`,
        inLanguage: t.locale,
        publisher: { "@id": `${o.origin}/#person` }
      },
      {
        "@type": "Person",
        "@id": `${o.origin}/#person`,
        name: o.site.name,
        jobTitle: o.site.jobTitle,
        url: `${o.origin}/`,
        // Keine E-Mail hier: strukturierte Daten sind für Adress-Sammler das
        // bequemste Ziel, und Google braucht die Adresse nicht (siehe mailLink).
        telephone: o.site.phone.replace(/\s/g, "-"),
        image: `${o.origin}/assets/og-image.png`,
        address: {
          "@type": "PostalAddress",
          streetAddress: o.site.street,
          postalCode: o.site.zip,
          addressLocality: o.site.city,
          addressCountry: o.site.country
        },
        knowsAbout: o.site.knowsAbout
      },
      {
        "@type": "ProfessionalService",
        "@id": `${o.origin}/#business`,
        name: `${o.site.name} — ${o.site.role}`,
        url: `${o.origin}/`,
        image: `${o.origin}/assets/og-image.png`,
        founder: { "@id": `${o.origin}/#person` },
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          streetAddress: o.site.street,
          postalCode: o.site.zip,
          addressLocality: o.site.city,
          addressCountry: o.site.country
        },
        areaServed: { "@type": "Country", name: "Deutschland" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: t.ui.services ? t.ui.servicesLabel || "Leistungen" : "Leistungen",
          itemListElement: (t.ui.services || []).map((n) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: n }
          }))
        }
      }
    ]
  };

  const noscriptNav = o.seiten
    .map((p) => `        <a href="${p.slug}.html">${esc(t.seiten[p.slug].h1)}</a>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${o.lang}">
<head>
${kopf({
  ...o,
  datei: "index.html",
  title: t.ui.startTitle,
  description: t.ui.startDescription,
  // Für die Vorschaukarte in sozialen Netzen bewusst kürzer als die
  // Suchmaschinen-Beschreibung — dort wird nach zwei Zeilen abgeschnitten.
  ogDescription: t.ui.startOgDescription,
  ogTitle: t.ui.startOgTitle,
  ogImage: `${o.origin}/assets/og-image.png`,
  ogImageMeta: { w: 1200, h: 1200, alt: t.ui.logoAlt },
  canonical,
  siteName: `${o.site.name} — ${o.site.role}`,
  locale: t.locale
})}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <div id="stage">
    <div class="glow"></div>

    <div id="drift" aria-hidden="true"></div>

    <div class="vignette"></div>

    <a class="om-logo" href="index.html" aria-label="${esc(o.site.name)} — ${esc(t.ui.home)}">${o.logoSvg}</a>

    <!-- Der Schriftzug im Logo ist der Name; für Vorleseprogramme und
         Suchmaschinen steht er hier zusätzlich als Text in der Überschrift. -->
    <h1 class="om-tag"><span class="vh">${esc(o.site.name)} — </span><span id="tagline">${esc(t.ui.tagline)}</span></h1>

    <div id="lightbox" hidden>
      <div class="lb-inner">
        <img id="lbImg" alt="">
        <p class="lb-title" id="lbTitle"></p>
        <button type="button" class="lb-close" aria-label="${esc(t.ui.close)}">×</button>
      </div>
    </div>

    <div class="topbar">
      <button type="button" class="contact-btn" id="contactBtn">${esc(t.ui.contact)}</button>
    </div>

    <div id="sheetModal" hidden>
      <div class="sheet-inner" id="sheetInner"></div>
    </div>

${kontaktModal(t, o.site.email)}

    <div class="om-fade-top"></div>
    <div class="om-fade"></div>

    <div class="bottom">
      <div class="hint-wrap"><span id="hint"></span></div>
      <p class="note" id="note"></p>

      <!-- Die Startseite zeigt ausschließlich die animierte Featured-Auswahl.
           Jede Kategorie führt auf die eigene, statische Rasteransicht. -->
      <nav class="cats-nav" id="catsNav" aria-label="${esc(t.ui.categoryWord)}">
${fussLeiste({ ...o, texte: t, slug: null })}
      </nav>

      <div id="mobileNav" hidden></div>
    </div>
  </div>

  <noscript>
    <div class="noscript-fallback">
      <h2>${esc(o.site.name)} — ${esc(t.ui.tagline)}, ${esc(o.site.city)}</h2>
      <p>${esc(t.ui.noscript)}</p>
      <nav>
${noscriptNav}
      </nav>
      <p>${esc(t.ui.contact)}: ${mailLink(o.site.email)} · <a href="${rechtsZiel(
    o.lang
  )}">${esc(t.ui.legal)}</a></p>
    </div>
  </noscript>

  ${sprachDaten(o.namen, o.lang, t.ui, o.kategorien)}
  <script src="${asset(r, "js/track.js", o.assetV)}"></script>
  <script src="${r}js/data.js"></script>
  <script src="${asset(r, "js/sprache.js", o.assetV)}"></script>
  <script src="${asset(r, "js/app.js", o.assetV)}"></script>
</body>
</html>
`;
}

/* ---------- Rechtsseiten ----------
   Nur Deutsch und Englisch (Entscheidung 2026-09-06). Der hreflang-Verbund
   umfasst deshalb ausschließlich de und en: ein hreflang="fr" auf eine
   englische Seite wäre eine falsche Auszeichnung und würde von Google
   verworfen. */

export const RECHTS_SPRACHEN = ["de", "en"];

export function rechtsSeite(o) {
  const r = rel(o.lang);
  const t = o.texte;
  const canonical = url(o.origin, o.lang, "impressum.html");
  const h1 = t.ui.legal;
  const description = t.ui.legalDescription;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: h1,
    description,
    inLanguage: t.locale,
    isPartOf: { "@id": `${o.origin}/#website` },
    publisher: { "@id": `${o.origin}/#person` }
  };

  return `<!DOCTYPE html>
<html lang="${o.lang}" class="seite-scroll">
<head>
${kopf({
  ...o,
  datei: "impressum.html",
  title: `${h1} | ${o.site.name}`,
  description,
  ogTitle: `${h1} — ${o.site.name}`,
  ogImage: `${o.origin}/assets/og-image.png`,
  canonical,
  siteName: `${o.site.name} — ${o.site.role}`,
  locale: t.locale,
  hreflangNur: RECHTS_SPRACHEN
})}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body class="bg-quiet">
  <div id="stage">
    <div class="glow"></div>

    <div class="om-chrome">
      <div class="vignette"></div>
      <a class="om-logo" href="index.html" aria-label="${esc(o.site.name)} — ${esc(t.ui.home)}">${o.logoSvg}</a>
      <p class="om-tag"><span class="vh">${esc(o.site.name)} — </span><span id="tagline">${esc(t.ui.tagline)}</span></p>
      <a class="back-btn" href="index.html" aria-label="${esc(t.ui.home)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <div class="om-fade-top"></div>
      <div class="om-fade"></div>
      <div class="bottom">
        <nav class="cats-nav" id="catsNav" aria-label="${esc(t.ui.categoryWord)}">
${o.seiten
  .map((p) => `        <a class="cat-pill" href="${o.lang === "de" ? "" : "../"}${p.slug}.html">${esc(
    o.texteDe.seiten[p.slug].h1
  )}</a>`)
  .join("\n")}
        <button type="button" class="cat-pill more" id="moreCatsBtn">${esc(t.ui.allCats)}</button>
        <button type="button" class="cat-pill contact-pill js-contact">${esc(t.ui.contact)}</button>
        <span class="legal-row">
          <button type="button" class="legal-link js-lang">${esc(t.ui.language)}</button>
        </span>
        </nav>
      </div>
    </div>

    <div class="om-scroll">
      <div class="om-pad">
        <header class="om-head">
          <div><h1 id="pgH1">${esc(h1)}</h1></div>
        </header>
        <div class="legal-body">
${o.rechtsHtml}
        </div>
      </div>
    </div>

    <div class="topbar">
      <button type="button" class="contact-btn" id="contactBtn">${esc(t.ui.contact)}</button>
    </div>

    <div id="sheetModal" hidden>
      <div class="sheet-inner" id="sheetInner"></div>
    </div>

${kontaktModal(t, o.site.email)}
  </div>

  ${sprachDaten(o.namen, o.lang, t.ui, o.kategorien)}
  <script src="${asset(r, "js/track.js", o.assetV)}"></script>
  <script src="${asset(r, "js/sprache.js", o.assetV)}"></script>
  <script src="${asset(r, "js/page.js", o.assetV)}"></script>
</body>
</html>
`;
}

/* Weiterleitung von der alten, jetzt zusammengelegten Adresse */
export function weiterleitungsSeite(o) {
  const r = rel(o.lang);
  const t = o.texte;
  return `<!DOCTYPE html>
<html lang="${o.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=impressum.html#datenschutz">
  <link rel="canonical" href="${url(o.origin, o.lang, "impressum.html")}">
  <meta name="robots" content="noindex, follow">
  <meta name="theme-color" content="#01172c">
  <title>${esc(t.ui.privacyTitle)} | ${esc(o.site.name)}</title>
  <link rel="icon" type="image/svg+xml" href="${r}assets/favicon.svg">
  <!-- Der erste Frame muss dunkel sein: die Weiterleitung greift zwar sofort,
       aber ohne diese Farbe blitzt bei langsamer Verbindung eine weiße Seite
       auf, bevor überhaupt ein Stylesheet geladen ist. -->
  <style>html, body { margin: 0; background: #01172c; }</style>
  <link rel="stylesheet" href="${asset(r, "css/fonts.css", o.assetV)}">
  <link rel="stylesheet" href="${asset(r, "css/base.css", o.assetV)}">
  <link rel="stylesheet" href="${asset(r, "css/page.css", o.assetV)}">
</head>
<body class="bg-quiet">
  <main class="pg-404">
    <h1>${esc(t.ui.redirecting)}</h1>
    <p>${esc(t.ui.redirectNote)} <a href="impressum.html#datenschutz">impressum.html</a>.</p>
  </main>
</body>
</html>
`;
}

/* 404 — GitHub Pages liefert für alle Pfade dieselbe Datei im Wurzelverzeichnis;
   eine sprachabhängige Fehlerseite ist dort technisch nicht möglich. Sie bleibt
   deshalb deutsch, nennt die Kategorien aber zusätzlich auf Englisch. */
export function nichtGefundenSeite(o) {
  const t = o.texte;
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.ui.notFoundTitle)} — ${esc(o.site.name)}</title>
  <meta name="robots" content="noindex, follow">
  <meta name="theme-color" content="#01172c">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="${asset("/", "css/fonts.css", o.assetV)}">
  <link rel="stylesheet" href="${asset("/", "css/base.css", o.assetV)}">
  <link rel="stylesheet" href="${asset("/", "css/page.css", o.assetV)}">
</head>
<body class="bg-quiet">
  <header class="pg-head">
    <a class="pg-logo" href="/" aria-label="${esc(o.site.name)} — ${esc(t.ui.home)}">${o.logoSvgAbs}</a>
  </header>
  <main id="inhalt" class="pg-404">
    <h1>${esc(t.ui.notFoundTitle)}</h1>
    <p>${esc(t.ui.notFoundText)}</p>
    <nav class="pg-foot-nav">
${o.seiten.map((p) => `      <a href="/${p.slug}.html">${esc(t.seiten[p.slug].h1)}</a>`).join("\n")}
    </nav>
    <p><a class="pg-back" href="/">${esc(t.ui.home)}</a></p>
  </main>
</body>
</html>
`;
}

/* ---------- Sitemaps ----------
   Jede URL nennt ihre Sprachalternativen zusätzlich per xhtml:link. Das ist
   doppelt gemoppelt zu den Angaben im <head>, wird von Google aber
   ausdrücklich unterstützt und macht den Verbund für Prüfwerkzeuge sichtbar. */

export function sitemapXml(o) {
  const eintrag = (datei, prio, freq, sprachen) => {
    const alt = sprachen
      .map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(o.origin, l, datei)}"/>`
      )
      .join("\n");
    return sprachen
      .map(
        (l) => `  <url>
    <loc>${url(o.origin, l, datei)}</loc>
${alt}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(o.origin, STANDARD, datei)}"/>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`
      )
      .join("\n");
  };

  const blocks = [
    eintrag("index.html", "1.0", "monthly", SPRACHEN),
    ...o.seiten.map((p) => eintrag(`${p.slug}.html`, "0.8", "monthly", SPRACHEN)),
    eintrag("impressum.html", "0.2", "yearly", RECHTS_SPRACHEN)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join("\n")}
</urlset>
`;
}

/* Bild-Sitemap: bei einem Bildportfolio der wichtigste Kanal. Jede
   Sprachfassung bekommt ihre eigenen Einträge mit lokalisiertem Titel und
   lokalisierter Bildunterschrift — genau der Text, über den ein französischer
   Suchender das Bild findet. */
export function bilderSitemapXml(o) {
  const blocks = [];
  for (const lang of SPRACHEN) {
    const t = o.texteAlle[lang];
    // Zwei Aufrufer: der lokale Build kennt nur eine Bildliste (Titel aus
    // js/data.js), das Dashboard liefert je Sprache eine eigene.
    const jeKategorie = o.bilderJeKategorieSprache
      ? o.bilderJeKategorieSprache[lang]
      : o.bilderJeKategorie;
    for (const p of o.seiten) {
      const bilder = jeKategorie[p.cat] || [];
      if (!bilder.length) continue;
      const seite = t.seiten[p.slug];
      const kind = seite.altKind || t.alt.kindDefault;
      const eintraege = bilder
        .map((b) => {
          // Wie im Alt-Attribut: der Beschreibungssatz, sonst das Muster.
          // <image:title> bleibt in jedem Fall der kurze Titel — das
          // Sitemap-Protokoll erwartet dort einen Namen, keinen Fließtext.
          const caption = b.description || t.alt.pattern
            .replace("{title}", b.title)
            .replace("{kind}", kind)
            .replace("{name}", o.site.name)
            .replace("{city}", t.ui.city || o.site.city);
          return `    <image:image>
      <image:loc>${pfad(`${o.origin}/`, b.full)}</image:loc>
      <image:title>${esc(b.title)}</image:title>
      <image:caption>${esc(caption)}</image:caption>
    </image:image>`;
        })
        .join("\n");
      blocks.push(`  <url>\n    <loc>${url(o.origin, lang, `${p.slug}.html`)}</loc>\n${eintraege}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${blocks.join("\n")}
</urlset>
`;
}
