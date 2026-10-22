import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "./code-block";

export const blogMdxComponents = {
  a: ({ href = "", children, ...props }) => {
    const external = href.startsWith("https://");

    return (
      <a
        {...props}
        href={href}
        rel={external ? "noreferrer" : undefined}
        target={external ? "_blank" : undefined}
      >
        {children}
      </a>
    );
  },
  pre: CodeBlock,
  table: ({ children, ...props }) => (
    <div className="table-scroll" tabIndex={0}>
      <table {...props}>{children}</table>
    </div>
  ),
} satisfies MDXComponents;

export function getBlogMdxComponents(): MDXComponents {
  return blogMdxComponents;
}
