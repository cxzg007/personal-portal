"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const navigation = [
  { label: "首页", href: "/#top" },
  { label: "实习", href: "/#internships" },
  { label: "系统设计", href: "/#case-studies" },
  { label: "博客", href: "/blog" },
  { label: "关于", href: "/#about" },
  { label: "简历", href: "/resume.pdf" },
] as const;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="navigation-list">
      {navigation.map((item) => (
        <li key={item.label}>
          <Link href={item.href} onClick={onNavigate} prefetch={item.href === "/resume.pdf" ? false : null}>
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
          <span aria-hidden="true">⌁</span>
          <span>PORTFOLIO</span>
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
