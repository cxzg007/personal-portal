"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

export function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const pre = useRef<HTMLPreElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState("复制代码");
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pre.current?.textContent ?? "");
      setStatus("已复制");
    } catch { setStatus("复制失败，请手动选择"); }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("复制代码"), 2500);
  };
  return <div className="code-frame"><div className="code-frame-toolbar"><span className="code-frame-label">代码示例</span><button type="button" onClick={copy} aria-live="polite">{status}</button></div><pre {...props} ref={pre} tabIndex={0}>{children}</pre></div>;
}
