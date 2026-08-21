import type { SiteContent } from "@/content/schema";

type ImpactMetricsProps = {
  metrics: SiteContent["metrics"];
};

export function ImpactMetrics({ metrics }: ImpactMetricsProps) {
  return (
    <section aria-label="成果指标" className="impact-metrics">
      {metrics.map((metric) => (
        <article className="metric-card" key={`${metric.label}-${metric.value}-${metric.suffix}`}>
          <p className="metric-label">{metric.label}</p>
          <p className="metric-value">
            <strong>{metric.value}</strong>
            <span>{metric.suffix}</span>
          </p>
          <p className="metric-evidence">{metric.evidence}</p>
        </article>
      ))}
    </section>
  );
}
