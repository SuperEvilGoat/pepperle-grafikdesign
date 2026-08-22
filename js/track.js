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
      ev.lang = (navigator.language || "").slice(0, 12);
      ev.mobile = window.matchMedia && window.matchMedia("(max-width: 760px)").matches ? 1 : 0;
      var body = JSON.stringify(ev);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      } else {
        fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
      }
    } catch (e) { /* Statistik darf die Seite nie stören */ }
  }

  window.pptrack = send;

  var ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  if (ref === location.hostname) ref = "";
  send({ type: "pageview", ref: ref });
})();
