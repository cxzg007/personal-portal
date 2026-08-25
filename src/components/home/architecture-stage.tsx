import type { CaseStudy } from "@/content/schema";

type ArchitectureStageProps = {
  project: CaseStudy;
};

export function ArchitectureStage({ project }: ArchitectureStageProps) {
  return (
    <ol
      aria-label={`${project.tabLabel} 架构阶段`}
      className="architecture-stage"
      data-visual-kind={project.visualKind}
    >
      <li className="architecture-stage-node">
        <span className="architecture-stage-label">输入约束</span>
        <p>{project.constraints[0]}</p>
      </li>
      <li className="architecture-stage-node">
        <span aria-hidden="true" className="architecture-stage-connector" />
        <span className="architecture-stage-label">工程决策</span>
        <p>{project.decisions[0]}</p>
      </li>
      <li className="architecture-stage-node">
        <span aria-hidden="true" className="architecture-stage-connector" />
        <span className="architecture-stage-label">可验证结果</span>
        <p>{project.result}</p>
      </li>
    </ol>
  );
}