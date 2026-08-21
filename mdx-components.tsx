import type { MDXComponents } from "mdx/types";
import { getBlogMdxComponents } from "./src/components/blog/mdx-components";

export function useMDXComponents(): MDXComponents {
  return getBlogMdxComponents();
}
