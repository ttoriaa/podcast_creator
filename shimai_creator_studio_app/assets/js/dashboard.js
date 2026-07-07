(function () {
  const core = window.StudioCore;
  const data = window.StudioData;

  core.activeNav("dashboard");

  const metricsRoot = core.getById("metricsGrid");
  data.dashboard.metrics.forEach((m) => {
    const card = core.el("article", "metric");
    const strong = core.el("strong", "", m.value);
    const span = core.el("span", "", m.label);
    card.appendChild(strong);
    card.appendChild(span);
    metricsRoot.appendChild(card);
  });

  const state = core.loadState();
  const saved = state.dashboardTasks || {};
  const tasks = data.dashboard.tasks.map((task) => {
    if (typeof saved[task.id] === "boolean") {
      return Object.assign({}, task, { done: saved[task.id] });
    }
    return task;
  });

  const tasksRoot = core.getById("taskList");
  const counter = core.getById("taskCounter");
  const filter = core.getById("taskFilter");

  function persistTaskState() {
    const patch = {};
    tasks.forEach((task) => {
      patch[task.id] = task.done;
    });
    core.saveState({ dashboardTasks: patch });
  }

  function renderTasks() {
    tasksRoot.innerHTML = "";
    const mode = filter.value;
    const visible = tasks.filter((t) => {
      if (mode === "todo") return !t.done;
      if (mode === "done") return t.done;
      return true;
    });

    visible.forEach((task) => {
      const row = core.el("label", `task-item${task.done ? " done" : ""}`);
      const cb = core.el("input");
      cb.type = "checkbox";
      cb.checked = task.done;
      cb.addEventListener("change", () => {
        task.done = cb.checked;
        persistTaskState();
        renderTasks();
      });

      const text = core.el("span", "", task.text);
      const owner = core.el("b", "", task.owner);
      row.appendChild(cb);
      row.appendChild(text);
      row.appendChild(owner);
      tasksRoot.appendChild(row);
    });

    const doneCount = tasks.filter((t) => t.done).length;
    counter.textContent = `${doneCount}/${tasks.length} 已完成`;
  }

  filter.addEventListener("change", renderTasks);
  renderTasks();

  const riskList = core.getById("riskList");
  data.dashboard.risks.forEach((risk) => {
    const li = core.el("li", "", risk);
    riskList.appendChild(li);
  });
})();
