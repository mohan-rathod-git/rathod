import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * Smart back navigation hook.
 * Falls back to a specified path (default: "/") when there is no browser history.
 */
export function useGoBack(fallbackPath: string = "/") {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    // Check if we have history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }, [navigate, fallbackPath]);

  return goBack;
}
