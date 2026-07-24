import { useEffect, useState } from "react";

/**
 * useKeyboardViewport Hook
 *
 * Manages virtual keyboard opening/closing, visual viewport shifts,
 * input auto-scroll-into-view, and CSS custom property injection.
 */
export function useKeyboardViewport() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const windowHeight = window.innerHeight;
      const currentHeight = vv.height;
      const heightDiff = windowHeight - currentHeight;

      // Threshold of 120px indicates virtual keyboard is active
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true");

      const keyboardActive = heightDiff > 120 || Boolean(isInputFocused);

      setIsKeyboardOpen(keyboardActive);
      setKeyboardHeight(keyboardActive ? Math.max(0, heightDiff) : 0);

      // Inject CSS properties on body for responsive layout math
      if (keyboardActive) {
        document.body.classList.add("keyboard-open");
        document.body.style.setProperty("--keyboard-height", `${Math.max(0, heightDiff)}px`);
        document.body.style.setProperty("--is-keyboard-open", "1");
      } else {
        document.body.classList.remove("keyboard-open");
        document.body.style.setProperty("--keyboard-height", "0px");
        document.body.style.setProperty("--is-keyboard-open", "0");
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true";

      if (isInput) {
        document.body.classList.add("keyboard-open");
        document.body.style.setProperty("--is-keyboard-open", "1");
        setIsKeyboardOpen(true);

        // Smoothly scroll active input into center view after soft keyboard animation
        setTimeout(() => {
          try {
            target.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          } catch {
            // Fallback for older WebViews
            target.scrollIntoView(false);
          }
        }, 300);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isStillInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.getAttribute("contenteditable") === "true");

        if (!isStillInputFocused) {
          document.body.classList.remove("keyboard-open");
          document.body.style.setProperty("--keyboard-height", "0px");
          document.body.style.setProperty("--is-keyboard-open", "0");
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }, 150);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
      document.body.classList.remove("keyboard-open");
      document.body.style.setProperty("--keyboard-height", "0px");
      document.body.style.setProperty("--is-keyboard-open", "0");
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
}
