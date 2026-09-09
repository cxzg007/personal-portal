"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// 锚点统一带 "/" 前缀：首页上仍为页内滚动，博客页/文章页上则跳回首页对应分区。
const navigation = [
  { label: "实习", href: "/#internships" },
  { label: "系统", href: "/#systems" },
  { label: "开源", href: "/#open-source" },
  { label: "博客", href: "/#writing", blogHref: "/blog" },
  { label: "联系", href: "/#contact" },
  { label: "GitHub", href: "https://github.com/cxzg007" },
] as const;

function NavigationLinks({
  onNavigate,
  showWriting = true,
}: {
  onNavigate?: () => void;
  showWriting?: boolean;
}) {
  const pathname = usePathname();
  const onBlogPage = pathname?.startsWith("/blog") ?? false;

  return (
    <ul className="navigation-list">
      {navigation
        .filter((item) => showWriting || item.href !== "/#writing")
        .map((item) => {
          const isBlogItem = "blogHref" in item;
          const href = isBlogItem && onBlogPage ? item.blogHref : item.href;

          return (
            <li key={item.label}>
              <Link
                aria-current={isBlogItem && onBlogPage ? "page" : undefined}
                href={href}
                onClick={onNavigate}
                data-nav-section={item.href.split("#")[1]}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}

type HeaderProps = {
  showWriting?: boolean;
};

export function Header({ showWriting = true }: HeaderProps) {
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
    // Any breakpoint crossing resets the menu: entering desktop must close it,
    // and a rapid desktop round-trip can coalesce the media query change events
    // into a single matches=false dispatch, which must still reset the menu.
    const handleBreakpointChange = () => {
      setIsOpen(false);
    };

    desktopBreakpoint.addEventListener("change", handleBreakpointChange);
    return () => desktopBreakpoint.removeEventListener("change", handleBreakpointChange);
  }, []);

  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <Link className="site-mark" href="/#top" aria-label="返回首页">
          <span aria-hidden="true">⌁</span>
          <span>cxzg007.</span>
        </Link>

        <nav className="desktop-navigation" aria-label="主导航">
          <NavigationLinks showWriting={showWriting} />
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
            <NavigationLinks onNavigate={closeMenu} showWriting={showWriting} />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
