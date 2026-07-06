(function () {
  const core = window.StudioCore;
  const data = window.StudioData;

  core.activeNav("scripts");

  const topicId = core.getSelectedTopic();
  const topic = data.topics.find((t) => t.id === topicId) || data.topics[0];

  core.getById("scriptTopic").textContent = topic.title;
  core.getById("scriptTags").innerHTML = "";
  topic.tags.forEach((tag) => {
    core.getById("scriptTags").appendChild(core.el("span", "badge", tag));
  });

  const textarea = core.getById("scriptEditor");
  const status = core.getById("saveStatus");
  const versions = core.getById("versionList");
  const tone = core.getById("toneSelect");

  const savedDraft = core.getScriptDraft();
  if (savedDraft) {
    textarea.value = savedDraft;
  } else {
    textarea.value = [
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

  let timer = null;

  function saveDraft() {
    core.setScriptDraft(textarea.value);
    status.textContent = `已保存 ${new Date().toLocaleTimeString()}`;
  }

  textarea.addEventListener("input", () => {
    status.textContent = "编辑中...";
    clearTimeout(timer);
    timer = setTimeout(saveDraft, 400);
  });

  core.getById("addBlockBtn").addEventListener("click", () => {
    textarea.value += "\n\n新增段落：\n";
    textarea.focus();
    saveDraft();
  });

  core.getById("toneApplyBtn").addEventListener("click", () => {
    const mode = tone.value;
    let hint = "";
    if (mode === "casual") hint = "\n\n[语气提示] 用更口语、更贴近聊天的表达重写上一段。";
    if (mode === "professional") hint = "\n\n[语气提示] 用更结构化、逻辑更清晰的方式重写上一段。";
    if (mode === "warm") hint = "\n\n[语气提示] 保留信息密度，同时增强亲和力和陪伴感。";
    textarea.value += hint;
    saveDraft();
  });

  const state = core.loadState();
  const savedVersions = state.scriptVersions || [];

  function persistVersions(next) {
    core.saveState({ scriptVersions: next });
  }

  function renderVersions() {
    versions.innerHTML = "";
    if (!savedVersions.length) {
      versions.appendChild(core.el("li", "", "还没有版本快照，点击“保存快照”创建 v1。"));
      return;
    }
    savedVersions.forEach((v) => {
      const li = core.el("li", "");
      li.textContent = `${v.name} · ${v.time}`;
      versions.appendChild(li);
    });
  }

  core.getById("snapshotBtn").addEventListener("click", () => {
    const idx = savedVersions.length + 1;
    savedVersions.unshift({
      name: `v${idx}`,
      time: new Date().toLocaleString(),
      content: textarea.value
    });
    if (savedVersions.length > 8) savedVersions.pop();
    persistVersions(savedVersions);
    renderVersions();
    status.textContent = `已创建快照 v${idx}`;
  });

  core.getById("toPublishBtn").addEventListener("click", () => {
    saveDraft();
    window.location.href = "publish.html";
  });

  renderVersions();
  saveDraft();
})();
