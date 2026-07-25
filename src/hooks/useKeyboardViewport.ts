import { useEffect, useState } from "react";

/**
 * useKeyboardViewport Hook
 *
 * Manages virtual keyboard opening/closing, visual viewport shifts,
 * input auto-scroll-into-view, and CSS custom property injection.
 *
 * Fixes:
 * - Only activates for TEXT inputs (not range sliders, checkboxes, etc.)
 * - Uses Visual Viewport API as primary signal (most reliable on mobile)
 * - Falls back to focusin/focusout events for browsers without Visual Viewport API
 * - Prevents scrollIntoView from fighting with AppShell overflow
 */

// Input types that actually open the soft keyboard
const TEXT_INPUT_TYPES = new Set([
  "text", "email", "tel", "password", "number", "search", "url",
  "date", "time", "datetime-local", "month", "week",
]);

function isKeyboardInput(el: Element | null): boolean {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.getAttribute("contenteditable") === "true") return true;
  if (el.tagName === "INPUT") {
    const type = (el as HTMLInputElement).type || "text";
    return TEXT_INPUT_TYPES.has(type.toLowerCase());
  }
  return false;
}

function setKeyboardCSSVars(active: boolean, heightPx: number) {
  document.body.style.setProperty("--keyboard-height", `${heightPx}px`);
  document.body.style.setProperty("--is-keyboard-open", active ? "1" : "0");
  if (active) {
    document.body.classList.add("keyboard-open");
  } else {
    document.body.classList.remove("keyboard-open");
  }
}

export function useKeyboardViewport() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ─── Visual Viewport API (primary — Chrome 61+, Safari 13+) ───
    const vv = window.visualViewport;
    let lastWindowHeight = window.innerHeight;

    const handleViewportResize = () => {
      if (!vv) return;
      const heightDiff = lastWindowHeight - vv.height;
      // > 150px difference strongly indicates the keyboard is open
      const active = heightDiff > 150;
      const kbHeight = active ? Math.max(0, heightDiff) : 0;

      setIsKeyboardOpen(active);
      setKeyboardHeight(kbHeight);
      setKeyboardCSSVars(active, kbHeight);
    };

    // ─── Focus Events (fallback / supplement) ───
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isKeyboardInput(target)) return; // Skip sliders, checkboxes, etc.

      setIsKeyboardOpen(true);
      document.body.classList.add("keyboard-open");
      document.body.style.setProperty("--is-keyboard-open", "1");

      // Scroll focused input into view after keyboard animation settles
      // Use a short delay and requestAnimationFrame to avoid layout thrash
      setTimeout(() => {
        requestAnimationFrame(() => {
          try {
            target?.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          } catch {
            target?.scrollIntoView(false);
          }
        });
      }, 350);
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isKeyboardInput(target)) return; // Only handle text input blur

      // Wait for potential focus transfer (e.g., user taps another input)
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (!isKeyboardInput(activeEl)) {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
          setKeyboardCSSVars(false, 0);
        }
      }, 200);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    if (vv) {
      vv.addEventListener("resize", handleViewportResize);
      vv.addEventListener("scroll", handleViewportResize);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);

      if (vv) {
        vv.removeEventListener("resize", handleViewportResize);
        vv.removeEventListener("scroll", handleViewportResize);
      }

      // Cleanup CSS state
      setKeyboardCSSVars(false, 0);
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
}
