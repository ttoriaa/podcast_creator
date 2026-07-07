(function () {
  const core = window.StudioCore;
  const data = window.StudioData;

  core.activeNav("publish");

  const draft = core.getScriptDraft();
  const selectedTopicId = core.getSelectedTopic();
  const topic = data.topics.find((t) => t.id === selectedTopicId) || data.topics[0];

  core.getById("publishTopic").textContent = topic.title;
  core.getById("metaSummary").textContent = draft
    ? draft.replace(/\n+/g, " ").slice(0, 120) + (draft.length > 120 ? "..." : "")
    : "暂无逐字稿，请先在 Scripts 页面生成内容。";

  const channelRoot = core.getById("channelList");
  data.publish.channels.forEach((ch) => {
    channelRoot.appendChild(core.el("span", "badge", ch));
  });

  const checklistRoot = core.getById("checklist");
  const progressBar = core.getById("publishProgress");
  const progressText = core.getById("publishProgressText");
  const publishBtn = core.getById("publishBtn");
  const stateRoot = core.getById("stateFlow");
  const finalState = core.getById("finalState");

  const state = core.loadState();
  const saved = state.publishChecklist || {};
  const items = data.publish.checklist.map((item) => {
    if (typeof saved[item.id] === "boolean") {
      return Object.assign({}, item, { done: saved[item.id] });
    }
    return Object.assign({}, item, { done: false });
  });

  function persistChecklist() {
    const patch = {};
    items.forEach((item) => {
      patch[item.id] = item.done;
    });
    core.saveState({ publishChecklist: patch });
  }

  function renderStateFlow(doneRequired) {
    stateRoot.innerHTML = "";
    const steps = data.publish.states;
    const activeIndex = doneRequired === 0 ? steps.length - 1 : Math.min(steps.length - 2, 2 + (items.filter((i) => i.done).length % 3));
    steps.forEach((name, idx) => {
      const row = core.el("div", `state-item${idx <= activeIndex ? " done" : ""}`);
      const left = core.el("strong", "", name);
      const right = core.el("span", "small", idx <= activeIndex ? "ready" : "pending");
      row.appendChild(left);
      row.appendChild(right);
      stateRoot.appendChild(row);
    });
    finalState.textContent = doneRequired === 0 ? "已达到可发布状态" : "仍有必填项未完成";
  }

  function renderChecklist() {
    checklistRoot.innerHTML = "";
    items.forEach((item) => {
      const row = core.el("label", `task-item${item.done ? " done" : ""}`);
      const cb = core.el("input");
      cb.type = "checkbox";
      cb.checked = item.done;
      cb.addEventListener("change", () => {
        item.done = cb.checked;
        persistChecklist();
        renderChecklist();
      });

      const text = core.el("span", "", item.text);
      const badge = core.el("b", "", item.required ? "required" : "optional");
      row.appendChild(cb);
      row.appendChild(text);
      row.appendChild(badge);
      checklistRoot.appendChild(row);
    });

    const required = items.filter((i) => i.required);
    const doneRequired = required.filter((i) => i.done).length;
    const percent = required.length ? Math.round((doneRequired / required.length) * 100) : 0;
    progressBar.style.width = core.fmtPercent(percent);
    progressText.textContent = `${doneRequired}/${required.length} 必填项完成`;

    const remaining = required.length - doneRequired;
    publishBtn.disabled = remaining > 0;
    publishBtn.textContent = remaining > 0 ? `还差 ${remaining} 项` : "执行发布";

    renderStateFlow(remaining);
  }

  publishBtn.addEventListener("click", () => {
    if (publishBtn.disabled) return;
    core.saveState({
      lastPublishAt: new Date().toISOString(),
      publishedTopicId: topic.id
    });
    alert("发布任务已创建：已写入本地状态，可继续接入真实分发 API。");
  });

  renderChecklist();
})();
