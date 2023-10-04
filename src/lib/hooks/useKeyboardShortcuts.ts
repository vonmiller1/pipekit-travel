// ============================================================
// Feature 6: Keyboard Shortcuts Hook
// ============================================================

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onTab1?: () => void;  // Cmd+1 → Dashboard
  onTab2?: () => void;  // Cmd+2 → Commitments
  onTab3?: () => void;  // Cmd+3 → Analytics
  onEscape?: () => void; // Escape → close modals
  onSearch?: () => void; // Cmd+K → focus search
  onNewEntry?: () => void; // Cmd+N → focus transcript
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === "Escape") {
        handlers.onEscape?.();
        return;
      }

      if (modifier) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            handlers.onTab1?.();
            break;
          case "2":
            e.preventDefault();
            handlers.onTab2?.();
            break;
          case "3":
            e.preventDefault();
            handlers.onTab3?.();
            break;
          case "k":
            e.preventDefault();
            handlers.onSearch?.();
            break;
          case "n":
            e.preventDefault();
            handlers.onNewEntry?.();
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
