export const validSiteContent = {
  profile: {
    name: "江俊杰",
    technicalId: "cxzg007",
    targetRole: "AI Agent / 后端开发",
    positioning: "关注可靠 AI 应用与后端系统设计。",
    recruitingStatus: "2027 届校招｜AI Agent / 后端开发",
    education: [
      {
        school: "同济大学",
        major: "电子信息",
        degree: "硕士（推免）",
        graduationYear: 2027,
        highlights: ["推免"],
      },
    ],
    email: "jiangjunjie_tj@foxmail.com",
    github: "https://github.com/cxzg007",
  },
  metrics: [
    {
      label: "实习经历",
      value: 3,
      suffix: "段",
      evidence: "简历列出三段实习。",
    },
    {
      label: "Semantica PR",
      value: 7,
      suffix: "个",
      evidence: "GitHub 查询于 2026-08-21 返回七个 PR。",
    },
  ],
  internships: [
    {
      id: "jd-ontology-platform",
      company: "京东",
      team: "AI 数据智能平台",
      role: "后端开发实习生",
      period: "2026-07 – 至今",
      context: "建设 AI 数据智能平台。",
      actions: ["治理本体映射。"],
      results: ["形成绑定生命周期。"],
      ownership: "负责本体映射治理。",
      stack: ["Java"],
      status: "Shipped",
    },
  ],
  caseStudies: [
    {
      id: "ontology-agent-platform",
      title: "本体驱动的 Agent 数据智能平台",
      problem: "LLM 缺乏稳定的业务语义上下文。",
      constraints: ["物理 Schema 持续变化。"],
      decisions: ["用本体语义层隔离业务概念。"],
      tradeoffs: ["以受控模型换取可验证性。"],
      contribution: "负责本体映射治理。",
      result: "形成受控的 Agent 业务执行链路。",
      stack: ["Java"],
      links: [],
    },
  ],
  about: ["同济大学电子信息硕士。"],
};
