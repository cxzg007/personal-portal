import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** The detailed portfolio must stay independent of the iframe room runtime. */
const BANNED = ["three", "@react-three/fiber", "@react-three/drei", "motion", "framer-motion"];

const SOURCE_ROOT = path.join(import.meta.dirname, "..");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function resolveModule(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = path.join(SOURCE_ROOT, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    // 裸包名不用解析，上层单独判断它在不在黑名单里。
    return null;
  }

  for (const extension of EXTENSIONS) {
    const candidate = base + extension;
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  for (const extension of EXTENSIONS) {
    const candidate = path.join(base, `index${extension}`);
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

/** 静态导入和 import() 都要看：懒加载只是晚一点下载，仍然属于这棵树。 */
const IMPORT_PATTERN = /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g;

function collectImports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1]);
}

/** 从详细主页出发遍历本地模块，返回走到的文件和一路上引用过的裸包名。 */
function walkFromHomepage() {
  const entry = path.join(SOURCE_ROOT, "app/about/page.tsx");
  const visited = new Set<string>();
  const packages = new Map<string, string>();
  const queue = [entry];

  while (queue.length) {
    const file = queue.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);

    for (const specifier of collectImports(file)) {
      const resolved = resolveModule(specifier, file);
      if (resolved) {
        queue.push(resolved);
        continue;
      }
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
        const name = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0];
        if (!packages.has(name)) packages.set(name, path.relative(SOURCE_ROOT, file));
      }
    }
  }

  return { files: visited, packages };
}

describe("详细主页的依赖边界", () => {
  it("遍历得到的详细主页模块树是非空的", () => {
    // 解析一旦失效，下面那条断言会变成永远通过的空检查，所以先确认真的走到了东西。
    const { files } = walkFromHomepage();
    expect(files.size).toBeGreaterThan(5);
  });

  it("详细主页不引入 WebGL 和动画运行时", () => {
    const { packages } = walkFromHomepage();
    const found = BANNED.filter((name) => packages.has(name)).map(
      (name) => `${name}（经由 ${packages.get(name)}）`,
    );
    expect(found).toEqual([]);
  });

  it("详细主页不引入交互房间组件", () => {
    const { files } = walkFromHomepage();
    const leaked = [...files].filter((file) => file.includes(`${path.sep}components${path.sep}playground${path.sep}`));
    expect(leaked).toEqual([]);
  });
});
