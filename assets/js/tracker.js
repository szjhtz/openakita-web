/**
 * OpenAkita Analytics Tracker
 *
 * Lightweight, privacy-friendly, self-hosted analytics.
 * Collects: page views, scroll depth, session duration,
 * download clicks, outbound links, language switches.
 *
 * All data sent via navigator.sendBeacon (non-blocking).
 * No cookies, no fingerprinting, IP hashed server-side.
 */
(function () {
  "use strict";

  // ── Replace with your Alibaba Cloud FC HTTP trigger URL ──
  var ENDPOINT = "https://openakics-track-bdgjngrigv.cn-hangzhou.fcapp.run/track";
  if (!ENDPOINT) return;

  var sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  var isReturning = !!localStorage.getItem("oa_first_visit");
  if (!isReturning) localStorage.setItem("oa_first_visit", Date.now().toString());

  var utm = {};
  (location.search || "").replace(/[?&](utm_\w+)=([^&#]*)/g, function (_, k, v) {
    utm[k] = decodeURIComponent(v);
  });

  var entryPage = location.pathname;
  var startTime = Date.now();

  function buildPayload(eventType, extra) {
    var obj = {
      e: eventType,
      p: location.pathname,
      r: document.referrer || "",
      l: navigator.language || "",
      s: screen.width + "x" + screen.height,
      sid: sid,
      rv: isReturning,
      ep: entryPage,
    };
    if (Object.keys(utm).length) obj.utm = utm;
    if (extra) obj.d = extra;
    return obj;
  }

  function send(eventType, extra) {
    try {
      var payload = buildPayload(eventType, extra);
      navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
    } catch (_) { /* silent */ }
  }

  // ── Page View ──
  send("pv");

  // ── Scroll Depth (milestones: 25 / 50 / 75 / 100) ──
  var maxScroll = 0;
  var scrollSent = {};
  function onScroll() {
    var top = document.documentElement.scrollTop || document.body.scrollTop;
    var total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (total <= 0) return;
    var pct = Math.round((top / total) * 100);
    if (pct > maxScroll) maxScroll = pct;
    [25, 50, 75, 100].forEach(function (m) {
      if (maxScroll >= m && !scrollSent[m]) {
        scrollSent[m] = true;
        send("scroll", { depth: m });
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ── Session Duration (fires on page hide / tab switch / close) ──
  var leaveSent = false;
  function onLeave() {
    if (leaveSent) return;
    leaveSent = true;
    send("leave", { dur: Math.round((Date.now() - startTime) / 1000) });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") onLeave();
    if (document.visibilityState === "visible") leaveSent = false;
  });
  window.addEventListener("pagehide", onLeave);

  // ── Outbound Link Clicks ──
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.startsWith("http") && href.indexOf(location.hostname) === -1) {
      send("out", { url: href.slice(0, 200) });
    }
  });

  // ── Language Switch ──
  document.addEventListener("openakita:language-changed", function () {
    send("lang", { to: localStorage.getItem("openakita_language") || "zh" });
  });

  // ── Public API for download.js ──
  window.__oa_track = function (eventType, data) {
    send(eventType, data);
  };
})();
