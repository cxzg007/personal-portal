import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

export function OpenSourceShowcase({ project }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");
  const capabilitiesById = new Map(
    project.architecture.capabilities.map((capability) => [capability.id, capability]),
  );
  const spanningCapabilities = project.architecture.spanningCapabilityIds
    .map((capabilityId) => capabilitiesById.get(capabilityId))
    .filter((capability) => capability !== undefined);

  return (
    <article aria-labelledby="open-source-showcase-heading" className="open-source-showcase">
      <header className="open-source-showcase-header">
        <BrandMark asset={project.logo} />
        <div>
          <p className="open-source-showcase-identity">{project.identity}</p>
          <h3 id="open-source-showcase-heading">{project.name}</h3>
        </div>
      </header>

      <p className="open-source-showcase-background">{project.background}</p>

      <section aria-label="Semantica 核心架构" className="arch-diagram">
        <div className="arch-layers">
          {project.architecture.layers.map((layer) => (
            <div className="arch-layer" key={layer.id}>
              <p className="arch-layer-title">{layer.title}</p>
              <ul className="arch-capabilities">
                {layer.capabilityIds.map((capabilityId) => {
                  const capability = capabilitiesById.get(capabilityId);
                  return capability ? (
                    <li className="arch-capability" key={capability.id}>
                      {capability.label}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          ))}
          {spanningCapabilities.map((capability) => (
            <p className="arch-spanning" key={capability.id}>
              {capability.label}
            </p>
          ))}
        </div>
      </section>

      <ul aria-label="Semantica 已合并贡献" className="pr-list">
        {merged.map((contribution) => (
          <li key={contribution.number}>
            <a className="pr-link" href={contribution.url} rel="noreferrer" target="_blank">{`PR #${contribution.number} · ${contribution.title}`}</a>
          </li>
        ))}
      </ul>

      <p className="open-source-showcase-boundary">{`截至 ${project.snapshotDate}：${merged.length} 个贡献已合并`}</p>

      <nav aria-label="Semantica 公开资料" className="open-source-showcase-links">
        <a href={project.repositoryUrl} rel="noreferrer" target="_blank">
          Semantica GitHub repository
        </a>
        <a href={project.articlePath}>阅读 Semantica 贡献复盘</a>
      </nav>
    </article>
  );
}