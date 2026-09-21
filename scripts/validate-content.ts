import { loadSiteContent } from "../src/content/load-site-content";
import { loadSystemArchitectures } from "../src/content/system-architectures";
import { assertValidBrandAssets } from "../src/lib/brand-assets";

const content = loadSiteContent();
assertValidBrandAssets(content);
const architectures = loadSystemArchitectures(content);
console.log(
  `Content validation passed (${architectures.length} system architectures)`,
);
