import { describe, expect, it } from "vitest";
import { escapeXml, serializeJsonLd } from "./discovery";

describe("serializeJsonLd", () => {
  it("escapes less-than signs so structured data cannot close the script element", () => {
    const serialized = serializeJsonLd({ value: "</script><script>alert(1)</script>" });

    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
  });
});

describe("escapeXml", () => {
  it("escapes text and attribute-significant XML characters", () => {
    expect(escapeXml(`Agent & Backend <notes> "quoted" 'tag'`)).toBe(
      "Agent &amp; Backend &lt;notes&gt; &quot;quoted&quot; &apos;tag&apos;",
    );
  });
});
