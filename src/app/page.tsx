import { Hero } from "@/components/home/hero";
import { ImpactMetrics } from "@/components/home/impact-metrics";
import { Header } from "@/components/shell/header";
import { Section } from "@/components/shell/section";
import { loadSiteContent } from "@/content/load-site-content";

export default function HomePage() {
  const content = loadSiteContent();

  return (
    <div className="page-shell">
      <Header />
      <main id="main-content">
        <Hero profile={content.profile} />
        <ImpactMetrics metrics={content.metrics} />

        <Section eyebrow="01 / EXPERIENCE" id="internships" title="实习经历">
          <p className="section-preview">
            三段实习，聚焦本体语义层、机器人 Agent、流式数据后端与通信算法。
          </p>
        </Section>

        <Section eyebrow="02 / SYSTEM DESIGN" id="case-studies" title="后端工程与系统设计">
          <p className="section-preview">
            从 Agent 业务执行链路到知识图谱与流式回放，以可验证的工程决策呈现系统能力。
          </p>
        </Section>

        <Section eyebrow="03 / ABOUT" id="about" title="关于我">
          <p className="section-preview">{content.profile.positioning}</p>
        </Section>
      </main>
    </div>
  );
}
