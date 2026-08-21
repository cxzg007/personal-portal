import { readFileSync } from "node:fs";

import { type SiteContent, validateSiteContent } from "./schema";

const contentFile = new URL("../../content/site-content.json", import.meta.url);

export function loadSiteContent(): SiteContent {
  const input: unknown = JSON.parse(readFileSync(contentFile, "utf8"));
  const validation = validateSiteContent(input);

  if (!validation.ok) {
    throw new Error(`Site content validation failed:\n- ${validation.errors.join("\n- ")}`);
  }

  return input as SiteContent;
}
