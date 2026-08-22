/* pepperle.de — eigene, anonyme Reichweitenmessung (cookiefrei).
   Sendet Ereignisse an unseren Cloudflare Worker; es werden keine Cookies
   gesetzt und keine IP-Adressen gespeichert (täglich rotierender Hash serverseitig). */
(function () {
  "use strict";
  var ENDPOINT = "https://pepperle-analytics.a347157.workers.dev/collect";

  // Auf localhost nichts senden (Entwicklung)
  if (/^(localhost|127\.)/.test(location.hostname)) {
    window.pptrack = function () {};
    return;
  }

  function send(ev) {
    try {
      // Bewusst werden hier KEINE Geräteeigenschaften ausgelesen (weder
      // navigator.language noch die Bildschirmbreite). Sprache und Geräteklasse
      // leitet der Server aus den Kopfzeilen ab, die der Browser bei jeder
      // Anfrage ohnehin mitschickt. So findet kein Zugriff auf Informationen
      // im Endgerät statt und die Messung bleibt nach § 25 TDDDG
      // einwilligungsfrei (kein Cookie-Banner nötig).
      var body = JSON.stringify(ev);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, body);
      } else {
        fetch(ENDPOINT, { method: "POST", body: body, keepalive: true, credentials: "omit" });
      }
    } catch (e) { /* Statistik darf die Seite nie stören */ }
  }

  window.pptrack = send;

  /* ---------- Herkunft des Aufrufs ---------- */

  // Verweisende Website (nur der Hostname, nie die vollständige Adresse)
  var ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  if (ref === location.hostname) ref = "";

  // Welche Seite wurde aufgerufen? Seit dem Umbau auf eigene Kategorieseiten
  // ist das nicht mehr immer die Startseite.
  var path = "/";
  try {
    path = location.pathname.replace(/\/index\.html$/, "/");
    // Auf der Testadresse liegt die Seite in einem Unterordner — der gehört
    // nicht zum Seitenpfad und würde die Auswertung nur verrauschen.
    path = path.replace(/^\/pepperle-grafikdesign/, "") || "/";
    if (path.length > 120) path = path.slice(0, 120);
  } catch (e) {}

  // Kampagnen-Kennzeichnung aus der Adresse (utm_source usw.) — nur relevant,
  // wenn ein Link sie ausdrücklich mitbringt, etwa ein QR-Code auf einer
  // Visitenkarte oder ein Eintrag in einem Branchenverzeichnis. Es werden
  // ausschließlich diese drei Werte gelesen, keine sonstigen Parameter.
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ["source", "medium", "campaign"].forEach(function (k) {
      var v = q.get("utm_" + k);
      if (v) utm[k] = String(v).slice(0, 60);
    });
  } catch (e) {}

  send({
    type: "pageview",
    ref: ref,
    path: path,
    utm_source: utm.source || null,
    utm_medium: utm.medium || null,
    utm_campaign: utm.campaign || null
  });
})();
