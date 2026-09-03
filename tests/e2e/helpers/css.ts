import { expect, type Locator } from "@playwright/test";

export async function expectNoRotation(locator: Locator): Promise<void> {
  const rotations = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
      return {
        rotate: style.rotate,
        m11: matrix.m11,
        m12: matrix.m12,
        m13: matrix.m13,
        m21: matrix.m21,
        m22: matrix.m22,
        m23: matrix.m23,
        m31: matrix.m31,
        m32: matrix.m32,
        m33: matrix.m33,
      };
    }),
  );
  expect(rotations.length).toBeGreaterThan(0);
  expect(
    rotations.every(
      ({ rotate, m11, m12, m13, m21, m22, m23, m31, m32, m33 }) =>
        (rotate === "none" || rotate === "0deg") &&
        [m12, m13, m21, m23, m31, m32].every(
          (value) => Math.abs(value) < 0.0001,
        ) &&
        [m11, m22, m33].every((value) => value >= 0),
    ),
  ).toBe(true);
}