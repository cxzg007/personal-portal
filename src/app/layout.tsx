import type { Metadata } from "next";
import type { ReactNode } from "react";
import { loadSiteContent } from "@/content/load-site-content";
import { getSiteUrl } from "@/lib/site-url";
import "@fontsource/noto-serif-sc/600.css";
import "./globals.css";
import "./profile.css";

const content = loadSiteContent();
const siteUrl = getSiteUrl();
const title = `${content.profile.name}｜${content.profile.targetRole}`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: title,
    template: `%s｜${content.profile.name}`,
  },
  description: content.profile.positioning,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: `${content.profile.name}的个人求职门户`,
    title,
    description: content.profile.positioning,
    images: [{ url: "/social-card.svg", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: content.profile.positioning,
    images: ["/social-card.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="app-shell">
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        {children}
      </body>
    </html>
  );
}
