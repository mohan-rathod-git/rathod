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
 * AppShell — wraps the app in a centered, max-width container on desktop.
 * On mobile (< 640px): full-screen, edge-to-edge.
 * On tablet/laptop/desktop (≥ 640px): centered phone-frame (max 480px wide)
 * with a rich decorative background visible on the sides.
 *
 * Admin routes bypass the 480px constraint — AdminLayout uses position:fixed
 * to cover the full viewport independently.
 */
const AppShell = ({ children }: { children: React.ReactNode }) => {
  useKeyboardViewport();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Admin routes: simple full-width pass-through wrapper
  // AdminLayout takes over with position:fixed to fill the viewport
  if (isAdminRoute) {
    return (
      <div style={{ width: "100%", minHeight: "100dvh", position: "relative" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowX: "hidden",
      }}
    >
      <div
        id="app-shell-inner"
        style={{
          width: "100%",
          maxWidth: "480px",
          minHeight: "100dvh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          /* NOTE: overflow-y must NOT be hidden — it breaks sticky BottomNav */
        }}
        className="bg-background shadow-[0_0_80px_rgba(0,0,0,0.5)] sm:shadow-[0_0_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]"
      >
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
