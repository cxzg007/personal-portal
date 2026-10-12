import { describe, expect, it } from "vitest";

import { getAllPosts } from "@/content/posts";
import { loadSiteContent } from "@/content/load-site-content";

import {
  DOMAIN_LABEL,
  DOMAIN_LAYER,
  LATENT_DOMAINS,
  buildLatentIndex,
  hitDomains,
  searchLatent,
} from "./latent-index";

const index = buildLatentIndex(loadSiteContent(), getAllPosts());

describe("内容域与结构层的绑定", () => {
  it("每个域都占一层，层号互不重复", () => {
    const layers = LATENT_DOMAINS.map((domain) => DOMAIN_LAYER[domain]);
    expect(new Set(layers).size).toBe(LATENT_DOMAINS.length);
    // 场景按 layer - 1 去取层下标，层号必须从 1 数起且落在七层之内
    for (const layer of layers) {
      expect(layer).toBeGreaterThanOrEqual(1);
      expect(layer).toBeLessThanOrEqual(7);
    }
  });

  it("每个域都有能读出来的名字", () => {
    for (const domain of LATENT_DOMAINS) {
      expect(DOMAIN_LABEL[domain]).toBeTruthy();
    }
  });
});

describe("潜空间检索索引", () => {
  it("把四类内容都收进来，且每条都能跳回站内正本", () => {
    const domains = new Set(index.map((entry) => entry.domain));
    expect(domains).toEqual(new Set(["profile", "internship", "system", "open-source", "writing"]));
    for (const entry of index) {
      expect(entry.href.startsWith("/")).toBe(true);
      expect(entry.lines.length).toBeGreaterThan(0);
    }
  });

  it("按公司名提问时命中对应那段实习", () => {
    const [top] = searchLatent(index, "你在京东做了什么");
    expect(top.entry.domain).toBe("internship");
    expect(top.entry.id).toBe("jd-ontology-platform");
    expect(top.matched).toContain("京东");
  });

  it("按技术词提问时命中用到它的那段经历", () => {
    const hits = searchLatent(index, "RAG 多智能体是怎么做的");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.entry.id === "cssc-722" || hit.entry.id === "rag-agent")).toBe(true);
  });

  it("按项目名提问时命中开源那组条目", () => {
    const hits = searchLatent(index, "Semantica 上你贡献了什么");
    expect(hits.length).toBeGreaterThan(0);
    expect(hitDomains(hits)).toContain("open-source");
  });

  it("泛泛地问博客也能落到文章上", () => {
    const hits = searchLatent(index, "你写过哪些博客");
    expect(hits.length).toBeGreaterThan(0);
    expect(hitDomains(hits)).toContain("writing");
  });

  it("问联系方式时落到个人条目上", () => {
    const [top] = searchLatent(index, "怎么联系你");
    expect(top.entry.domain).toBe("profile");
  });

  it("问到完全无关的事就老实返回空，不硬凑", () => {
    expect(searchLatent(index, "你会打篮球吗")).toEqual([]);
    expect(searchLatent(index, "   ")).toEqual([]);
  });

  it("同一个问题每次给出同一组结果，顺序也一致", () => {
    const once = searchLatent(index, "本体建模和规则引擎");
    const twice = searchLatent(index, "本体建模和规则引擎");
    expect(twice.map((hit) => hit.entry.id)).toEqual(once.map((hit) => hit.entry.id));
    expect(once.length).toBeGreaterThan(0);
  });

  it("别名命中压过泛泛的字面重叠", () => {
    const hits = searchLatent(index, "智元机器人的流式回放", 5);
    expect(hits[0].entry.id).toBe("agibot-agent");
  });
});
