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

  var ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  if (ref === location.hostname) ref = "";
  send({ type: "pageview", ref: ref });
})();
