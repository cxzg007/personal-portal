import type { SiteContent } from "@/content/schema";

type CaseStudiesProps = {
  caseStudies: SiteContent["caseStudies"];
};

function ArchitectureConnector() {
  return (
    <svg aria-hidden="true" className="architecture-connector" focusable="false" viewBox="0 0 64 12">
      <path d="M1 6h56" />
      <path d="m52 1 6 5-6 5" />
    </svg>
  );
}

export function CaseStudies({ caseStudies }: CaseStudiesProps) {
  return (
    <div className="case-study-list">
      {caseStudies.map((caseStudy, index) => {
        const headingId = `case-${caseStudy.id}-heading`;

        return (
          <article aria-labelledby={headingId} className="case-study" key={caseStudy.id}>
            <header className="case-study-header">
              <span aria-hidden="true">CASE {String(index + 1).padStart(2, "0")}</span>
              <h3 id={headingId}>{caseStudy.title}</h3>
              <ul aria-label={`${caseStudy.title} 技术栈`} className="technology-list">
                {caseStudy.stack.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            </header>

            <div className="case-study-narrative">
              <section className="narrative-block narrative-problem">
                <h4>问题</h4>
                <p>{caseStudy.problem}</p>
              </section>
              <section className="narrative-block">
                <h4>约束</h4>
                <ul>
                  {caseStudy.constraints.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </section>
              <section className="narrative-block">
                <h4>决策</h4>
                <ul>
                  {caseStudy.decisions.map((decision) => (
                    <li key={decision}>{decision}</li>
                  ))}
                </ul>
              </section>
              <section className="narrative-block">
                <h4>权衡</h4>
                <ul>
                  {caseStudy.tradeoffs.map((tradeoff) => (
                    <li key={tradeoff}>{tradeoff}</li>
                  ))}
                </ul>
              </section>
              <section className="narrative-block narrative-contribution">
                <h4>个人贡献</h4>
                <p>{caseStudy.contribution}</p>
              </section>
              <section className="narrative-block narrative-result">
                <h4>结果</h4>
                <p>{caseStudy.result}</p>
              </section>
            </div>

            <section className="architecture-section">
              <h4>架构链路</h4>
              <div
                aria-label={`${caseStudy.title} 静态架构链路`}
                className="architecture-diagram"
                role="img"
              >
                <ol className="architecture-flow">
                  <li className="architecture-node">
                    <span>输入约束</span>
                    <p>{caseStudy.constraints[0]}</p>
                  </li>
                  <li aria-hidden="true" className="architecture-connector-item">
                    <ArchitectureConnector />
                  </li>
                  <li className="architecture-node architecture-node-primary">
                    <span>工程决策</span>
                    <p>{caseStudy.decisions[0]}</p>
                  </li>
                  <li aria-hidden="true" className="architecture-connector-item">
                    <ArchitectureConnector />
                  </li>
                  <li className="architecture-node">
                    <span>可验证结果</span>
                    <p>{caseStudy.result}</p>
                  </li>
                </ol>
              </div>
            </section>

            {caseStudy.links.length > 0 ? (
              <nav aria-label={`${caseStudy.title} 公开资料`} className="case-study-links">
                {caseStudy.links.map((link) => (
                  <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </nav>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
