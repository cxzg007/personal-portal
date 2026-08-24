import { loadSiteContent } from "../src/content/load-site-content";
import { assertValidBrandAssets } from "../src/lib/brand-assets";
import { assertValidResumePdf } from "../src/lib/resume-asset";

const content = loadSiteContent();
assertValidBrandAssets(content);
assertValidResumePdf();
console.log("Content validation passed");
