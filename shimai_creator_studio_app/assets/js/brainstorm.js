(function () {
  const core = window.StudioCore;
  const data = window.StudioData;
  const API_BASE = core.getApiBase();

  core.activeNav("brainstorm");

  const list = core.getById("topicList");
  const tagFilter = core.getById("tagFilter");
  const sortBy = core.getById("sortBy");
  const status = core.getById("brainstormStatus");
  const rssUrlInput = core.getById("rssUrlInput");
  const detail = {
    title: core.getById("topicTitle"),
    summary: core.getById("topicSummary"),
    audience: core.getById("topicAudience"),
    evidence: core.getById("topicEvidence"),
    risk: core.getById("topicRisk"),
    outline: core.getById("topicOutline"),
    badges: core.getById("topicBadges")
  };
  const state = core.loadState();
  const savedTopics = Array.isArray(state.generatedTopics) ? state.generatedTopics : [];
  let topicSource = savedTopics.length ? "glm" : "local";
  let topicsStore = (savedTopics.length ? savedTopics : data.topics).map(normalizeTopic);

  if (state.lastRssUrl) rssUrlInput.value = state.lastRssUrl;

  let activeTopicId = core.getSelectedTopic() || (topicsStore[0] && topicsStore[0].id);

  function normalizeTopic(topic, idx) {
    const scores = topic && topic.scores ? topic.scores : {};
    return {
      id: (topic && topic.id) || `topic-${idx + 1}`,
      title: (topic && topic.title) || `候选选题 ${idx + 1}`,
      summary: (topic && topic.summary) || "",
      audience: (topic && topic.audience) || "",
      evidence: (topic && topic.evidence) || "",
      risk: (topic && topic.risk) || "",
      scores: {
        novelty: Number(scores.novelty || 0),
        resonance: Number(scores.resonance || 0),
        story: Number(scores.story || 0)
      },
      tags: Array.isArray(topic && topic.tags) ? topic.tags : [],
      outline: Array.isArray(topic && topic.outline) ? topic.outline : []
    };
  }

  function rebuildTagFilter() {
    const currentTag = tagFilter.value;
    tagFilter.innerHTML = "<option value=\"\">全部标签</option>";
    const allTags = new Set();
    topicsStore.forEach((topic) => topic.tags.forEach((tag) => allTags.add(tag)));
    Array.from(allTags)
      .sort()
      .forEach((tag) => {
        const option = core.el("option", "", tag);
        option.value = tag;
        tagFilter.appendChild(option);
      });
    if (currentTag && allTags.has(currentTag)) {
      tagFilter.value = currentTag;
    }
  }

  function sortTopics(items) {
    const key = sortBy.value;
    const cloned = items.slice();
    if (key === "novelty") cloned.sort((a, b) => b.scores.novelty - a.scores.novelty);
    if (key === "resonance") cloned.sort((a, b) => b.scores.resonance - a.scores.resonance);
    if (key === "story") cloned.sort((a, b) => b.scores.story - a.scores.story);
    return cloned;
  }

  function renderDetail(topic) {
    detail.title.textContent = topic.title;
    detail.summary.textContent = topic.summary;
    detail.audience.textContent = topic.audience;
    detail.evidence.textContent = topic.evidence;
    detail.risk.textContent = topic.risk;

    detail.badges.innerHTML = "";
    topic.tags.forEach((tag) => {
      const b = core.el("span", "badge", tag);
      detail.badges.appendChild(b);
    });

    detail.outline.innerHTML = "";
    topic.outline.forEach((line) => {
      detail.outline.appendChild(core.el("li", "", line));
    });
  }

  function renderList() {
    list.innerHTML = "";
    let topics = topicsStore.slice();
    const tag = tagFilter.value;
    if (tag) topics = topics.filter((t) => t.tags.includes(tag));
    topics = sortTopics(topics);

    if (!topics.some((t) => t.id === activeTopicId)) {
      activeTopicId = topics.length ? topics[0].id : "";
    }

    topics.forEach((topic) => {
      const card = core.el("article", `topic-card${topic.id === activeTopicId ? " active" : ""}`);
      card.tabIndex = 0;
      const title = core.el("h4", "", topic.title);
      const summary = core.el("p", "", topic.summary);
      const scoreRow = core.el("div", "score-row");

      const s1 = core.el("span", "score", `新颖度 ${topic.scores.novelty}`);
      const s2 = core.el("span", "score", `共鸣度 ${topic.scores.resonance}`);
      const s3 = core.el("span", "score", `可讲述性 ${topic.scores.story}`);

      scoreRow.appendChild(s1);
      scoreRow.appendChild(s2);
      scoreRow.appendChild(s3);

      card.appendChild(title);
      card.appendChild(summary);
      card.appendChild(scoreRow);

      card.addEventListener("click", () => {
        activeTopicId = topic.id;
        core.setSelectedTopic(topic.id);
        renderList();
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
      list.appendChild(card);
    });

    const active = topicsStore.find((t) => t.id === activeTopicId);
    if (active) renderDetail(active);
  }

  function buildDraft(topic) {
    return [
      `# ${topic.title}`,
      "",
      ...topic.outline.map((line) => `- ${line}`),
      "",
      "开场正文：",
      "",
      "第一段正文：",
      "",
      "第二段正文：",
      "",
      "收尾正文："
    ].join("\n");
  }

  async function postJson(path, body) {
    const resp = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return resp.json();
  }

  async function syncRss() {
    const rssUrl = (rssUrlInput.value || "").trim();
    status.textContent = "正在同步 RSS...";
    try {
      const result = await postJson("/api/rss/sync", { rss_url: rssUrl || null, limit: 20 });
      core.saveState({ lastRssUrl: rssUrl });
      status.textContent = `RSS 同步成功：${result.count} 条节目。`;
    } catch (err) {
      status.textContent = "RSS 同步失败，请检查后端服务和 RSS 地址。";
    }
  }

  async function generateTopics() {
    const rssUrl = (rssUrlInput.value || "").trim();
    status.textContent = "正在调用后端生成选题...";
    try {
      const result = await postJson("/api/topics/generate", { rss_url: rssUrl || null, limit: 20 });
      const incoming = Array.isArray(result.topics) ? result.topics : [];
      if (!incoming.length) throw new Error("empty topics");
      topicsStore = incoming.map(normalizeTopic);
      topicSource = result.source || "glm";
      activeTopicId = topicsStore[0].id;
      core.saveState({
        generatedTopics: topicsStore,
        lastRssUrl: rssUrl,
        selectedTopicId: activeTopicId
      });
      rebuildTagFilter();
      renderList();
      status.textContent =
        topicSource === "glm"
          ? "已使用 GLM 生成选题。"
          : "模型不可用，已使用本地 fallback 选题。";
    } catch (err) {
      topicSource = "local";
      topicsStore = data.topics.map(normalizeTopic);
      activeTopicId = topicsStore[0] && topicsStore[0].id;
      rebuildTagFilter();
      renderList();
      status.textContent = "调用失败，已回退到本地模板选题。";
    }
  }

  core.getById("useTopicBtn").addEventListener("click", () => {
    const topic = topicsStore.find((t) => t.id === activeTopicId);
    if (!topic) return;
    core.saveState({
      selectedTopicId: topic.id,
      selectedTopicPayload: topic,
      selectedTopicSource: topicSource
    });
    core.setScriptDraft(buildDraft(topic));
    window.location.href = "scripts.html";
  });

  core.getById("rssSyncBtn").addEventListener("click", syncRss);
  core.getById("generateTopicsBtn").addEventListener("click", generateTopics);
  tagFilter.addEventListener("change", renderList);
  sortBy.addEventListener("change", renderList);

  rebuildTagFilter();
  renderList();
})();
