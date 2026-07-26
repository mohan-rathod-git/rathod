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
 * - Accounts for sticky headers via scroll-padding-top
 * - Uses faster scroll timing for iOS responsiveness
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

/**
 * Scroll the focused input into view while accounting for any
 * sticky headers (elements with position: sticky or fixed at the top).
 */
function scrollInputIntoView(target: HTMLElement | null) {
  if (!target) return;

  // Find the tallest sticky/fixed element at the top of the page
  // (the sticky registration header is ~80px including pt-12)
  const stickyEls = document.querySelectorAll<HTMLElement>(
    "[class*='sticky'], [class*='fixed']"
  );
  let topOffset = 16; // base padding
  stickyEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    // Only count elements that are at the top of the viewport
    if (rect.top <= 4 && rect.height > 0 && rect.height < 200) {
      topOffset = Math.max(topOffset, rect.bottom + 12);
    }
  });

  // Use scrollIntoView with a block:nearest first to prevent jarring jumps,
  // then adjust if the header is covering it
  requestAnimationFrame(() => {
    const inputRect = target.getBoundingClientRect();

    // Already fully visible above the keyboard? Don't scroll.
    const vv = window.visualViewport;
    const visibleBottom = vv ? vv.height : window.innerHeight;
    const visibleTop = topOffset;

    if (inputRect.top >= visibleTop && inputRect.bottom <= visibleBottom) {
      return; // Already visible
    }

    // Scroll so the input center is in the middle of the visible area
    const scrollTarget =
      window.scrollY +
      inputRect.top -
      topOffset -
      Math.max(0, (visibleBottom - inputRect.height) / 2 - topOffset);

    window.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
  });
}

export function useKeyboardViewport() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ─── Visual Viewport API (primary — Chrome 61+, Safari 13+) ───
    const vv = window.visualViewport;
    const lastWindowHeight = window.innerHeight;

    const handleViewportResize = () => {
      if (!vv) return;
      const heightDiff = lastWindowHeight - vv.height;
      // >120px difference strongly indicates the keyboard is open
      const active = heightDiff > 120;
      const kbHeight = active ? Math.max(0, heightDiff) : 0;

      setIsKeyboardOpen(active);
      setKeyboardHeight(kbHeight);
      setKeyboardCSSVars(active, kbHeight);

      // When keyboard opens via viewport resize, scroll active input into view
      if (active) {
        const focused = document.activeElement as HTMLElement | null;
        if (isKeyboardInput(focused)) {
          // Short delay to let the viewport settle
          setTimeout(() => scrollInputIntoView(focused), 100);
        }
      }
    };

    // ─── Focus Events (fallback / supplement) ───
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isKeyboardInput(target)) return; // Skip sliders, checkboxes, etc.

      setIsKeyboardOpen(true);
      document.body.classList.add("keyboard-open");
      document.body.style.setProperty("--is-keyboard-open", "1");

      // Scroll focused input into view after keyboard animation settles.
      // 200ms is enough for Android; iOS needs ~300ms but we start sooner
      // and re-trigger after the viewport resize event fires.
      setTimeout(() => scrollInputIntoView(target), 200);
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
