import localFont from "next/font/local";

/* Latin text and numerals are self-hosted so the homepage reads the same on
   macOS, Windows and Linux. These are latin-only subsets, so Chinese keeps
   falling through to the system stack declared in profile.css. */
export const latinSans = localFont({
  src: "../../node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2",
  weight: "100 700",
  style: "normal",
  display: "swap",
  variable: "--font-latin-sans",
  adjustFontFallback: "Arial",
});

export const latinMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-latin-mono",
  adjustFontFallback: "Arial",
});
