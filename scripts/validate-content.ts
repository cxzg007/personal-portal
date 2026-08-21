import { loadSiteContent } from "../src/content/load-site-content";
import { assertValidResumePdf } from "../src/lib/resume-asset";

loadSiteContent();
assertValidResumePdf();
console.log("Content validation passed");
