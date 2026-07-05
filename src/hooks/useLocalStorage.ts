import { useEffect, useState } from "react";

// Same API as useState — returns [value, setValue] — so it can be dropped
// in wherever useState is used today without touching the calling code.
function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initializer (the () => ... form) so localStorage is only read
  // once, on mount, rather than on every render.
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      // Corrupted JSON, storage disabled in this browser, etc. — fall
      // back to the caller's default rather than crashing the app over a
      // persistence problem.
      return initialValue;
    }
  });

  // The one job of this effect: whenever `value` changes, mirror it to
  // localStorage so it survives a reload. This is the textbook use case
  // for useEffect — syncing React state with a system outside React
  // (localStorage isn't something React renders or manages itself).
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // e.g. quota exceeded — persistence is best-effort, not something
      // that should break the UI.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export default useLocalStorage;
