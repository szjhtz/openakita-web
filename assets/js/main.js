(function () {
  const SUPPORTED_LANGS = ["zh", "en", "ja", "ko", "ru", "fr", "de"];
  const LANG_TO_LOCALE = {
    zh: "zh-CN",
    en: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
    ru: "ru-RU",
    fr: "fr-FR",
    de: "de-DE",
  };
  const AUTO_TRANSLATE_SUPPORTED = new Set(["en", "ja", "ko", "ru", "fr", "de"]);
  const AUTO_TRANSLATE_CACHE_KEY = "openakita_auto_i18n_cache_v1";
  const AUTO_TRANSLATE_SEPARATOR = "[[[OPENAKITA_SEP]]]";
  const PREBUILT_TRANSLATION_CACHE_URL = "/assets/i18n/prebuilt_cache.json?v=20260225-i18n-all-lang";
  const AUTO_TRANSLATE_SKIP_IDS = new Set([
    "latestReleaseVersion",
    "latestReleaseDate",
    "windowsAssetName",
    "macAssetName",
    "linuxAssetName",
    "heroTypedTitle",
    "heroSloganText",
  ]);

  const MESSAGES = {
    zh: {
      common: {
        navToggle: "打开导航",
        language: "语言",
        nav: {
          home: "首页",
          download: "下载",
          tutorials: "教程",
          about: "关于我们",
          github: "GitHub",
        },
        release: {
          loading: "加载中...",
          noAssets: "当前版本未附带构建产物，请前往 Releases 页面查看历史版本。",
          viewReleases: "请查看 GitHub Releases",
          openReleases: "打开 Releases 查看下载文件",
          loadingAssets: "正在读取可下载文件...",
          platformMissing: "当前版本未找到对应安装包，已跳转 Releases。",
        },
        copy: {
          copy: "复制",
          copied: "已复制",
          failed: "复制失败",
        },
      },
      home: {
        meta: {
          title: "OpenAkita - 自进化 AI Agent 官网",
          description:
            "OpenAkita 官方网站：一个会自学习、会自检修复、永不放弃的 AI Agent。提供下载、配置教程与文档入口。",
        },
        hero: {
          title: "让私人AI随时陪伴",
          slogan: "一直在身边，一直在变强。",
          desc: "填一个 API Key，剩下的交给 OpenAkita。",
          btnDownload: "立即下载",
          btnSetup: "3 分钟开始",
          btnTutorials: "全部教程",
        },
        release: {
          link: "查看 Release 详情",
        },
        releaseTitle: "发布信息",
      },
      download: {
        meta: {
          title: "下载 OpenAkita - Desktop / CLI / Source",
          description: "OpenAkita 下载页面：Desktop 安装包、PyPI CLI 安装、源码部署和一键脚本。",
        },
        hero: {
          title: "下载与安装 OpenAkita",
          desc: "官方支持 Desktop、CLI、源码部署三种方式。你可以从简单到深入逐步切换。",
        },
        buttons: {
          latest: "查看全部安装包",
          notes: "Release 说明",
        },
        cards: {
          desktop: {
            title: "Desktop 安装包（Win / macOS / Linux）",
            desc: "只保留三端最新安装包入口，按你的系统直接下载即可。",
          },
          cli: {
            title: "PyPI CLI 安装",
            desc: "适合命令行用户与自动化部署，步骤最短。",
            btn: "查看安装教程",
          },
          source: {
            title: "源码安装",
            desc: "适合需要二次开发、定制构建和自托管流程的团队。",
          },
        },
      },
      tutorials: {
        meta: {
          title: "OpenAkita 教程中心 - 图文与视频",
          description:
            "OpenAkita 官方教程中心：安装配置、IM 通道接入、QQ 官方机器人、OneBot、LLM 端点与 API Key 配置，包含图文和视频入口。",
        },
        hero: {
          title: "教程中心：图文 + 视频",
          desc: "覆盖安装、IM 通道和 LLM 端点配置。",
        },
      },
      setup: {
        meta: {
          title: "OpenAkita 安装教程 - Desktop 与 CLI",
          description:
            "OpenAkita 安装配置教程：Desktop 图形化安装、PyPI 命令行安装、源码安装与首次启动验证。",
        },
        hero: {
          title: "AI 助手安装与初始配置",
          desc: "从安装到首次验证的完整路径。",
        },
        side: ["教程概览", "环境要求", "安装OpenAkita", "启动验证"],
      },
      im: {
        meta: {
          title: "OpenAkita IM 通道配置教程",
          description:
            "OpenAkita IM 通道配置教程：Telegram、飞书、钉钉、企业微信、QQ 官方机器人、OneBot 的平台申请与配置流程。",
        },
        hero: {
          title: "IM 通道配置与平台端申请",
          desc: "覆盖平台申请步骤与 OpenAkita `.env` 配置，含 QQ 官方机器人与 OneBot。",
        },
        side: ["平台概览", "Telegram", "飞书", "钉钉", "企业微信", "QQ 官方机器人", "OneBot（通用协议）", "语音转写", "视频教程"],
      },
      llm: {
        meta: {
          title: "OpenAkita LLM 端点与 API Key 配置教程",
          description:
            "OpenAkita LLM 教程：API Key 申请、.env 配置、llm_endpoints.json 多端点与能力路由设置。",
        },
        hero: {
          title: "LLM 端点与 API Key 配置",
          desc: "构建可容灾、可扩展的模型访问层。",
        },
        side: ["配置概览", "API Key 申请", ".env 配置", "llm_endpoints.json", "能力路由策略", "连通性验证", "视频教程"],
      },
      about: {
        meta: {
          title: "关于 OpenAkita - 自进化 AI Agent 项目",
          description: "OpenAkita 项目介绍：愿景、架构方向、开源协作方式与社区入口。",
        },
        hero: {
          title: "关于我们",
          desc: "OpenAkita 是一个自进化 AI Agent 项目，目标是让 Agent 在真实生产场景可部署、可协作、可持续进化。",
        },
      },
    },
    en: {
      common: {
        navToggle: "Open navigation",
        language: "Language",
        nav: {
          home: "Home",
          download: "Download",
          tutorials: "Tutorials",
          about: "About",
          github: "GitHub",
        },
        release: {
          loading: "Loading...",
          noAssets: "No packaged artifacts found for this release. Check historical releases.",
          viewReleases: "View GitHub Releases",
          openReleases: "Open Releases downloads",
          loadingAssets: "Loading downloadable assets...",
          platformMissing: "Matching package not found in this release. Open Releases.",
        },
        copy: {
          copy: "Copy",
          copied: "Copied",
          failed: "Copy failed",
        },
      },
      home: {
        meta: {
          title: "OpenAkita - Self-Evolving AI Agent",
          description:
            "Official OpenAkita website for a self-evolving AI Agent that learns, self-repairs, and never gives up.",
        },
        hero: {
          title: "OpenAkita, Always by Your Side",
          slogan: "Always with you. Always getting stronger.",
          desc: "Bring one API key. OpenAkita handles the rest.",
          btnDownload: "Download Now",
          btnSetup: "Start in 3 Min",
          btnTutorials: "All Tutorials",
        },
        release: {
          link: "View Release details",
        },
        releaseTitle: "Release Info",
      },
      download: {
        meta: {
          title: "Download OpenAkita - Desktop / CLI / Source",
          description: "OpenAkita downloads: Desktop packages, PyPI CLI install, source deployment, and quick scripts.",
        },
        hero: {
          title: "Download and Install OpenAkita",
          desc: "Choose Desktop, CLI, or source deployment based on your team workflow.",
        },
        buttons: {
          latest: "All Packages",
          notes: "Release Notes",
        },
        cards: {
          desktop: {
            title: "Desktop Packages (Win / macOS / Linux)",
            desc: "Only the latest packages for three platforms are shown.",
          },
          cli: {
            title: "PyPI CLI Install",
            desc: "Best for CLI workflows and automation.",
            btn: "View Setup Guide",
          },
          source: {
            title: "Source Installation",
            desc: "Best for custom development and self-hosted pipelines.",
          },
        },
      },
      tutorials: {
        meta: {
          title: "OpenAkita Tutorials - Text and Video",
          description:
            "Official OpenAkita tutorials for setup, IM channels, QQ Official Bot, OneBot, and LLM endpoint/API key configuration.",
        },
        hero: {
          title: "Tutorial Center",
          desc: "Covers setup, IM channels, and LLM endpoint configuration.",
        },
      },
      setup: {
        meta: {
          title: "OpenAkita Setup Guide - Desktop and CLI",
          description: "OpenAkita setup tutorial for Desktop, CLI, and source installation.",
        },
        hero: {
          title: "Assistant Setup and Initial Configuration",
          desc: "A complete path from installation to first-run validation.",
        },
        side: ["Overview", "Requirements", "Install OpenAkita", "Startup Validation"],
      },
      im: {
        meta: {
          title: "OpenAkita IM Channel Configuration Guide",
          description: "Platform onboarding and configuration for Telegram, Feishu, DingTalk, WeCom, QQ Official Bot, and OneBot.",
        },
        hero: {
          title: "IM Channel Config and Platform Onboarding",
          desc: "Covers platform onboarding and `.env` configuration, including QQ Official Bot and OneBot.",
        },
        side: ["Platform Overview", "Telegram", "Feishu", "DingTalk", "WeCom", "QQ Official Bot", "OneBot (Universal)", "Voice", "Video"],
      },
      llm: {
        meta: {
          title: "OpenAkita LLM Endpoints and API Key Guide",
          description: "API key onboarding, `.env` setup, and `llm_endpoints.json` configuration.",
        },
        hero: {
          title: "LLM Endpoints and API Key Configuration",
          desc: "Build a resilient and scalable model access layer.",
        },
        side: ["Overview", "API Key", ".env", "llm_endpoints.json", "Capability Routing", "Validation", "Video"],
      },
      about: {
        meta: {
          title: "About OpenAkita - Self-Evolving AI Agent Project",
          description: "About OpenAkita: project vision, architecture direction, and community participation.",
        },
        hero: {
          title: "About Us",
          desc: "OpenAkita is a self-evolving AI Agent project built for real production scenarios.",
        },
      },
    },
    ja: {
      common: {
        navToggle: "ナビを開く",
        language: "言語",
        nav: { home: "ホーム", download: "ダウンロード", tutorials: "チュートリアル", about: "概要", github: "GitHub" },
      },
      home: {
        hero: {
          title: "あなたに寄り添い成長する、万能 AI アシスタント",
          slogan: "毎日に寄り添う、あなたの本当の相棒。",
          desc: "API Key を 1 つ入れるだけ。あとは OpenAkita が実行します。",
        },
      },
      download: { hero: { title: "OpenAkita をダウンロード", desc: "Desktop / CLI / Source の 3 つの導入方法を提供します。" } },
      tutorials: { hero: { title: "チュートリアルセンター", desc: "インストール、IM 連携、LLM 設定を網羅。" } },
      setup: {
        hero: { title: "初期セットアップ", desc: "Desktop と CLI の導入手順。" },
        side: ["概要", "要件", "OpenAkita のインストール", "起動検証"],
      },
      im: {
        hero: { title: "IM チャネル設定", desc: "各プラットフォームの申請と接続手順（QQ公式ボットとOneBotを含む）。" },
        side: ["プラットフォーム概要", "Telegram", "Feishu", "DingTalk", "WeCom", "QQ公式ボット", "OneBot（汎用プロトコル）", "音声変換", "動画"],
      },
      llm: {
        hero: { title: "LLM エンドポイント設定", desc: "API Key とエンドポイント構成を設定。" },
        side: ["概要", "API Key", ".env", "llm_endpoints.json", "ルーティング", "検証", "動画"],
      },
      about: { hero: { title: "私たちについて", desc: "OpenAkita のビジョンとコミュニティ。" } },
    },
    ko: {
      common: {
        navToggle: "탐색 열기",
        language: "언어",
        nav: { home: "홈", download: "다운로드", tutorials: "튜토리얼", about: "소개", github: "GitHub" },
      },
      home: {
        hero: {
          title: "함께 성장하는 올인원 AI 어시스턴트",
          slogan: "매일 곁에서 함께하는 진짜 전능한 도우미.",
          desc: "API Key 하나면 시작됩니다. 나머지는 OpenAkita가 처리합니다.",
        },
      },
      download: { hero: { title: "OpenAkita 다운로드", desc: "Desktop / CLI / Source 3가지 설치 경로를 지원합니다." } },
      tutorials: { hero: { title: "튜토리얼 센터", desc: "설치, IM 연동, LLM 설정을 다룹니다." } },
      setup: {
        hero: { title: "초기 설정", desc: "Desktop 및 CLI 설치 가이드." },
        side: ["개요", "요구 사항", "OpenAkita 설치", "시작 검증"],
      },
      im: {
        hero: { title: "IM 채널 설정", desc: "플랫폼 신청 및 연동 절차(QQ 공식 봇과 OneBot 포함)." },
        side: ["플랫폼 개요", "Telegram", "Feishu", "DingTalk", "WeCom", "QQ 공식 봇", "OneBot(범용 프로토콜)", "음성 전사", "영상"],
      },
      llm: {
        hero: { title: "LLM 엔드포인트 설정", desc: "API Key 및 엔드포인트 구성." },
        side: ["개요", "API Key", ".env", "llm_endpoints.json", "라우팅", "검증", "영상"],
      },
      about: { hero: { title: "소개", desc: "OpenAkita 비전과 커뮤니티." } },
    },
    ru: {
      common: {
        navToggle: "Открыть навигацию",
        language: "Язык",
        nav: { home: "Главная", download: "Скачать", tutorials: "Руководства", about: "О проекте", github: "GitHub" },
      },
      home: {
        hero: {
          title: "Универсальный AI-помощник, который растет вместе с вами",
          slogan: "Каждый день рядом с вами — как надежный компаньон.",
          desc: "Нужен только API Key. Остальное OpenAkita сделает сам.",
        },
      },
      download: { hero: { title: "Скачать OpenAkita", desc: "Доступны Desktop, CLI и исходная установка." } },
      tutorials: { hero: { title: "Центр руководств", desc: "Установка, IM-каналы и настройка LLM." } },
      setup: {
        hero: { title: "Начальная установка", desc: "Пошаговый гайд для Desktop и CLI." },
        side: ["Обзор", "Требования", "Установка OpenAkita", "Проверка запуска"],
      },
      im: {
        hero: { title: "Настройка IM-каналов", desc: "Подключение платформ и конфигурация (включая QQ Official Bot и OneBot)." },
        side: ["Обзор платформ", "Telegram", "Feishu", "DingTalk", "WeCom", "Официальный бот QQ", "OneBot (универсальный)", "Голос", "Видео"],
      },
      llm: {
        hero: { title: "Настройка LLM endpoints", desc: "API Key и отказоустойчивые endpoints." },
        side: ["Обзор", "API Key", ".env", "llm_endpoints.json", "Маршрутизация", "Проверка", "Видео"],
      },
      about: { hero: { title: "О нас", desc: "Видение OpenAkita и сообщество." } },
    },
    fr: {
      common: {
        navToggle: "Ouvrir la navigation",
        language: "Langue",
        nav: { home: "Accueil", download: "Télécharger", tutorials: "Tutoriels", about: "À propos", github: "GitHub" },
      },
      home: {
        hero: {
          title: "Un assistant IA tout-en-un qui grandit avec vous",
          slogan: "Un compagnon au quotidien, un assistant vraiment complet.",
          desc: "Ajoutez une clé API. OpenAkita gère le reste.",
        },
      },
      download: { hero: { title: "Télécharger OpenAkita", desc: "Installation Desktop, CLI et source." } },
      tutorials: { hero: { title: "Centre de tutoriels", desc: "Installation, canaux IM et configuration LLM." } },
      setup: {
        hero: { title: "Installation initiale", desc: "Guide Desktop et CLI étape par étape." },
        side: ["Aperçu", "Prérequis", "Installer OpenAkita", "Vérification du démarrage"],
      },
      im: {
        hero: { title: "Configuration des canaux IM", desc: "Onboarding des plateformes et intégration (QQ Bot officiel et OneBot inclus)." },
        side: ["Aperçu plateforme", "Telegram", "Feishu", "DingTalk", "WeCom", "Bot officiel QQ", "OneBot (universel)", "Voix", "Vidéo"],
      },
      llm: {
        hero: { title: "Configuration des endpoints LLM", desc: "API Key et stratégie de bascule." },
        side: ["Aperçu", "API Key", ".env", "llm_endpoints.json", "Routage", "Validation", "Vidéo"],
      },
      about: { hero: { title: "À propos", desc: "Vision OpenAkita et communauté." } },
    },
    de: {
      common: {
        navToggle: "Navigation öffnen",
        language: "Sprache",
        nav: { home: "Start", download: "Download", tutorials: "Tutorials", about: "Über uns", github: "GitHub" },
      },
      home: {
        hero: {
          title: "Ein Allround-AI-Assistent, der mit dir mitwächst",
          slogan: "Dein täglicher Begleiter und wirklich vielseitiger Assistent.",
          desc: "Ein API Key reicht. Den Rest erledigt OpenAkita.",
        },
      },
      download: { hero: { title: "OpenAkita herunterladen", desc: "Desktop-, CLI- und Source-Installation verfügbar." } },
      tutorials: { hero: { title: "Tutorial-Zentrum", desc: "Installation, IM-Kanäle und LLM-Konfiguration." } },
      setup: {
        hero: { title: "Ersteinrichtung", desc: "Schritt-für-Schritt für Desktop und CLI." },
        side: ["Überblick", "Voraussetzungen", "OpenAkita installieren", "Startprüfung"],
      },
      im: {
        hero: { title: "IM-Kanal-Konfiguration", desc: "Plattform-Onboarding und Integration (inkl. QQ Official Bot und OneBot)." },
        side: ["Plattformüberblick", "Telegram", "Feishu", "DingTalk", "WeCom", "QQ Official Bot", "OneBot (Universal)", "Sprache", "Video"],
      },
      llm: {
        hero: { title: "LLM-Endpoint-Konfiguration", desc: "API-Keys und Failover-Endpunkte." },
        side: ["Überblick", "API Key", ".env", "llm_endpoints.json", "Routing", "Validierung", "Video"],
      },
      about: { hero: { title: "Über uns", desc: "Vision und Community von OpenAkita." } },
    },
  };

  function getNestedValue(obj, key) {
    if (!obj || !key) return undefined;
    return key.split(".").reduce(function (acc, part) {
      return acc && typeof acc === "object" ? acc[part] : undefined;
    }, obj);
  }

  let currentLanguage = "zh";

  function t(key) {
    const current = getNestedValue(MESSAGES[currentLanguage], key);
    if (current !== undefined && current !== null) return current;
    const english = getNestedValue(MESSAGES.en, key);
    if (english !== undefined && english !== null) return english;
    const chinese = getNestedValue(MESSAGES.zh, key);
    if (chinese !== undefined && chinese !== null) return chinese;
    return undefined;
  }

  function normalizeLanguageTag(languageTag) {
    if (!languageTag) return "zh";
    const lower = languageTag.toLowerCase();
    const short = lower.split("-")[0];
    return SUPPORTED_LANGS.includes(short) ? short : "zh";
  }

  function detectLanguage() {
    const saved = localStorage.getItem("openakita_language");
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    const browserCandidates = Array.isArray(navigator.languages) && navigator.languages.length > 0 ? navigator.languages : [navigator.language || "zh-CN"];
    for (const tag of browserCandidates) {
      const normalized = normalizeLanguageTag(tag);
      if (SUPPORTED_LANGS.includes(normalized)) return normalized;
    }
    return "zh";
  }

  function resolvePageKey() {
    const path = (window.location.pathname || "").toLowerCase();
    if (path.includes("/tutorials/setup-install")) return "setup";
    if (path.includes("/tutorials/im-channels")) return "im";
    if (path.includes("/tutorials/llm-endpoints")) return "llm";
    if (path === "/tutorials" || path.startsWith("/tutorials/")) return "tutorials";
    if (path === "/download" || path.startsWith("/download/")) return "download";
    if (path === "/about" || path.startsWith("/about/")) return "about";
    return "home";
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && typeof value === "string") el.textContent = value;
  }

  function setHtml(selector, value) {
    const el = document.querySelector(selector);
    if (el && typeof value === "string") el.innerHTML = value;
  }

  function setAttr(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el && typeof value === "string") el.setAttribute(attr, value);
  }

  function setInlineLabel(selector, value) {
    const el = document.querySelector(selector);
    if (!el || typeof value !== "string") return;
    const textNode = Array.from(el.childNodes).find(function (node) {
      return node.nodeType === 3 && node.textContent.trim().length > 0;
    });
    if (textNode) {
      textNode.textContent = " " + value;
      return;
    }
    el.appendChild(document.createTextNode(" " + value));
  }

  function setList(selector, values) {
    const nodes = document.querySelectorAll(selector);
    values.forEach(function (value, index) {
      if (nodes[index] && typeof value === "string") nodes[index].textContent = value;
    });
  }

  function tArray(key) {
    const value = t(key);
    return Array.isArray(value) ? value : [];
  }

  let homeHeroTypingRun = 0;

  function applyHomeRevealStagger() {
    const revealNodes = document.querySelectorAll(".home-section .reveal");
    revealNodes.forEach(function (node, index) {
      const delay = Math.min(index * 65, 520);
      node.style.setProperty("--reveal-delay", delay + "ms");
    });
  }

  function getHomeHeroSubtitle(rawTitle, fallback) {
    const raw = (rawTitle || "").trim();
    if (!raw) return (fallback || "").trim();
    const stripped = raw.replace(/^openakita[\s,，:：-]*/i, "").trim();
    return stripped || raw;
  }

  function normalizeHomeHeroSubtitleLayout() {
    const subline = document.querySelector("body[data-page='home'] .hero-title-subline");
    const typed = document.getElementById("heroTypedTitle");
    if (!subline || !typed) return;

    const wraps = subline.querySelectorAll(".hero-typed-wrap");
    wraps.forEach(function (wrap) {
      const parent = wrap.parentElement;
      if (!parent) return;
      while (wrap.firstChild) {
        parent.insertBefore(wrap.firstChild, wrap);
      }
      wrap.remove();
    });

    typed.style.fontSize = "";
    typed.style.transform = "";
  }

  function startHomeHeroTyping() {
    const target = document.getElementById("heroTypedTitle");
    if (!target) return;

    normalizeHomeHeroSubtitleLayout();
    const text = getHomeHeroSubtitle(t("home.hero.title"), target.getAttribute("data-typed-title"));
    target.setAttribute("data-typed-title", text);

    const reducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    homeHeroTypingRun += 1;
    const runId = homeHeroTypingRun;
    target.textContent = "";

    if (!text || reducedMotion) {
      target.textContent = text;
      return;
    }

    let cursor = 0;

    function typeNext() {
      if (runId !== homeHeroTypingRun) return;
      cursor += 1;
      target.textContent = text.slice(0, cursor);
      if (cursor >= text.length) return;

      const typedChar = text.charAt(cursor - 1);
      const delay = /[\s·,.;:!?，。！？：；、]/.test(typedChar) ? 180 : 95;
      window.setTimeout(typeNext, delay);
    }

    window.setTimeout(typeNext, 360);
  }

  function applyMeta(pageKey) {
    const title = t(pageKey + ".meta.title");
    const description = t(pageKey + ".meta.description");
    if (title) document.title = title;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && description) descMeta.setAttribute("content", description);
  }

  function applyCommonTexts() {
    setAttr(".nav-toggle", "aria-label", t("common.navToggle"));
    setText('.main-nav a[data-nav="home"]', t("common.nav.home"));
    setText('.main-nav a[data-nav="download"]', t("common.nav.download"));
    setText('.main-nav a[data-nav="tutorials"]', t("common.nav.tutorials"));
    setText('.main-nav a[data-nav="about"]', t("common.nav.about"));
    const githubLink = document.querySelector('.main-nav a[href*="github.com/openakita/openakita"]');
    if (githubLink) githubLink.textContent = t("common.nav.github");
    setText(".lang-label", t("common.language"));
  }

  function applyHomeTexts() {
    setText("#heroTypedTitle", getHomeHeroSubtitle(t("home.hero.title"), "让私人AI随时陪伴"));
    setText("#heroSloganText", t("home.hero.slogan"));
    setText(".hero .hero-lead", t("home.hero.desc"));
    setInlineLabel("#downloadDesktopButton", t("home.hero.btnDownload"));
    setInlineLabel('.hero .hero-actions a[href="/tutorials/setup-install/"]', t("home.hero.btnSetup"));
    setInlineLabel('.hero .hero-actions a[href="/tutorials/"]', t("home.hero.btnTutorials"));
    startHomeHeroTyping();
  }

  function applyDownloadTexts() {
    setText(".page-hero h1", t("download.hero.title"));
    setText(".page-hero p", t("download.hero.desc"));
    setInlineLabel("#downloadDesktopButton", t("download.buttons.latest"));
    setText("#latestReleaseNotesLink", t("download.buttons.notes"));
    const releaseListFirst = document.querySelector("#releaseAssetsList li");
    if (releaseListFirst && !releaseListFirst.querySelector("a")) {
      releaseListFirst.textContent = t("common.release.loadingAssets");
    }
    setText("main > section:nth-of-type(2) .card:nth-child(1) h3", t("download.cards.desktop.title"));
    setText("main > section:nth-of-type(2) .card:nth-child(1) p", t("download.cards.desktop.desc"));
    setText("main > section:nth-of-type(2) .card:nth-child(2) h3", t("download.cards.cli.title"));
    setText("main > section:nth-of-type(2) .card:nth-child(2) p", t("download.cards.cli.desc"));
    setText("main > section:nth-of-type(2) .card:nth-child(2) .actions a", t("download.cards.cli.btn"));
    setText("main > section:nth-of-type(2) .card:nth-child(3) h3", t("download.cards.source.title"));
    setText("main > section:nth-of-type(2) .card:nth-child(3) p", t("download.cards.source.desc"));
  }

  function applyTutorialIndexTexts() {
    setText(".page-hero h1", t("tutorials.hero.title"));
    setText(".page-hero p", t("tutorials.hero.desc"));
  }

  function applySetupTexts() {
    setText(".page-hero h1", t("setup.hero.title"));
    setText(".page-hero p", t("setup.hero.desc"));
    setList(".side-nav a", tArray("setup.side"));
  }

  function applyImTexts() {
    setText(".page-hero h1", t("im.hero.title"));
    setText(".page-hero p", t("im.hero.desc"));
    setList(".side-nav a", tArray("im.side"));
  }

  function applyLlmTexts() {
    setText(".page-hero h1", t("llm.hero.title"));
    setText(".page-hero p", t("llm.hero.desc"));
    setList(".side-nav a", tArray("llm.side"));
  }

  function applyAboutTexts() {
    setText(".page-hero h1", t("about.hero.title"));
    setText(".page-hero p", t("about.hero.desc"));
  }

  function applyPageTexts(pageKey) {
    if (pageKey === "home") applyHomeTexts();
    if (pageKey === "download") applyDownloadTexts();
    if (pageKey === "tutorials") applyTutorialIndexTexts();
    if (pageKey === "setup") applySetupTexts();
    if (pageKey === "im") applyImTexts();
    if (pageKey === "llm") applyLlmTexts();
    if (pageKey === "about") applyAboutTexts();
  }

  function injectLanguageSwitcher(pageKey) {
    const nav = document.querySelector(".main-nav");
    if (!nav || nav.querySelector(".lang-switch")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "lang-switch";
    const label = document.createElement("label");
    label.className = "lang-label";
    label.setAttribute("for", "languageSelect");
    label.textContent = t("common.language");

    const select = document.createElement("select");
    select.className = "lang-select";
    select.id = "languageSelect";

    const options = [
      { value: "zh", label: "中文" },
      { value: "en", label: "English" },
      { value: "ja", label: "日本語" },
      { value: "ko", label: "한국어" },
      { value: "ru", label: "Русский" },
      { value: "fr", label: "Français" },
      { value: "de", label: "Deutsch" },
    ];

    options.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });

    select.value = currentLanguage;
    select.addEventListener("change", function () {
      currentLanguage = normalizeLanguageTag(select.value);
      localStorage.setItem("openakita_language", currentLanguage);
      document.documentElement.lang = LANG_TO_LOCALE[currentLanguage] || "en-US";
      applyMeta(pageKey);
      applyCommonTexts();
      applyPageTexts(pageKey);
      applyHomeRevealStagger();
      enhanceCodeBlocks();
      loadLatestRelease();
      void autoTranslateSiteContent();
      document.dispatchEvent(new CustomEvent("openakita:language-changed"));
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    nav.appendChild(wrapper);
  }

  function getCopyButtonLabel(state) {
    if (state === "copied") return t("common.copy.copied") || "Copied";
    if (state === "failed") return t("common.copy.failed") || "Copy failed";
    return t("common.copy.copy") || "Copy";
  }

  async function copyToClipboardText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) {
      throw new Error("copy_failed");
    }
  }

  function enhanceCodeBlocks() {
    const blocks = document.querySelectorAll(".code-block");

    blocks.forEach(function (block) {
      const codeNode = block.querySelector("code");
      if (!codeNode) return;

      block.classList.add("has-copy");
      let btn = block.querySelector(".code-copy-btn");

      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "code-copy-btn";
        btn.dataset.state = "idle";
        block.appendChild(btn);

        btn.addEventListener("click", async function () {
          const text = codeNode.textContent || "";
          btn.dataset.state = "idle";
          try {
            await copyToClipboardText(text.trimEnd());
            btn.dataset.state = "copied";
          } catch (error) {
            btn.dataset.state = "failed";
          }
          btn.textContent = getCopyButtonLabel(btn.dataset.state);
          window.setTimeout(function () {
            btn.dataset.state = "idle";
            btn.textContent = getCopyButtonLabel("idle");
          }, 1600);
        });
      }

      if (btn.dataset.state !== "copied" && btn.dataset.state !== "failed") {
        btn.dataset.state = "idle";
      }
      btn.textContent = getCopyButtonLabel(btn.dataset.state || "idle");
    });
  }

  const contentTextSourceMap = new WeakMap();
  let autoTranslateCache = null;
  let reverseSourceLookupByLang = {};
  let autoTranslateRunId = 0;
  let prebuiltCacheMerged = false;
  let prebuiltCachePromise = null;

  function loadAutoTranslateCache() {
    if (autoTranslateCache) return autoTranslateCache;
    try {
      autoTranslateCache = JSON.parse(localStorage.getItem(AUTO_TRANSLATE_CACHE_KEY) || "{}");
    } catch (error) {
      autoTranslateCache = {};
    }
    return autoTranslateCache;
  }

  function saveAutoTranslateCache() {
    if (!autoTranslateCache) return;
    reverseSourceLookupByLang = {};
    try {
      localStorage.setItem(AUTO_TRANSLATE_CACHE_KEY, JSON.stringify(autoTranslateCache));
    } catch (error) {
      // Ignore quota errors and keep in-memory cache.
    }
  }

  function getReverseSourceLookup(lang) {
    if (reverseSourceLookupByLang[lang]) return reverseSourceLookupByLang[lang];
    const cache = loadAutoTranslateCache();
    const langCache = cache[lang] || {};
    const reverse = new Map();
    Object.keys(langCache).forEach(function (source) {
      const translated = langCache[source];
      if (typeof translated === "string" && translated && !reverse.has(translated)) {
        reverse.set(translated, source);
      }
    });
    reverseSourceLookupByLang[lang] = reverse;
    return reverse;
  }

  function inferSourceCore(core) {
    if (typeof core !== "string" || !core) return core;
    if (/[\u4e00-\u9fff]/.test(core)) return core;

    const candidates = [currentLanguage, "en"].concat(Array.from(AUTO_TRANSLATE_SUPPORTED));
    const seen = new Set();

    for (const lang of candidates) {
      if (!lang || seen.has(lang)) continue;
      seen.add(lang);
      const reverse = getReverseSourceLookup(lang);
      if (reverse.has(core)) return reverse.get(core);
    }

    return core;
  }

  async function ensurePrebuiltTranslateCacheLoaded() {
    if (prebuiltCacheMerged) return;
    if (!prebuiltCachePromise) {
      prebuiltCachePromise = (async function () {
        try {
          const response = await fetch(PREBUILT_TRANSLATION_CACHE_URL, { cache: "force-cache" });
          if (!response.ok) return;
          const payload = await response.json();
          const prebuilt = payload && payload.cache && typeof payload.cache === "object" ? payload.cache : null;
          if (!prebuilt) return;

          const cache = loadAutoTranslateCache();
          AUTO_TRANSLATE_SUPPORTED.forEach(function (lang) {
            const fromFile = prebuilt[lang];
            if (!fromFile || typeof fromFile !== "object") return;
            cache[lang] = cache[lang] || {};
            Object.keys(fromFile).forEach(function (source) {
              cache[lang][source] = fromFile[source];
            });
          });
          saveAutoTranslateCache();
        } catch (error) {
          // Keep runtime translation fallback when prebuilt cache is unavailable.
        } finally {
          prebuiltCacheMerged = true;
        }
      })();
    }
    await prebuiltCachePromise;
  }

  function collectContentTextNodes() {
    const roots = [];
    const main = document.querySelector("main");
    const footer = document.querySelector(".site-footer");
    const setupDrawer = document.querySelector("[data-setup-drawer]");
    if (main) roots.push(main);
    if (footer) roots.push(footer);
    if (setupDrawer) roots.push(setupDrawer);

    const entries = [];
    const meaningfulPattern = /[\p{L}\p{N}]/u;

    roots.forEach(function (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const parent = node.parentElement;
        if (!parent) {
          node = walker.nextNode();
          continue;
        }

        if (parent.closest("script,style,noscript,textarea,code,pre,.code-block")) {
          node = walker.nextNode();
          continue;
        }

        const idCarrier = parent.closest("[id]");
        if (idCarrier && AUTO_TRANSLATE_SKIP_IDS.has(idCarrier.id)) {
          node = walker.nextNode();
          continue;
        }

        const raw = node.nodeValue || "";
        const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
        if (!match) {
          node = walker.nextNode();
          continue;
        }

        const prefix = match[1];
        const core = match[2];
        const suffix = match[3];

        if (!core || !meaningfulPattern.test(core) || core.trim().startsWith("©")) {
          node = walker.nextNode();
          continue;
        }

        let sourceCore = contentTextSourceMap.get(node);
        if (!sourceCore) {
          sourceCore = inferSourceCore(core);
          contentTextSourceMap.set(node, sourceCore);
        } else if (!/[\u4e00-\u9fff]/.test(sourceCore)) {
          const recoveredFromCore = inferSourceCore(core);
          if (recoveredFromCore && recoveredFromCore !== sourceCore) {
            sourceCore = recoveredFromCore;
            contentTextSourceMap.set(node, sourceCore);
          } else {
            const recoveredFromStored = inferSourceCore(sourceCore);
            if (recoveredFromStored && recoveredFromStored !== sourceCore) {
              sourceCore = recoveredFromStored;
              contentTextSourceMap.set(node, sourceCore);
            }
          }
        }

        if (currentLanguage === "zh") {
          if (/[\u4e00-\u9fff]/.test(core)) {
            sourceCore = core;
            contentTextSourceMap.set(node, sourceCore);
          } else if (!/[\u4e00-\u9fff]/.test(sourceCore || "")) {
            const recoveredSource = inferSourceCore(core);
            if (recoveredSource && recoveredSource !== sourceCore) {
              sourceCore = recoveredSource;
              contentTextSourceMap.set(node, sourceCore);
            }
          }
        }

        entries.push({
          node: node,
          prefix: prefix,
          suffix: suffix,
          source: sourceCore || core,
        });

        node = walker.nextNode();
      }
    });

    return entries;
  }

  async function requestGoogleTranslateBatch(texts, targetLanguage) {
    const query = encodeURIComponent(texts.join(AUTO_TRANSLATE_SEPARATOR));
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
      encodeURIComponent(targetLanguage) +
      "&dt=t&q=" +
      query;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("translate_request_failed");
    }
    const payload = await response.json();
    const segments = Array.isArray(payload) && Array.isArray(payload[0]) ? payload[0] : [];
    const translated = segments
      .map(function (segment) {
        return Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : "";
      })
      .join("");
    const parts = translated.split(AUTO_TRANSLATE_SEPARATOR);
    if (parts.length !== texts.length) {
      throw new Error("translate_batch_split_failed");
    }
    return parts;
  }

  async function translateMissingTexts(sources, targetLanguage) {
    const translatedMap = {};
    const queue = sources.slice();

    while (queue.length > 0) {
      const batch = [];
      let charCount = 0;

      while (queue.length > 0) {
        const candidate = queue[0];
        const projected = charCount + candidate.length + AUTO_TRANSLATE_SEPARATOR.length;
        if (batch.length >= 24 || (batch.length > 0 && projected > 3200)) {
          break;
        }
        batch.push(queue.shift());
        charCount = projected;
      }

      if (batch.length === 0) {
        batch.push(queue.shift());
      }

      try {
        const translatedBatch = await requestGoogleTranslateBatch(batch, targetLanguage);
        batch.forEach(function (source, index) {
          translatedMap[source] = translatedBatch[index] || source;
        });
      } catch (error) {
        for (const source of batch) {
          try {
            const single = await requestGoogleTranslateBatch([source], targetLanguage);
            translatedMap[source] = single[0] || source;
          } catch (singleError) {
            translatedMap[source] = source;
          }
        }
      }
    }

    return translatedMap;
  }

  async function autoTranslateSiteContent() {
    const runId = ++autoTranslateRunId;

    if (currentLanguage !== "zh" && AUTO_TRANSLATE_SUPPORTED.has(currentLanguage)) {
      await ensurePrebuiltTranslateCacheLoaded();
      if (runId !== autoTranslateRunId) return;
    }

    const entries = collectContentTextNodes();
    entries.forEach(function (entry) {
      if (!entry || !entry.node || entry.node.nodeType !== Node.TEXT_NODE) return;
      entry.node.nodeValue = entry.prefix + entry.source + entry.suffix;
    });

    if (currentLanguage === "zh" || !AUTO_TRANSLATE_SUPPORTED.has(currentLanguage)) {
      return;
    }

    const cache = loadAutoTranslateCache();
    cache[currentLanguage] = cache[currentLanguage] || {};
    const langCache = cache[currentLanguage];

    const uniqueSources = Array.from(
      new Set(
        entries
          .map(function (entry) {
            return entry && typeof entry.source === "string" ? entry.source : "";
          })
          .filter(function (text) {
            return text.trim().length > 0 && /[\p{L}\p{N}]/u.test(text);
          })
      )
    );

    const missingSources = uniqueSources.filter(function (source) {
      return !langCache[source];
    });

    if (missingSources.length > 0) {
      const translated = await translateMissingTexts(missingSources, currentLanguage);
      if (runId !== autoTranslateRunId) return;
      Object.keys(translated).forEach(function (source) {
        langCache[source] = translated[source];
      });
      saveAutoTranslateCache();
    }

    if (runId !== autoTranslateRunId) return;

    entries.forEach(function (entry) {
      if (!entry || !entry.node || entry.node.nodeType !== Node.TEXT_NODE) return;
      const englishCache = cache.en || {};
      const translatedCore = langCache[entry.source] || englishCache[entry.source] || entry.source;
      entry.node.nodeValue = entry.prefix + translatedCore + entry.suffix;
    });

    enhanceCodeBlocks();
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      const expanded = nav.classList.contains("open");
      navToggle.setAttribute("aria-expanded", String(expanded));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length > 0) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  const yearNode = document.querySelector("[data-current-year]");
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const pageId = document.body.getAttribute("data-page");
  if (pageId) {
    const activeLink = document.querySelector('.main-nav a[data-nav="' + pageId + '"]');
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  const pageKey = resolvePageKey();
  currentLanguage = detectLanguage();
  document.documentElement.lang = LANG_TO_LOCALE[currentLanguage] || "en-US";
  applyMeta(pageKey);
  applyCommonTexts();
  applyPageTexts(pageKey);
  applyHomeRevealStagger();
  injectLanguageSwitcher(pageKey);
  enhanceCodeBlocks();
  initSetupInstallDrawer();

  function recoverBrokenSvgIcons() {
    const svgImages = document.querySelectorAll('img[src$=".svg"]');

    svgImages.forEach(function (img) {
      const originalSrc = img.getAttribute("src");
      if (!originalSrc) return;

      async function recover() {
        if (img.dataset.svgRecovered === "1") return;
        try {
          const response = await fetch(originalSrc, { cache: "no-store" });
          if (!response.ok) return;
          const svgText = await response.text();
          if (!svgText || svgText.indexOf("<svg") === -1) return;
          const blob = new Blob([svgText], { type: "image/svg+xml" });
          const objectUrl = URL.createObjectURL(blob);
          img.src = objectUrl;
          img.dataset.svgRecovered = "1";
        } catch (error) {
          // no-op: keep original src when recovery fails
        }
      }

      img.addEventListener("error", recover, { once: true });
      if (img.complete && img.naturalWidth === 0) {
        recover();
      }
    });
  }

  recoverBrokenSvgIcons();

  function initSetupInstallDrawer() {
    const triggers = Array.from(document.querySelectorAll("[data-setup-method]"));
    const drawer = document.querySelector("[data-setup-drawer]");
    const backdrop = document.querySelector("[data-setup-drawer-backdrop]");
    const closeBtn = document.querySelector("[data-setup-drawer-close]");
    const titleNode = document.querySelector("[data-setup-drawer-title]");
    const navNode = document.querySelector("[data-setup-drawer-nav]");
    const contentNode = document.querySelector("[data-setup-drawer-content]");
    let activeMethod = null;

    if (!triggers.length || !drawer || !backdrop || !closeBtn || !titleNode || !navNode || !contentNode) return;

    const methodMap = {
      desktop: {
        title: "方式一：Desktop（配置向导）",
        templateId: "setup-drawer-template-desktop",
        chapters: [
          { id: "drawer-desktop-start", label: "0. 启动应用" },
          { id: "drawer-desktop-mode", label: "1. 选择配置模式" },
          { id: "drawer-desktop-quick-overview", label: "2. 快速配置概览" },
          { id: "drawer-desktop-quick-llm", label: "2.1 填写LLM 端点参数" },
          { id: "drawer-desktop-quick-im", label: "2.2 填写 IM 通道参数" },
          { id: "drawer-desktop-quick-auto", label: "2.3 开始配置" },
          { id: "drawer-desktop-quick-done", label: "2.4 配置完成" },
          { id: "drawer-desktop-full-overview", label: "3. 完整配置" },
          { id: "drawer-desktop-full-workspace", label: "3.1 工作区" },
          { id: "drawer-desktop-full-python", label: "3.2 Python 环境" },
          { id: "drawer-desktop-full-install", label: "3.3 安装" },
          { id: "drawer-desktop-full-llm", label: "3.4 LLM 端点" },
          { id: "drawer-desktop-full-im", label: "3.5 IM 通道" },
          { id: "drawer-desktop-full-tools", label: "3.6 工具与技能" },
          { id: "drawer-desktop-full-agent", label: "3.7 Agent 与系统" },
          { id: "drawer-desktop-full-done", label: "3.8 完成" },
        ],
      },
      pypi: {
        title: "方式二：PyPI CLI",
        templateId: "setup-drawer-template-pypi",
        chapters: [
          { id: "drawer-pypi-install", label: "1. 安装步骤" },
          { id: "drawer-pypi-verify", label: "2. 启动验证" },
        ],
      },
      source: {
        title: "方式三：源码安装",
        templateId: "setup-drawer-template-source",
        chapters: [
          { id: "drawer-source-install", label: "1. 安装步骤" },
          { id: "drawer-source-check", label: "2. 必查项" },
          { id: "drawer-source-verify", label: "3. 启动验证" },
        ],
      },
    };

    function closeDrawer() {
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      backdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("setup-drawer-open");
    }

    function openDrawer(method) {
      const config = methodMap[method];
      if (!config) return;
      const template = document.getElementById(config.templateId);
      if (!template) return;
      activeMethod = method;

      titleNode.textContent = config.title;
      navNode.innerHTML = "";
      contentNode.innerHTML = "";
      contentNode.appendChild(template.content.cloneNode(true));

      config.chapters.forEach(function (chapter) {
        const link = document.createElement("a");
        link.href = "#" + chapter.id;
        link.textContent = chapter.label;
        const match = chapter.label.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
        if (match) {
          if (match[3] !== undefined) link.classList.add("setup-nav-l3");
          else if (match[2] !== undefined) link.classList.add("setup-nav-l2");
          else link.classList.add("setup-nav-l1");
        } else {
          link.classList.add("setup-nav-l1");
        }
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const target = contentNode.querySelector("#" + chapter.id);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        navNode.appendChild(link);
      });

      enhanceCodeBlocks();
      void autoTranslateSiteContent();
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("setup-drawer-open");
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openDrawer(trigger.getAttribute("data-setup-method"));
      });
    });

    closeBtn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer();
      }
    });

    document.addEventListener("openakita:language-changed", function () {
      if (!drawer.classList.contains("is-open") || !activeMethod) return;
      openDrawer(activeMethod);
    });
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(LANG_TO_LOCALE[currentLanguage] || "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return "--";
    }
  }

  // ── OS Detection for smart download recommendation ──
  function detectOS() {
    var ua = (navigator.userAgent || "").toLowerCase();
    var platform = (navigator.platform || "").toLowerCase();
    if (ua.indexOf("win") !== -1 || platform.indexOf("win") !== -1) return "windows";
    if (ua.indexOf("mac") !== -1 || platform.indexOf("mac") !== -1) return "macos";
    if (ua.indexOf("linux") !== -1 || platform.indexOf("linux") !== -1) return "linux";
    return null;
  }

  // ── Download channel helpers ──
  var OS_LABELS = { windows: "Windows", macos: "macOS", linux: "Linux" };

  function formatSize(bytes) {
    if (!bytes || bytes <= 0) return "";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function pickDownloadForOS(downloads, os) {
    if (!downloads || !os || typeof downloads !== "object") return null;
    var entries = Object.entries(downloads).filter(function(entry) {
      var item = entry[1];
      return item && typeof item.url === "string" && item.url;
    });
    if (!entries.length) return null;

    function matchOS(key, item, targetOS) {
      var haystack = (key + " " + (item.name || "") + " " + (item.url || "")).toLowerCase();
      if (targetOS === "windows") {
        return /windows|win32|win64|\.exe$|\.msi$/.test(haystack);
      }
      if (targetOS === "macos") {
        return /mac|macos|darwin|osx|\.dmg$|\.pkg$/.test(haystack);
      }
      if (targetOS === "linux") {
        return /linux|ubuntu|debian|appimage|\.appimage$|\.deb$|\.rpm$|\.tar\.gz$/.test(haystack);
      }
      return false;
    }

    var matched = entries.find(function(entry) {
      return matchOS(entry[0], entry[1], os);
    });
    return matched ? matched[1] : entries[0][1];
  }

  function isCurrentOSDownload(key, item, os) {
    if (!os || !item) return false;
    var haystack = (key + " " + (item.name || "") + " " + (item.url || "")).toLowerCase();
    if (os === "windows") return /windows|win32|win64|\.exe$|\.msi$/.test(haystack);
    if (os === "macos") return /mac|macos|darwin|osx|\.dmg$|\.pkg$/.test(haystack);
    if (os === "linux") return /linux|ubuntu|debian|appimage|\.appimage$|\.deb$|\.rpm$|\.tar\.gz$/.test(haystack);
    return false;
  }

  function normalizeDownloadLabel(key, item) {
    var base = (item && (item.nickname || item.name)) ? (item.nickname || item.name) : key;
    return String(base || "").replace(/_/g, " ");
  }

  function getAllPlatformLinks(downloads, os, includeCurrent) {
    if (!downloads || typeof downloads !== "object") return [];
    var showCurrent = Boolean(includeCurrent);
    var links = [];
    Object.entries(downloads).forEach(function(entry) {
      var key = entry[0];
      var item = entry[1];
      if (!item || typeof item.url !== "string" || !item.url) return;
      var size = formatSize(item.size);
      links.push({
        label: normalizeDownloadLabel(key, item) + (size ? " " + size : ""),
        url: item.url,
        includeCurrent: showCurrent,
        isCurrent: isCurrentOSDownload(key, item, os),
      });
    });
    return links;
  }

  function buildDownloadURLsFromGH(version, assets) {
    var downloads = {};
    if (!Array.isArray(assets)) return downloads;
    var patterns = [
      { key: "windows-core",            ext: /\.exe$/i, include: /core/i,        exclude: /full|uninstall/i, nickname: "Windows 10/11" },
      { key: "windows-full",            ext: /\.exe$/i, include: /full/i,        exclude: /core|uninstall/i, nickname: "Windows 10/11 \u5b8c\u6574\u7248" },
      { key: "macos-arm64",             ext: /\.dmg$/i, include: /arm64|aarch64/i, exclude: null,           nickname: "macOS Apple Silicon (.dmg)" },
      { key: "macos-x64",              ext: /\.dmg$/i, include: /x64|x86_64|intel/i, exclude: null,        nickname: "macOS Intel (.dmg)" },
      { key: "linux-deb-ubuntu22-amd64", ext: /\.deb$/i, include: /ubuntu22-amd64|ubuntu22.*amd64/i, exclude: null, nickname: "Ubuntu 22 x64 (.deb)" },
      { key: "linux-deb-ubuntu22-arm64", ext: /\.deb$/i, include: /ubuntu22-arm64|ubuntu22.*arm64/i, exclude: null, nickname: "Ubuntu 22 ARM64 (.deb)" },
      { key: "linux-deb-ubuntu24-amd64", ext: /\.deb$/i, include: /ubuntu24-amd64|ubuntu24.*amd64/i, exclude: null, nickname: "Ubuntu 24 x64 (.deb)" },
      { key: "linux-deb-ubuntu24-arm64", ext: /\.deb$/i, include: /ubuntu24-arm64|ubuntu24.*arm64/i, exclude: null, nickname: "Ubuntu 24 ARM64 (.deb)" },
      { key: "linux-appimage-x64",      ext: /\.appimage$/i, include: null,      exclude: /arm64|aarch64/i, nickname: "Linux AppImage x64" },
    ];
    patterns.forEach(function(p) {
      var found = assets.find(function(a) {
        var name = a.name || "";
        if (!p.ext.test(name)) return false;
        if (p.include && !p.include.test(name)) return false;
        if (p.exclude && p.exclude.test(name)) return false;
        return true;
      });
      if (found) {
        downloads[p.key] = {
          nickname: p.nickname,
          name: found.name,
          url: found.browser_download_url,
          size: found.size || 0,
        };
      }
    });
    return downloads;
  }

  function renderChannel(prefix, data, os) {
    var section = document.getElementById(prefix + "DownloadSection");
    if (!section) return;
    if (!data || !data.version) { section.style.display = "none"; return; }

    section.style.display = "";
    var versionEl = document.getElementById(prefix + "Version");
    var dateEl = document.getElementById(prefix + "Date");
    var primaryBtn = document.getElementById(prefix + "PrimaryBtn");
    var primaryOS = document.getElementById(prefix + "PrimaryOS");
    var primaryMeta = document.getElementById(prefix + "PrimaryMeta");
    var platformsEl = document.getElementById(prefix + "Platforms");

    if (versionEl) versionEl.textContent = "v" + data.version;
    if (dateEl) dateEl.textContent = data.pub_date ? formatDate(data.pub_date) : "";

    // Keep both channels consistent: primary CTA goes to GitHub release page.
    var forceGithubPrimary = prefix === "stable" || prefix === "dev";
    var osDownload = pickDownloadForOS(data.downloads, os);
    if (primaryBtn && !forceGithubPrimary && osDownload) {
      primaryBtn.href = osDownload.url;
      var sizeStr = formatSize(osDownload.size);
      if (primaryOS) {
        primaryOS.textContent = "\u4e0b\u8f7d OpenAkita v" + data.version;
      }
      if (primaryMeta) {
        primaryMeta.textContent = (OS_LABELS[os] || "") + (sizeStr ? " \u00b7 " + sizeStr : "");
      }
    } else if (primaryBtn) {
      primaryBtn.href = "https://github.com/openakita/openakita/releases/tag/v" + data.version;
      if (primaryOS) primaryOS.textContent = "\u524d\u5f80 GitHub \u4e0b\u8f7d v" + data.version;
      if (primaryMeta) primaryMeta.textContent = "";
    }

    if (platformsEl) {
      platformsEl.innerHTML = "";
      var links = getAllPlatformLinks(data.downloads, os, forceGithubPrimary);
      links.forEach(function(link) {
        if (link.isCurrent && !link.includeCurrent) return;
        var a = document.createElement("a");
        a.href = link.url;
        a.textContent = link.label;
        platformsEl.appendChild(a);
      });
    }
  }

  async function fetchManifest(url) {
    try {
      var res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return await res.json();
    } catch (e) { /* ignore */ }
    return null;
  }

  async function fetchGHRelease(prerelease) {
    try {
      var url = prerelease
        ? "https://api.github.com/repos/openakita/openakita/releases"
        : "https://api.github.com/repos/openakita/openakita/releases/latest";
      var res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      var data = await res.json();
      if (prerelease) {
        return Array.isArray(data) ? data[0] : null;
      }
      return data;
    } catch (e) { return null; }
  }

  async function loadLatestRelease() {
    if (!document.getElementById("devDownloadSection") &&
        !document.getElementById("stableDownloadSection") &&
        !document.getElementById("latestReleaseVersion")) {
      return;
    }

    var os = detectOS();

    // Fetch both manifests from OSS (primary) with local fallback
    var OSS_BASE = "https://dl-openakita.fzstack.com";
    var results = await Promise.allSettled([
      fetchManifest(OSS_BASE + "/api/pre-release.json"),
      fetchManifest(OSS_BASE + "/api/release.json"),
    ]);

    var devManifest = results[0].status === "fulfilled" ? results[0].value : null;
    var stableManifest = results[1].status === "fulfilled" ? results[1].value : null;

    // pre-release: pre-release.json from OSS, fallback to GitHub API
    if (!devManifest || !devManifest.version || !devManifest.downloads || Object.keys(devManifest.downloads).length === 0) {
      var ghDev = await fetchGHRelease(true);
      if (ghDev) {
        var devDownloads = buildDownloadURLsFromGH(ghDev.tag_name, ghDev.assets || []);
        devManifest = {
          version: (ghDev.tag_name || "").replace(/^v/, ""),
          pub_date: ghDev.published_at || "",
          notes: ghDev.body || "",
          downloads: devDownloads,
        };
      }
    }

    // release: release.json from OSS, fallback to GitHub API (latest non-prerelease)
    if (!stableManifest || !stableManifest.version || !stableManifest.downloads || Object.keys(stableManifest.downloads).length === 0) {
      var ghStable = await fetchGHRelease(false);
      if (ghStable && !ghStable.prerelease) {
        var stableDownloads = buildDownloadURLsFromGH(ghStable.tag_name, ghStable.assets || []);
        stableManifest = {
          version: (ghStable.tag_name || "").replace(/^v/, ""),
          pub_date: ghStable.published_at || "",
          notes: ghStable.body || "",
          downloads: stableDownloads,
        };
      } else {
        stableManifest = null;
      }
    }

    // If versions are the same, only show one
    if (devManifest && stableManifest && devManifest.version === stableManifest.version) {
      stableManifest = null;
    }

    // Render channels
    renderChannel("dev", devManifest, os);
    renderChannel("stable", stableManifest, os);

    // Update legacy elements (home page hero version badge etc.)
    var displayManifest = devManifest || stableManifest;
    var versionNode = document.getElementById("latestReleaseVersion");
    var dateNode = document.getElementById("latestReleaseDate");
    if (versionNode && displayManifest) versionNode.textContent = "v" + displayManifest.version;
    if (dateNode && displayManifest) dateNode.textContent = displayManifest.pub_date ? formatDate(displayManifest.pub_date) : "--";

    // Release data is async and may inject content after a language switch.
    // Re-run auto translation to keep dynamic text in the selected locale.
    void autoTranslateSiteContent();
  }

  loadLatestRelease();
  void autoTranslateSiteContent();
})();
