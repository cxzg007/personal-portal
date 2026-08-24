import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { BrandAsset, SiteContent } from "@/content/schema";

function configuredAssets(content: SiteContent): BrandAsset[] {
  return [...content.internships.map(({ logo }) => logo), content.openSource.logo];
}

export function assertValidBrandAssets(content: SiteContent): void {
  for (const asset of configuredAssets(content)) {
    const absolute = path.join(process.cwd(), "public", asset.src.slice(1));
    if (!existsSync(absolute) || statSync(absolute).size === 0) {
      throw new Error(`Brand asset ${asset.src} is missing or empty`);
    }
  }
}