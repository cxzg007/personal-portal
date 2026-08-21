import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertValidResumePdf } from "./resume-asset";

let temporaryDirectory: string;

describe("assertValidResumePdf", () => {
  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-resume-"));
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("rejects a missing public resume", () => {
    expect(() => assertValidResumePdf(path.join(temporaryDirectory, "missing.pdf"))).toThrow(
      /resume\.pdf.*missing/i,
    );
  });

  it("rejects an empty public resume", () => {
    const resumePath = path.join(temporaryDirectory, "empty.pdf");
    fs.writeFileSync(resumePath, "");

    expect(() => assertValidResumePdf(resumePath)).toThrow(/resume\.pdf.*empty/i);
  });

  it("rejects a file without a PDF header", () => {
    const resumePath = path.join(temporaryDirectory, "fake.pdf");
    fs.writeFileSync(resumePath, "not really a pdf");

    expect(() => assertValidResumePdf(resumePath)).toThrow(/resume\.pdf.*%PDF-/i);
  });

  it("accepts a non-empty file beginning with the PDF signature", () => {
    const resumePath = path.join(temporaryDirectory, "valid.pdf");
    fs.writeFileSync(resumePath, "%PDF-1.7\nfixture");

    expect(() => assertValidResumePdf(resumePath)).not.toThrow();
  });
});
