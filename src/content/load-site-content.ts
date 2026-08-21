import { type SiteContent, validateSiteContent } from "./schema";
import siteContent from "../../content/site-content.json";

export function loadSiteContent(): SiteContent {
  const input: unknown = siteContent;
  const validation = validateSiteContent(input);

  if (!validation.ok) {
    throw new Error(`Site content validation failed:\n- ${validation.errors.join("\n- ")}`);
  }

  return input as SiteContent;
}
