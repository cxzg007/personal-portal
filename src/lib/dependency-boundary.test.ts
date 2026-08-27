import { expect, it } from "vitest";

import packageJson from "../../package.json";

it("keeps the homepage free of WebGL and animation runtimes", () => {
  expect(packageJson.dependencies).not.toHaveProperty("@react-three/fiber");
  expect(packageJson.dependencies).not.toHaveProperty("three");
  expect(packageJson.dependencies).not.toHaveProperty("motion");
});
