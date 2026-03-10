/**
 * download.js — Download page logic for OpenAkita
 *
 * Handles: data fetching, platform detection, channel rendering,
 * historical version browsing, and release notes display.
 */
(function () {
  "use strict";

  // ── Config ──
  var OSS_BASE = "https://dl-openakita.fzstack.com";
  var GH_REPO = "openakita/openakita";
  var CHANNELS = ["release", "pre-release", "dev"];
  var CHANNEL_IDS = { release: "release", "pre-release": "prerelease", dev: "dev" };

  // ── State ──
  var state = {
    platform: null,
    manifests: {},       // { release: {...}, "pre-release": {...}, dev: {...} }
    versionsIndex: null,  // versions.json content
    versionCache: {},     // { "v1.25.9": manifest }
    historyLoaded: false,
    activeNotesChannel: "release",
  };

  // ── Platform Detection ──
  function detectPlatform() {
    var ua = navigator.userAgent || "";
    if (/Android/i.test(ua)) return "android";
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Win/i.test(ua)) return "windows";
    if (/Mac/i.test(ua)) return "macos";
    if (/Linux/i.test(ua)) return "linux";
    return "windows";
  }

  // ── Data Fetching ──
  function fetchJSON(url, timeoutMs) {
    return fetch(url, { signal: AbortSignal.timeout(timeoutMs || 6000) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function fetchChannelManifest(channel) {
    return fetchJSON(OSS_BASE + "/api/" + channel + ".json");
  }

  function fetchVersionManifest(version) {
    var key = "v" + version.replace(/^v/, "");
    if (state.versionCache[key]) {
      return Promise.resolve(state.versionCache[key]);
    }
    return fetchJSON(OSS_BASE + "/api/releases/" + key + ".json").then(function (data) {
      if (data) state.versionCache[key] = data;
      return data;
    });
  }

  function fetchVersionsIndex() {
    if (state.versionsIndex) return Promise.resolve(state.versionsIndex);
    return fetchJSON(OSS_BASE + "/api/versions.json").then(function (data) {
      if (data) state.versionsIndex = data;
      return data;
    });
  }

  // ── Fallback: build manifest from GitHub API ──
  function fetchGHLatest() {
    return fetchJSON(
      "https://api.github.com/repos/" + GH_REPO + "/releases/latest", 8000
    );
  }

  function ghAssetToDownloads(release) {
    if (!release || !release.assets) return null;
    var tag = release.tag_name || "";
    var assets = release.assets;
    var downloads = {};
    var patterns = [
      { platform: "windows", key: "windows-x64", ext: /\.exe$/i, inc: /core/i, exc: /full|uninstall/i, nick: "Windows 10/11 x64" },
      { platform: "macos", key: "macos-arm64", ext: /\.dmg$/i, inc: /arm64|aarch64/i, exc: null, nick: "macOS Apple Silicon (.dmg)" },
      { platform: "macos", key: "macos-x64", ext: /\.dmg$/i, inc: /x64|x86_64|intel/i, exc: null, nick: "macOS Intel (.dmg)" },
      { platform: "linux", key: "linux-deb-ubuntu24-amd64", ext: /\.deb$/i, inc: /ubuntu24-amd64/i, exc: null, nick: "Ubuntu 24 x64 (.deb)" },
      { platform: "linux", key: "linux-deb-ubuntu24-arm64", ext: /\.deb$/i, inc: /ubuntu24-arm64/i, exc: null, nick: "Ubuntu 24 ARM64 (.deb)" },
      { platform: "linux", key: "linux-deb-ubuntu22-amd64", ext: /\.deb$/i, inc: /ubuntu22-amd64/i, exc: null, nick: "Ubuntu 22 x64 (.deb)" },
      { platform: "linux", key: "linux-deb-ubuntu22-arm64", ext: /\.deb$/i, inc: /ubuntu22-arm64/i, exc: null, nick: "Ubuntu 22 ARM64 (.deb)" },
      { platform: "linux", key: "linux-appimage-x64", ext: /\.appimage$/i, inc: null, exc: /arm64|aarch64/i, nick: "Linux AppImage x64" },
      { platform: "android", key: "android-apk", ext: /\.apk$/i, inc: /android/i, exc: null, nick: "Android APK" },
      { platform: "ios", key: "ios-ipa", ext: /\.ipa$/i, inc: /ios/i, exc: null, nick: "iOS IPA" },
    ];
    patterns.forEach(function (p) {
      var found = assets.find(function (a) {
        var n = a.name || "";
        if (!p.ext.test(n)) return false;
        if (p.inc && !p.inc.test(n)) return false;
        if (p.exc && p.exc.test(n)) return false;
        return true;
      });
      if (found) {
        if (!downloads[p.platform]) downloads[p.platform] = [];
        downloads[p.platform].push({
          key: p.key, nickname: p.nick, name: found.name,
          url: found.browser_download_url, size: found.size || 0,
        });
      }
    });
    return {
      version: tag.replace(/^v/, ""),
      channel: "release",
      pub_date: release.published_at || "",
      notes: release.body || "",
      downloads: downloads,
      platforms: {},
    };
  }

  // ── Utility ──
  function formatSize(bytes) {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
    } catch (e) { return iso.slice(0, 10); }
  }

  function pickPlatformDownload(downloads, platform) {
    if (!downloads) return null;
    var items = downloads[platform];
    if (!items || items.length === 0) return null;
    return items[0];
  }

  function shortArchLabel(nickname) {
    if (/arm64|aarch64|apple.silicon/i.test(nickname)) return "Apple（M系列）芯片版";
    if (/x64|x86_64|intel/i.test(nickname)) return "Intel 芯片版";
    return nickname;
  }

  function renderMarkdown(md) {
    if (typeof marked !== "undefined" && marked.parse) {
      return marked.parse(md || "");
    }
    return "<pre>" + escapeHtml(md || "") + "</pre>";
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Tab Switching ──
  function initTabs() {
    var tabs = document.querySelectorAll(".install-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          t.classList.toggle("active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.style.display = p.id === "panel-" + target ? "" : "none";
          p.classList.toggle("active", p.id === "panel-" + target);
        });
      });
    });
  }

  // ── Platform Switching ──
  function initPlatformSelector() {
    var btns = document.querySelectorAll(".platform-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectPlatform(btn.getAttribute("data-platform"));
      });
    });
  }

  function selectPlatform(platform) {
    state.platform = platform;
    document.querySelectorAll(".platform-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-platform") === platform);
    });
    renderAllChannels();
  }

  // ── Channel Card Rendering ──
  function renderChannelCard(channel, manifest) {
    var idPrefix = CHANNEL_IDS[channel];
    var versionEl = document.getElementById(idPrefix + "Version");
    var dateEl = document.getElementById(idPrefix + "Date");
    var actionsEl = document.getElementById(idPrefix + "Actions");
    var allArchEl = document.getElementById(idPrefix + "AllArch");
    var card = actionsEl ? actionsEl.closest(".channel-card") : null;

    if (!manifest || !manifest.version) {
      if (versionEl) versionEl.textContent = "--";
      if (dateEl) dateEl.textContent = "";
      if (actionsEl) actionsEl.innerHTML = '<span class="channel-unavailable">暂无此渠道版本</span>';
      if (allArchEl) allArchEl.style.display = "none";
      if (card) card.classList.add("channel-card-empty");
      return;
    }

    if (card) card.classList.remove("channel-card-empty");
    if (versionEl) versionEl.textContent = "v" + manifest.version;
    if (dateEl) dateEl.textContent = formatDate(manifest.pub_date);

    var platform = state.platform;
    var platformItems = manifest.downloads ? manifest.downloads[platform] : null;
    var dl = platformItems && platformItems.length > 0 ? platformItems[0] : null;

    if (actionsEl) {
      if (platform === "ios" && (!dl || !dl.url)) {
        actionsEl.innerHTML = '<span class="channel-ios-hint">即将推出 — 敬请期待</span>';
      } else if (platform === "macos" && platformItems && platformItems.length > 1) {
        var html = '<div class="macos-arch-buttons">';
        platformItems.forEach(function (item) {
          var sizeStr = formatSize(item.size);
          var label = shortArchLabel(item.nickname);
          html +=
            '<a class="btn btn-primary channel-dl-btn" href="' + escapeHtml(item.url) + '">' +
            '下载 ' + escapeHtml(label) +
            (sizeStr ? ' <span class="dl-size">' + sizeStr + '</span>' : '') +
            '</a>';
        });
        html += '</div>';
        actionsEl.innerHTML = html;
      } else if (dl) {
        var sizeStr = formatSize(dl.size);
        actionsEl.innerHTML =
          '<a class="btn btn-primary channel-dl-btn" href="' + escapeHtml(dl.url) + '">' +
          '下载 ' + escapeHtml(dl.nickname) +
          (sizeStr ? ' <span class="dl-size">' + sizeStr + '</span>' : '') +
          '</a>';
      } else {
        actionsEl.innerHTML =
          '<a class="btn btn-secondary channel-dl-btn" href="#versionHistory" onclick="document.getElementById(\'versionHistory\').open=true;document.getElementById(\'versionHistory\').scrollIntoView({behavior:\'smooth\'});return false;">' +
          '暂无 ' + escapeHtml(platformLabel(platform)) + ' 安装包 · 查看历史版本</a>';
      }
    }

    // "All architectures" link (hidden for macOS since both are already shown)
    if (allArchEl) {
      if (platformItems && platformItems.length > 1 && platform !== "macos") {
        allArchEl.style.display = "";
        allArchEl.onclick = function (e) {
          e.preventDefault();
          showArchDetail(channel, manifest, platform);
        };
      } else {
        allArchEl.style.display = "none";
      }
    }

    if (card) {
      card.classList.toggle("channel-card-active", channel === state.activeNotesChannel);
    }
  }

  function renderAllChannels() {
    CHANNELS.forEach(function (ch) {
      renderChannelCard(ch, state.manifests[ch]);
    });
    renderReleaseNotes();
  }

  // ── Channel card hover → switch release notes ──
  function initChannelHover() {
    document.querySelectorAll(".channel-card").forEach(function (card) {
      card.addEventListener("mouseenter", function () {
        var ch = card.getAttribute("data-channel");
        var m = state.manifests[ch];
        if (m && m.notes) {
          switchNotesChannel(ch);
        }
      });
    });
  }

  // ── Arch Detail Overlay ──
  function showArchDetail(channel, manifest, platform) {
    var overlay = document.getElementById("archDetailOverlay");
    var body = document.getElementById("archDetailBody");
    var title = document.getElementById("archDetailTitle");
    if (!overlay || !body) return;

    var items = (manifest.downloads || {})[platform] || [];
    var channelLabel = { release: "稳定版", "pre-release": "抢先版", dev: "开发版" }[channel] || channel;
    title.textContent = channelLabel + " v" + manifest.version + " — " + platformLabel(platform);

    var html = '<div class="arch-list">';
    items.forEach(function (item) {
      var sizeStr = formatSize(item.size);
      html += '<a class="arch-item" href="' + escapeHtml(item.url) + '">' +
        '<span class="arch-name">' + escapeHtml(item.nickname) + '</span>' +
        '<span class="arch-file">' + escapeHtml(item.name) + '</span>' +
        (sizeStr ? '<span class="arch-size">' + sizeStr + '</span>' : '') +
        '</a>';
    });
    html += '</div>';
    body.innerHTML = html;
    overlay.style.display = "";
  }

  function platformLabel(p) {
    return { windows: "Windows", macos: "macOS", linux: "Linux", android: "Android", ios: "iOS" }[p] || p;
  }

  function initArchOverlay() {
    var overlay = document.getElementById("archDetailOverlay");
    var closeBtn = document.getElementById("archDetailClose");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.style.display = "none";
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        document.getElementById("archDetailOverlay").style.display = "none";
      });
    }
  }

  // ── Release Notes ──
  function switchNotesChannel(channel) {
    state.activeNotesChannel = channel;
    renderReleaseNotes();
    document.querySelectorAll(".channel-card").forEach(function (card) {
      var ch = card.getAttribute("data-channel");
      card.classList.toggle("channel-card-active", ch === channel);
    });
  }

  function renderReleaseNotes() {
    var section = document.getElementById("releaseNotesSection");
    var titleEl = document.getElementById("releaseNotesTitle");
    var contentEl = document.getElementById("releaseNotesContent");
    if (!section || !contentEl) return;

    var channelLabel = { release: "稳定版", "pre-release": "抢先版", dev: "开发版" };
    var manifest = state.manifests[state.activeNotesChannel];
    // Fallback: if active channel has no notes, try others
    if (!manifest || !manifest.notes) {
      var fallback = CHANNELS.find(function (ch) {
        var m = state.manifests[ch];
        return m && m.notes;
      });
      manifest = fallback ? state.manifests[fallback] : null;
      if (fallback) state.activeNotesChannel = fallback;
    }

    if (!manifest || !manifest.notes) {
      section.style.display = "none";
      return;
    }

    var label = channelLabel[state.activeNotesChannel] || state.activeNotesChannel;
    section.style.display = "";
    if (titleEl) titleEl.textContent = label + " v" + manifest.version + " 更新日志";
    contentEl.innerHTML = renderMarkdown(manifest.notes);
  }

  // ── History ──
  function initHistory() {
    var details = document.getElementById("versionHistory");
    if (!details) return;
    details.addEventListener("toggle", function () {
      if (details.open && !state.historyLoaded) {
        loadHistory();
      }
    });
  }

  function loadHistory() {
    var container = document.getElementById("versionHistoryContent");
    if (!container) return;
    container.innerHTML = '<p class="channel-loading">加载中...</p>';

    fetchVersionsIndex().then(function (index) {
      state.historyLoaded = true;
      if (!index) {
        container.innerHTML = '<p>暂无历史版本数据，请稍后再试。</p>';
        return;
      }
      renderHistory(index, container);
    });
  }

  function renderHistory(index, container) {
    var channelKeys = ["release", "pre_release", "dev"];
    var channelLabels = { release: "稳定版", pre_release: "抢先版", dev: "开发版" };

    // Merge all entries from all channels, keeping the latest patch per minor version
    var minorGroups = {};
    channelKeys.forEach(function (key) {
      var entries = index[key];
      if (!entries) return;
      entries.forEach(function (entry) {
        var parts = entry.version.split(".");
        if (parts.length < 2) return;
        var minor = parts[0] + "." + parts[1];
        var patch = parseInt(parts[2], 10) || 0;

        if (!minorGroups[minor] || patch > minorGroups[minor].patch) {
          minorGroups[minor] = {
            version: entry.version,
            pub_date: entry.pub_date,
            platforms: entry.platforms,
            channel: key,
            channelLabel: channelLabels[key] || key,
            patch: patch,
          };
        }
      });
    });

    // Sort by minor version descending
    var sortedMinors = Object.keys(minorGroups).sort(function (a, b) {
      var ap = a.split(".").map(Number);
      var bp = b.split(".").map(Number);
      return (bp[0] - ap[0]) || (bp[1] - ap[1]);
    });

    var html = "";
    if (sortedMinors.length > 0) {
      html += '<div class="history-list">';
      sortedMinors.forEach(function (minor) {
        var entry = minorGroups[minor];
        var platforms = (entry.platforms || []).map(function (p) { return platformLabel(p); }).join(", ");
        html += '<div class="history-item" data-version="' + escapeHtml(entry.version) + '">';
        html += '<span class="history-version">v' + escapeHtml(entry.version) + '</span>';
        var tagClass = { release: "badge-release", pre_release: "badge-prerelease", dev: "badge-dev" }[entry.channel] || "";
        html += '<span class="history-channel-tag ' + tagClass + '">' + escapeHtml(entry.channelLabel) + '</span>';
        html += '<span class="history-date">' + formatDate(entry.pub_date) + '</span>';
        html += '<span class="history-platforms">' + escapeHtml(platforms) + '</span>';
        html += '<button class="history-dl-btn" data-version="' + escapeHtml(entry.version) + '">下载</button>';
        html += '<button class="history-notes-btn" data-version="' + escapeHtml(entry.version) + '">更新日志</button>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html = '<p>暂无历史版本数据。</p>';
    }

    container.innerHTML = html;

    // Bind click events
    container.querySelectorAll(".history-dl-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showHistoryDownload(btn.getAttribute("data-version"));
      });
    });
    container.querySelectorAll(".history-notes-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showHistoryNotes(btn.getAttribute("data-version"));
      });
    });
  }

  function showHistoryDownload(version) {
    fetchVersionManifest(version).then(function (manifest) {
      if (!manifest) {
        alert("v" + version + " 暂无下载数据");
        return;
      }
      var platform = state.platform;
      var items = (manifest.downloads || {})[platform] || [];
      if (items.length === 0) {
        alert("v" + version + " 暂无 " + platformLabel(platform) + " 安装包");
        return;
      }
      showArchDetail(manifest.channel || "release", manifest, platform);
    });
  }

  function showHistoryNotes(version) {
    fetchVersionManifest(version).then(function (manifest) {
      if (!manifest || !manifest.notes) {
        alert("v" + version + " 暂无更新日志");
        return;
      }
      var overlay = document.getElementById("notesModalOverlay");
      var titleEl = document.getElementById("notesModalTitle");
      var bodyEl = document.getElementById("notesModalBody");
      if (!overlay || !bodyEl) return;
      if (titleEl) titleEl.textContent = "v" + version + " 更新日志";
      bodyEl.innerHTML = renderMarkdown(manifest.notes);
      overlay.style.display = "";
    });
  }

  function initNotesModal() {
    var overlay = document.getElementById("notesModalOverlay");
    var closeBtn = document.getElementById("notesModalClose");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.style.display = "none";
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        document.getElementById("notesModalOverlay").style.display = "none";
      });
    }
  }

  // ── Initialization ──
  function init() {
    initTabs();
    initPlatformSelector();
    initArchOverlay();
    initNotesModal();
    initChannelHover();
    initHistory();

    state.platform = detectPlatform();
    selectPlatform(state.platform);

    // Load all three channel manifests in parallel
    Promise.allSettled([
      fetchChannelManifest("release"),
      fetchChannelManifest("pre-release"),
      fetchChannelManifest("dev"),
    ]).then(function (results) {
      var release = results[0].status === "fulfilled" ? results[0].value : null;
      var preRelease = results[1].status === "fulfilled" ? results[1].value : null;
      var dev = results[2].status === "fulfilled" ? results[2].value : null;

      // Fallback to GitHub API if no release manifest found
      if (!release || !release.version) {
        return fetchGHLatest().then(function (ghRelease) {
          var ghManifest = ghAssetToDownloads(ghRelease);
          if (ghManifest) release = ghManifest;
          return { release: release, "pre-release": preRelease, dev: dev };
        });
      }
      return { release: release, "pre-release": preRelease, dev: dev };
    }).then(function (manifests) {
      // Deduplicate: if two channels have the same version, hide the lower-priority one
      var versions = {};
      CHANNELS.forEach(function (ch) {
        var m = manifests[ch];
        if (m && m.version) {
          if (versions[m.version]) {
            manifests[ch] = null;
          } else {
            versions[m.version] = true;
          }
        }
      });

      state.manifests = manifests;
      // Set initial active notes channel to first channel with notes
      var initialNotes = CHANNELS.find(function (ch) {
        var m = manifests[ch];
        return m && m.notes;
      });
      if (initialNotes) state.activeNotesChannel = initialNotes;
      renderAllChannels();

      // Cache manifests in version cache for history
      CHANNELS.forEach(function (ch) {
        var m = manifests[ch];
        if (m && m.version) {
          state.versionCache["v" + m.version] = m;
        }
      });

      // Update legacy home page version badge if present
      var verBadge = document.getElementById("latestReleaseVersion");
      var dateBadge = document.getElementById("latestReleaseDate");
      var displayM = manifests.release || manifests["pre-release"] || manifests.dev;
      if (verBadge && displayM) verBadge.textContent = "v" + displayM.version;
      if (dateBadge && displayM) dateBadge.textContent = formatDate(displayM.pub_date);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
