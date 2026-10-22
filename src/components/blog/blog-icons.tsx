export function BlogIcon({ name }: { name: "search" | "sun" | "moon" | "sound" | "mute" | "rss" | "close" }) {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === "search" && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>}
    {name === "sun" && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    {name === "moon" && <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />}
    {(name === "sound" || name === "mute") && <><path d="M11 5 6 9H3v6h3l5 4Z" />{name === "sound" ? <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m16 9 5 6m0-6-5 6" />}</>}
    {name === "rss" && <><path d="M4 4a16 16 0 0 1 16 16M4 11a9 9 0 0 1 9 9" /><circle cx="4.5" cy="19.5" r="1" fill="currentColor" /></>}
    {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
  </svg>;
}
