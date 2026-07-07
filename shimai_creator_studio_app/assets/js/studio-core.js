(function () {
  const STORAGE_KEY = "shimai_creator_studio_state";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(patch) {
    const oldState = loadState();
    const next = Object.assign({}, oldState, patch || {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function getSelectedTopic() {
    const state = loadState();
    return state.selectedTopicId || null;
  }

  function setSelectedTopic(topicId) {
    saveState({ selectedTopicId: topicId });
  }

  function setScriptDraft(content) {
    saveState({ scriptDraft: content, updatedAt: new Date().toISOString() });
  }

  function getScriptDraft() {
    const state = loadState();
    return state.scriptDraft || "";
  }

  function normalizeApiBase(raw) {
    const value = (raw || "").trim();
    if (!value) return "";
    return value.replace(/\/+$/, "");
  }

  function getApiBase() {
    const params = new URLSearchParams(window.location.search || "");
    const fromQuery = normalizeApiBase(params.get("api_base") || "");
    if (fromQuery) {
      saveState({ apiBase: fromQuery });
      return fromQuery;
    }

    const state = loadState();
    const fromState = normalizeApiBase(state.apiBase || "");
    if (fromState) return fromState;

    const fromWindow = normalizeApiBase(window.STUDIO_API_BASE || "");
    if (fromWindow) return fromWindow;

    return "http://127.0.0.1:8000";
  }

  function setApiBase(baseUrl) {
    const normalized = normalizeApiBase(baseUrl);
    if (!normalized) return;
    saveState({ apiBase: normalized });
  }

  function getById(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function fmtPercent(value) {
    return `${Math.max(0, Math.min(100, value))}%`;
  }

  function activeNav(page) {
    document.querySelectorAll(".nav-link").forEach((a) => {
      const target = a.getAttribute("data-page");
      a.classList.toggle("active", target === page);
    });
  }

  window.StudioCore = {
    loadState,
    saveState,
    getSelectedTopic,
    setSelectedTopic,
    setScriptDraft,
    getScriptDraft,
    getApiBase,
    setApiBase,
    getById,
    el,
    fmtPercent,
    activeNav
  };
})();
