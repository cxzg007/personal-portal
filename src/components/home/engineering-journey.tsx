import type { JourneyNode } from "@/content/schema";

type EngineeringJourneyProps = {
  label: string;
  nodes: JourneyNode[];
};

export function EngineeringJourney({ label, nodes }: EngineeringJourneyProps) {
  return (
    <ol aria-label={label} className="engineering-journey">
      {nodes.map((node, index) => (
        <li data-journey-step={index + 1} key={node.label}>
          <span>{node.label}</span>
          <p>{node.detail}</p>
        </li>
      ))}
    </ol>
  );
}