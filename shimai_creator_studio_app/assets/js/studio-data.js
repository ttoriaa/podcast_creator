window.StudioData = {
  dashboard: {
    metrics: [
      { value: "12", label: "本周候选选题" },
      { value: "4", label: "待完成逐字稿" },
      { value: "3", label: "待发布集数" },
      { value: "97%", label: "RSS 同步成功率" }
    ],
    tasks: [
      { id: "t1", text: "确认 Vol38 选题方向和受众标签", owner: "运营", done: false },
      { id: "t2", text: "完成 Vol38 逐字稿 v0.3", owner: "主播", done: false },
      { id: "t3", text: "录制设备和环境检查", owner: "录音", done: true },
      { id: "t4", text: "剪辑点标注和封面标题", owner: "剪辑", done: false }
    ],
    risks: [
      "Vol37 缺少完整章节点，发布页会降级为手动填写。",
      "最近 24 小时 GLM 任务有 1 次超时，建议重试并检查 prompt 长度。",
      "有 2 条选题和历史内容重合度 > 80%，建议更换叙事切角。"
    ]
  },

  topics: [
    {
      id: "topic-1",
      title: "高敏感如何变成创造力资产",
      summary: "从 Vol18 延展，讨论高敏感在创作中的优势、边界和代价。",
      audience: "职场 20-35，重视自我成长",
      evidence: "命中 Vol18、Vol20、Vol29 的共性关键词：自我解释、关系边界、情绪命名。",
      risk: "容易落入鸡汤叙事，需要增加具体方法和反例。",
      scores: { novelty: 72, resonance: 88, story: 80 },
      tags: ["成长", "心理", "叙事"],
      outline: [
        "开场：为什么高敏感在 AI 时代反而可能是优势",
        "第一段：高敏感不是脆弱，是信息处理密度更高",
        "第二段：如何把感受力变成可执行习惯",
        "第三段：当高敏感过载时的自救策略",
        "收尾：给听众的 7 天小实验"
      ]
    },
    {
      id: "topic-2",
      title: "Solo Trip 里的关系边界练习",
      summary: "沿着 Vol35 的旅行叙事，讨论独处、关系和主体性。",
      audience: "刚进入职场的独立女性用户",
      evidence: "Vol35 完播率高，评论集中在关系独立与边界表达。",
      risk: "素材偏个人经验，需要补可迁移方法。",
      scores: { novelty: 68, resonance: 86, story: 90 },
      tags: ["旅行", "关系", "主体性"],
      outline: [
        "开场：为什么独自旅行会放大关系问题",
        "第一段：旅途中的孤独不是问题，而是镜子",
        "第二段：边界表达的三个等级",
        "第三段：回到日常如何继续练习",
        "收尾：给听众的边界表达模板"
      ]
    },
    {
      id: "topic-3",
      title: "Vibe Coding 时代的表达力训练",
      summary: "承接 Vol34，聚焦 AI 时代表达力对个人竞争力的影响。",
      audience: "内容创作者 / 开发者 / 新媒体运营",
      evidence: "Vol34 在社媒转发高，评论区大量提到表达焦虑。",
      risk: "技术内容和生活内容要平衡，不要过度工具化。",
      scores: { novelty: 84, resonance: 82, story: 76 },
      tags: ["AI", "表达", "效率"],
      outline: [
        "开场：为什么 AI 让表达力更稀缺",
        "第一段：表达不是输出，是思考结构",
        "第二段：用 Vibe Coding 训练表达肌肉",
        "第三段：从 prompt 到播客逐字稿的方法迁移",
        "收尾：本周表达训练计划"
      ]
    }
  ],

  publish: {
    channels: ["小宇宙", "Apple Podcast", "Spotify", "微信公众号"],
    checklist: [
      { id: "p1", text: "逐字稿定稿", required: true },
      { id: "p2", text: "音频母带导出", required: true },
      { id: "p3", text: "章节点和 shownotes", required: true },
      { id: "p4", text: "封面和标题", required: true },
      { id: "p5", text: "社媒分发文案", required: false }
    ],
    states: ["待确认脚本", "待录制", "待剪辑", "待审核", "待发布", "已发布"]
  }
};
