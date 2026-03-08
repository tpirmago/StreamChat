// React
import { useEffect, useState } from "react";

/**
 * Returns true when the media query matches, false otherwise.
 * Updates when the viewport crosses the breakpoint.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );
  const [prevQuery, setPrevQuery] = useState(query);

  if (prevQuery !== query) {
    setPrevQuery(query);
    setMatches(typeof window === "undefined" ? false : window.matchMedia(query).matches);
  }

  useEffect(() => {
    const media = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent): void => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
