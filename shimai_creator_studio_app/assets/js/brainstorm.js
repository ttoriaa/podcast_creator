(function () {
  const core = window.StudioCore;
  const data = window.StudioData;

  core.activeNav("brainstorm");

  const list = core.getById("topicList");
  const tagFilter = core.getById("tagFilter");
  const sortBy = core.getById("sortBy");
  const detail = {
    title: core.getById("topicTitle"),
    summary: core.getById("topicSummary"),
    audience: core.getById("topicAudience"),
    evidence: core.getById("topicEvidence"),
    risk: core.getById("topicRisk"),
    outline: core.getById("topicOutline"),
    badges: core.getById("topicBadges")
  };

  const allTags = new Set();
  data.topics.forEach((topic) => topic.tags.forEach((tag) => allTags.add(tag)));
  Array.from(allTags).forEach((tag) => {
    const option = core.el("option", "", tag);
    option.value = tag;
    tagFilter.appendChild(option);
  });

  let activeTopicId = core.getSelectedTopic() || data.topics[0].id;

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
    let topics = data.topics.slice();
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

    const active = data.topics.find((t) => t.id === activeTopicId);
    if (active) renderDetail(active);
  }

  core.getById("useTopicBtn").addEventListener("click", () => {
    const topic = data.topics.find((t) => t.id === activeTopicId);
    if (!topic) return;
    core.setSelectedTopic(topic.id);
    const draft = [
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
    core.setScriptDraft(draft);
    window.location.href = "scripts.html";
  });

  tagFilter.addEventListener("change", renderList);
  sortBy.addEventListener("change", renderList);
  renderList();
})();
