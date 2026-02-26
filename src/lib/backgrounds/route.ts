import type { SectionKey } from "@/lib/backgrounds/types";

function isExactOrNested(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function resolveSectionKey(pathname: string): SectionKey | null {
  if (!pathname) return null;

  if (isExactOrNested(pathname, "/journey")) return null;
  if (isExactOrNested(pathname, "/chat")) return "chat";
  if (isExactOrNested(pathname, "/game")) return "game";
  if (isExactOrNested(pathname, "/wishlist")) return "wishlist";
  if (isExactOrNested(pathname, "/gallery")) return "gallery";
  if (isExactOrNested(pathname, "/plans")) return "plans";
  if (isExactOrNested(pathname, "/spicy")) return "spicy";
  if (isExactOrNested(pathname, "/settings")) return "settings";
  if (isExactOrNested(pathname, "/questions")) return "questions";
  if (isExactOrNested(pathname, "/pair")) return "pair";
  if (isExactOrNested(pathname, "/login")) return "login";
  if (pathname === "/") return "home";

  return null;
}
