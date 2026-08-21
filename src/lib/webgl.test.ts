import { describe, expect, it } from "vitest";

import { getSceneMode } from "@/lib/webgl";

describe("getSceneMode", () => {
  it.each([
    {
      capabilities: { webgl: false, reducedMotion: false, cores: 8 },
      expected: "static",
    },
    {
      capabilities: { webgl: true, reducedMotion: true, cores: 8 },
      expected: "static",
    },
    {
      capabilities: { webgl: true, reducedMotion: false, cores: 2 },
      expected: "lite",
    },
    {
      capabilities: { webgl: true, reducedMotion: false, cores: 8 },
      expected: "full",
    },
  ] as const)(
    "selects $expected for $capabilities",
    ({ capabilities, expected }) => {
      expect(getSceneMode(capabilities)).toBe(expected);
    },
  );
});
