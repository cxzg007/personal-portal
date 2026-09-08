import { loadSiteContent } from "../src/content/load-site-content";
import { loadSystemArchitectures } from "../src/content/system-architectures";
import { assertValidBrandAssets } from "../src/lib/brand-assets";
import { assertValidResumePdf } from "../src/lib/resume-asset";

const content = loadSiteContent();
assertValidBrandAssets(content);
assertValidResumePdf();
const architectures = loadSystemArchitectures(content);
console.log(
  `Content validation passed (${architectures.length} system architectures)`,
);
