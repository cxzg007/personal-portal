import type { PostMeta } from "@/content/posts";
import type { SiteContent } from "@/content/schema";

/**
 * 潜空间终端的检索索引。
 *
 * 这里不接任何模型。问一句话之后真正发生的是确定性检索：查询串归一化后，
 * 一边比对条目的别名，一边用中文二元组和拉丁词在正文里找重叠，按分数排序。
 * 之所以不引入分词库或向量检索：内容总量只有几十条，别名又是人写的，
 * 多一个依赖换不来可感知的准确率，却会让首屏和构建都变重。
 *
 * 内容来源只有 content/site-content.json 和 MDX 博客，索引在服务端构建，
 * 终端界面拿到的是同一份事实，不存在第二份文案。
 */

/**
 * 五个内容域。写成 const 数组而不是联合类型，是因为消息桥要在运行时校验
 * 外部传进来的域名，类型在那儿已经被擦掉了，必须有一份能遍历的清单。
 */
export const LATENT_DOMAINS = [
  "profile",
  "internship",
  "system",
  "open-source",
  "writing",
] as const;

export type LatentDomain = (typeof LATENT_DOMAINS)[number];

/**
 * 内容域落在三维结构的第几层，从 1 数起。
 *
 * 场景那边的 LAYERS 读这张表来决定哪一层绑哪个域，终端里的索引页也读它来标注
 * 层号——两处说的必须是同一件事，所以绑定关系只能有一份。前两层在终端面板前方，
 * 是这句话还没进去时待的位置，不绑内容，所以这里从 3 开始。
 */
export const DOMAIN_LAYER: Record<LatentDomain, number> = {
  profile: 3,
  internship: 4,
  system: 5,
  "open-source": 6,
  writing: 7,
};

/** 界面上给访客看的域名。三维场景的那几层也用这套叫法，两边说的是一回事。 */
export const DOMAIN_LABEL: Record<LatentDomain, string> = {
  profile: "身份",
  internship: "实习",
  system: "系统",
  "open-source": "开源",
  writing: "博客",
};

export type LatentEntry = {
  id: string;
  domain: LatentDomain;
  title: string;
  subtitle: string;
  /** 直接读给访客的正文，已经是完整句子，不需要再拼。 */
  lines: string[];
  /** 人工指定的别名，命中权重最高。 */
  keywords: string[];
  /** 站内正本的位置，回答里给出，让人能跳去读全文。 */
  href: string;
  /** 参与模糊匹配的正文，建索引时拼好，检索时不再重算。 */
  haystack: string;
};

export type LatentHit = {
  entry: LatentEntry;
  score: number;
  /** 实际命中的别名，用于在界面上说明"为什么是这条"。 */
  matched: string[];
};

/** 域名级别的通用问法，挂到每个条目上，"讲讲你的实习"这类问题才有着落。 */
const DOMAIN_ALIASES: Record<LatentDomain, string[]> = {
  // 别名要按人真的会怎么问来写："联系方式"不是"怎么联系你"的子串，短的那个才管用
  profile: ["你是谁", "自我介绍", "简历", "联系", "邮箱", "学校", "github", "profile"],
  internship: ["实习", "工作经历", "经历", "intern", "internship", "公司"],
  system: ["系统", "架构", "系统设计", "项目", "design", "architecture"],
  "open-source": ["开源", "贡献", "维护者", "open source", "pr", "merge"],
  writing: ["博客", "文章", "写作", "blog", "post", "写了什么"],
};

/**
 * 这些词几乎出现在每一句提问里，留着只会让所有条目一起涨分，
 * 相当于没有排序，所以在模糊匹配阶段剔掉。
 */
const STOP_GRAMS = new Set([
  "你的", "我的", "什么", "怎么", "如何", "哪些", "一下", "介绍", "讲讲", "说说",
  "可以", "能不", "不能", "是什", "么样", "有没", "没有", "请问", "告诉",
]);

const CJK = /[\u4e00-\u9fff]/;

export function normalize(input: string): string {
  return input
    .toLowerCase()
    // 标点和空白一律去掉：提问里的"，""?"不该影响匹配
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

/** 中文没有空格，退而求其次用二元组：覆盖"京东""本体""回放"这类两字词已经够了。 */
function bigrams(normalized: string): string[] {
  const grams: string[] = [];
  for (let i = 0; i < normalized.length - 1; i += 1) {
    const gram = normalized.slice(i, i + 2);
    if (!CJK.test(gram)) continue;
    if (STOP_GRAMS.has(gram)) continue;
    grams.push(gram);
  }
  return [...new Set(grams)];
}

/** 拉丁词按空格和标点切，长度小于 2 的丢掉（"ai" 要留，所以不是 3）。 */
function latinTerms(query: string): string[] {
  const terms = query.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]*/g) ?? [];
  return [...new Set(terms.filter((term) => term.length >= 2))];
}

function entry(input: Omit<LatentEntry, "haystack"> & { extra?: string[] }): LatentEntry {
  const { extra = [], ...rest } = input;
  return {
    ...rest,
    haystack: normalize([rest.title, rest.subtitle, ...rest.lines, ...rest.keywords, ...extra].join(" ")),
  };
}

export function buildLatentIndex(content: SiteContent, posts: PostMeta[]): LatentEntry[] {
  const entries: LatentEntry[] = [];

  entries.push(
    entry({
      id: "profile",
      domain: "profile",
      title: `${content.profile.name} · ${content.profile.technicalId}`,
      subtitle: content.profile.targetRole,
      lines: [
        content.profile.positioning,
        `可以直接写信到 ${content.profile.email}，代码都在 ${content.profile.github}。`,
      ],
      keywords: [
        content.profile.name,
        content.profile.technicalId,
        content.profile.targetRole,
        ...DOMAIN_ALIASES.profile,
      ],
      href: "/#top",
      extra: content.profile.education.map((item) => `${item.school} ${item.major} ${item.degree}`),
    }),
  );

  for (const item of content.internships) {
    entries.push(
      entry({
        id: item.id,
        domain: "internship",
        title: `${item.company} · ${item.team}`,
        subtitle: `${item.role} · ${item.period}`,
        lines: [item.valueHeadline, ...item.results.slice(0, 2)],
        keywords: [
          item.company,
          item.team,
          item.role,
          ...item.stack,
          ...item.presentation.technologies,
          ...DOMAIN_ALIASES.internship,
        ],
        href: "/#internships",
        extra: [item.context, ...item.actions, ...item.highlights, item.ownership],
      }),
    );
  }

  for (const study of content.caseStudies) {
    entries.push(
      entry({
        id: study.id,
        domain: "system",
        title: study.title,
        subtitle: study.tabLabel,
        lines: [study.problem, ...study.decisions.slice(0, 2)],
        keywords: [study.tabLabel, ...study.stack, ...DOMAIN_ALIASES.system],
        href: "/#systems",
        extra: [...study.constraints, ...study.tradeoffs],
      }),
    );
  }

  const openSource = content.openSource;
  entries.push(
    entry({
      id: "open-source-overview",
      domain: "open-source",
      title: `${openSource.name} · ${openSource.identity}`,
      subtitle: openSource.roleSummary,
      lines: [
        openSource.background,
        `截至 ${openSource.snapshotDate}，已合入 ${openSource.contributions.filter((item) => item.status === "merged").length} 个 PR。`,
      ],
      keywords: [openSource.name, openSource.identity, ...DOMAIN_ALIASES["open-source"]],
      href: "/#open-source",
      extra: [openSource.repositoryUrl],
    }),
  );

  for (const theme of openSource.contributionThemes) {
    const prs = openSource.contributions.filter((item) => theme.prNumbers.includes(item.number));
    entries.push(
      entry({
        id: `open-source-${theme.id}`,
        domain: "open-source",
        title: `${openSource.name} · ${theme.name}`,
        subtitle: `${prs.length} 个 PR`,
        lines: [theme.summary, ...prs.slice(0, 2).map((item) => `#${item.number} ${item.title}`)],
        keywords: [
          theme.name,
          openSource.name,
          ...theme.prNumbers.map((number) => `#${number}`),
          ...DOMAIN_ALIASES["open-source"],
        ],
        href: "/#open-source",
        extra: prs.map((item) => item.title),
      }),
    );
  }

  for (const post of posts) {
    entries.push(
      entry({
        id: `post-${post.slug}`,
        domain: "writing",
        title: post.title,
        subtitle: `${post.readingMinutes} 分钟阅读 · ${post.publishedAt}`,
        lines: [post.description],
        keywords: [...post.tags, ...DOMAIN_ALIASES.writing],
        href: `/blog/${post.slug}`,
        extra: post.headings.map((heading) => heading.text),
      }),
    );
  }

  return entries;
}

/**
 * 打分：别名命中最重，中文二元组其次，拉丁词再次。
 * 二元组整体设了上限，否则一段长提问光靠泛泛的字就能压过真正的别名命中。
 */
export function searchLatent(index: LatentEntry[], query: string, limit = 3): LatentHit[] {
  const normalized = normalize(query);
  if (normalized.length === 0) return [];

  const grams = bigrams(normalized);
  const terms = latinTerms(query);

  const hits: LatentHit[] = [];
  for (const item of index) {
    const matched: string[] = [];
    let score = 0;

    for (const keyword of item.keywords) {
      const key = normalize(keyword);
      if (key.length < 2) continue;
      if (!normalized.includes(key)) continue;
      matched.push(keyword);
      // 越长的别名越具体，"数据智能平台"命中显然比"公司"更能说明问题
      score += 6 + Math.min(key.length, 6);
    }

    let gramScore = 0;
    for (const gram of grams) {
      if (item.haystack.includes(gram)) gramScore += 1;
    }
    score += Math.min(gramScore, 8);

    for (const term of terms) {
      if (item.haystack.includes(term)) score += 3;
    }

    if (score > 0) hits.push({ entry: item, score, matched: [...new Set(matched)] });
  }

  return hits
    // 同分时按索引顺序排，保证同一个问题每次得到同一个答案
    .sort((a, b) => b.score - a.score || index.indexOf(a.entry) - index.indexOf(b.entry))
    .filter((hit) => hit.score >= 6)
    .slice(0, limit);
}

/** 命中的内容域，按首次出现排序，三维场景据此决定点亮哪几层。 */
export function hitDomains(hits: LatentHit[]): LatentDomain[] {
  return [...new Set(hits.map((hit) => hit.entry.domain))];
}
