import fs from "node:fs";
import path from "node:path";

const PDF_SIGNATURE = Buffer.from("%PDF-");

export function assertValidResumePdf(
  resumePath = path.join(process.cwd(), "public", "resume.pdf"),
): void {
  if (!fs.existsSync(resumePath)) {
    throw new Error("public/resume.pdf is missing");
  }

  const stats = fs.statSync(resumePath);
  if (!stats.isFile() || stats.size === 0) {
    throw new Error("public/resume.pdf is empty");
  }

  const file = fs.openSync(resumePath, "r");
  try {
    const signature = Buffer.alloc(PDF_SIGNATURE.length);
    fs.readSync(file, signature, 0, signature.length, 0);
    if (!signature.equals(PDF_SIGNATURE)) {
      throw new Error("public/resume.pdf must begin with %PDF-");
    }
  } finally {
    fs.closeSync(file);
  }
}
