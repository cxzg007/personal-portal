"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const navigation = [
  { label: "信息", href: "#info" },
  { label: "实习", href: "#internships" },
  { label: "系统", href: "#systems" },
  { label: "开源", href: "#open-source" },
  { label: "荣誉", href: "#honors" },
  { label: "博客", href: "#writing" },
  { label: "联系", href: "#contact" },
  { label: "GitHub", href: "https://github.com/cxzg007" },
  { label: "简历", href: "/resume.pdf" },
] as const;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="navigation-list">
      {navigation.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            onClick={onNavigate}
            prefetch={item.href === "/resume.pdf" ? false : null}
            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            target={item.href.startsWith("http") ? "_blank" : undefined}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    menuToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, isOpen]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const desktopBreakpoint = window.matchMedia("(min-width: 761px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };

    desktopBreakpoint.addEventListener("change", handleBreakpointChange);
    return () => desktopBreakpoint.removeEventListener("change", handleBreakpointChange);
  }, []);

  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <Link className="site-mark" href="/#top" aria-label="返回首页">
          <span>cxzg007.</span>
        </Link>

        <nav className="desktop-navigation" aria-label="主导航">
          <NavigationLinks />
        </nav>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label="打开导航菜单"
          className="menu-toggle"
          onClick={() => setIsOpen(true)}
          ref={menuToggleRef}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      {isOpen ? (
        <div className="mobile-menu-shell">
          <div className="mobile-menu-heading">
            <span>导航</span>
            <button
              aria-label="关闭导航菜单"
              className="menu-close"
              onClick={closeMenu}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <nav aria-label="移动导航" id="mobile-navigation">
            <NavigationLinks onNavigate={closeMenu} />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
