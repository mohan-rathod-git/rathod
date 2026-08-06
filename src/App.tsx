import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import PermissionRequests from "@/components/PermissionRequests";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import { useKeyboardViewport } from "@/hooks/useKeyboardViewport";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

/**
 * AppShell — Responsive layout shell.
 *
 * Breakpoints:
 * - Mobile  (<640px):  Full-screen, edge-to-edge phone layout
 * - Tablet  (640–1023px): Centered card, max 520px, decorative bg on sides
 * - Desktop (≥1024px): Full-width, no phone frame — proper desktop layout
 * - Admin routes: Always full-width (AdminLayout uses position:fixed)
 */

const AppShell = ({ children }: { children: React.ReactNode }) => {
  useKeyboardViewport();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Force light mode — prevent reverting to old dark/saffron theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    if (!root.classList.contains('light')) {
      root.classList.add('light');
    }
  }, []);

  if (isAdminRoute) {
    return (
      <div style={{ width: "100%", minHeight: "100dvh", position: "relative" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell-outer">
      <div id="app-shell-inner" className="app-shell-inner">
        {children}
      </div>
    </div>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppShell>
              <RealtimeNotifications />
              <PermissionRequests />
              <AnimatedRoutes />
            </AppShell>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
