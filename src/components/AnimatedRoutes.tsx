import React, { useEffect, Suspense, useState } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/pages/Splash";
import Index from "@/pages/Index";
import Login from "@/pages/auth/Login";
import RegisterStep1 from "@/pages/auth/RegisterStep1";
import RegisterStep2 from "@/pages/auth/RegisterStep2";
import RegisterStep3 from "@/pages/auth/RegisterStep3";

// Lazy-loaded routes
const Explore = React.lazy(() => import("@/pages/Explore"));
const ProfileDetail = React.lazy(() => import("@/pages/ProfileDetail"));
const Matches = React.lazy(() => import("@/pages/Matches"));
const Messages = React.lazy(() => import("@/pages/Messages"));
const Chat = React.lazy(() => import("@/pages/Chat"));
const MyProfile = React.lazy(() => import("@/pages/MyProfile"));
const EditProfile = React.lazy(() => import("@/pages/EditProfile"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const Subscription = React.lazy(() => import("@/pages/Subscription"));
const HoroscopeMatch = React.lazy(() => import("@/pages/HoroscopeMatch"));
const SuccessStories = React.lazy(() => import("@/pages/SuccessStories"));
const AboutUs = React.lazy(() => import("@/pages/AboutUs"));
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/auth/ResetPassword"));
const AuthCallback = React.lazy(() => import("@/pages/auth/AuthCallback"));
const NotificationPreferences = React.lazy(() => import("@/pages/NotificationPreferences"));
const Notifications = React.lazy(() => import("@/pages/Notifications"));
const FAQSupport = React.lazy(() => import("@/pages/settings/FAQSupport"));
const LanguageSettings = React.lazy(() => import("@/pages/settings/LanguageSettings"));
const BlockedUsersSettings = React.lazy(() => import("@/pages/settings/BlockedUsersSettings"));
const FeedbackPage = React.lazy(() => import("@/pages/FeedbackPage"));
const LegalPage = React.lazy(() => import("@/pages/legal/LegalPage"));
const DeleteAccount = React.lazy(() => import("@/pages/settings/DeleteAccount"));
const VerifyProfile = React.lazy(() => import("@/pages/VerifyProfile"));
const AdminVerification = React.lazy(() => import("@/pages/admin/AdminVerification"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const UnderDevelopment = React.lazy(() => import("@/pages/UnderDevelopment"));

// Admin pages — lazy loaded, behind AdminRoute guard
const AdminLayout = React.lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("@/pages/admin/AdminUsers"));
const AdminReports = React.lazy(() => import("@/pages/admin/AdminReports"));
const AdminBroadcasts = React.lazy(() => import("@/pages/admin/AdminBroadcasts"));
const AdminAnalytics = React.lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminAuditLog = React.lazy(() => import("@/pages/admin/AdminAuditLog"));
const AdminLandingContent = React.lazy(() => import("@/pages/admin/AdminLandingContent"));
const AdminUnderDevelopment = React.lazy(() => import("@/pages/admin/AdminUnderDevelopment"));


const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
};

// Premium loading fallback with branded spinner
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-glow-primary animate-pulse">
        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping opacity-30" />
    </div>
    <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading...</p>
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="min-h-screen">
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </motion.div>
);

// Normalize route key — group dynamic routes under a base key
// so /chat/abc and /chat/def don't conflict in AnimatePresence
const getRouteKey = (pathname: string): string => {
  // For dynamic segments, use the base path
  if (pathname.startsWith("/chat/")) return "/chat";
  if (pathname.startsWith("/profile/")) return "/profile";
  if (pathname.startsWith("/admin")) return "/admin";
  return pathname;
};

/**
 * UnderDevelopmentGuard — Wraps a page component.
 *
 * Checks if the current route is marked as "under development" in Supabase.
 * - If the route is enabled AND the user is NOT an admin/moderator → shows UnderDevelopment page
 * - Otherwise → renders children normally
 * - Admins ALWAYS see the real content
 */
const UnderDevelopmentGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isModerator } = useAdminRole();
  const [isUnderDev, setIsUnderDev] = useState<boolean | null>(null);

  useEffect(() => {
    // Admins bypass the check entirely
    if (isModerator) {
      setIsUnderDev(false);
      return;
    }

    const checkRoute = async () => {
      try {
        const { data } = await supabase
          .from("under_development_routes" as any)
          .select("enabled")
          .eq("path", location.pathname)
          .maybeSingle();

        setIsUnderDev(!!(data as any)?.enabled);
      } catch {
        setIsUnderDev(false);
      }
    };

    checkRoute();
  }, [location.pathname, isModerator]);

  // Still checking — render nothing briefly (avoids flash)
  if (isUnderDev === null) return null;

  if (isUnderDev) {
    return (
      <Suspense fallback={null}>
        <UnderDevelopment />
      </Suspense>
    );
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // ─── OAuth / Email-link callback detection ───
    // Supabase sends tokens as either:
    //   • Hash fragment: /#access_token=... (implicit flow)
    //   • Query param:   /?code=...          (PKCE flow)
    //   • Error:         /?error=...         (failed OAuth)
    const isOAuthHash = hash.includes('access_token') || hash.includes('refresh_token');
    const isOAuthCode = search.includes('code=');
    const isOAuthError = search.includes('error=');
    const isPasswordRecovery = hash.includes('type=recovery') || search.includes('type=recovery');

    if (isOAuthHash || isOAuthCode || isOAuthError || isPasswordRecovery) {
      // Forward to AuthCallback, preserving both hash and search params
      // so the SDK can exchange the token correctly
      navigate('/auth/callback' + search + hash, { replace: true });
      return;
    }

    const splashShown = sessionStorage.getItem("splashShown");
    // Skip splash for admin routes, auth routes, and callback routes
    if (
      !splashShown &&
      location.pathname !== "/splash" &&
      location.pathname !== "/auth/callback" &&
      !location.pathname.startsWith("/admin")
    ) {
      sessionStorage.setItem("splashShown", "true");
      navigate("/splash", { replace: true });
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getRouteKey(location.pathname)}>
        <Route path="/splash" element={<PageWrapper><Splash /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        {/* Dedicated OAuth / email-link callback handler */}
        <Route path="/auth/callback" element={<PageWrapper><AuthCallback /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterStep1 /></PageWrapper>} />
        <Route path="/register/step2" element={<PageWrapper><ProtectedRoute><RegisterStep2 /></ProtectedRoute></PageWrapper>} />
        <Route path="/register/step3" element={<PageWrapper><ProtectedRoute><RegisterStep3 /></ProtectedRoute></PageWrapper>} />
        <Route path="/" element={<PageWrapper><ProtectedRoute><Index /></ProtectedRoute></PageWrapper>} />
        <Route path="/explore" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><Explore /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/profile/:id" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><ProfileDetail /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/matches" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><Matches /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/messages" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><Messages /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/chat/:partnerId" element={<PageWrapper><ProtectedRoute><Chat /></ProtectedRoute></PageWrapper>} />
        <Route path="/my-profile" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><MyProfile /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/edit-profile" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><EditProfile /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><Settings /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/language" element={<PageWrapper><ProtectedRoute><LanguageSettings /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/blocked" element={<PageWrapper><ProtectedRoute><BlockedUsersSettings /></ProtectedRoute></PageWrapper>} />
        <Route path="/feedback" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><FeedbackPage /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/notifications" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><Notifications /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/notification-preferences" element={<PageWrapper><ProtectedRoute><NotificationPreferences /></ProtectedRoute></PageWrapper>} />
        <Route path="/legal" element={<PageWrapper><LegalPage /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><LegalPage /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><LegalPage /></PageWrapper>} />
        <Route path="/refund" element={<PageWrapper><LegalPage /></PageWrapper>} />
        <Route path="/refunds" element={<PageWrapper><LegalPage /></PageWrapper>} />
        <Route path="/safety" element={<PageWrapper><LegalPage /></PageWrapper>} />
        <Route path="/settings/privacy-policy" element={<Navigate to="/legal#privacy" replace />} />
        <Route path="/settings/terms" element={<Navigate to="/legal#terms" replace />} />
        <Route path="/settings/faq" element={<PageWrapper><ProtectedRoute><FAQSupport /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/delete-account" element={<PageWrapper><ProtectedRoute><DeleteAccount /></ProtectedRoute></PageWrapper>} />
        <Route path="/subscription" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><Subscription /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/horoscope" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><HoroscopeMatch /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/success-stories" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><SuccessStories /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><AboutUs /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        <Route path="/verify-profile" element={<PageWrapper><ProtectedRoute><UnderDevelopmentGuard><VerifyProfile /></UnderDevelopmentGuard></ProtectedRoute></PageWrapper>} />
        {/* Under development preview (accessible to anyone for testing) */}
        <Route path="/under-development-preview" element={<PageWrapper><UnderDevelopment /></PageWrapper>} />
        {/* Admin dashboard — nested routes behind AdminRoute guard */}
        <Route path="/admin" element={<PageWrapper><AdminRoute><AdminLayout /></AdminRoute></PageWrapper>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="broadcasts" element={<AdminRoute requiredRole="admin"><AdminBroadcasts /></AdminRoute>} />
          <Route path="analytics" element={<AdminRoute requiredRole="admin"><AdminAnalytics /></AdminRoute>} />
          <Route path="audit-log" element={<AdminRoute requiredRole="admin"><AdminAuditLog /></AdminRoute>} />
          <Route path="landing" element={<AdminRoute requiredRole="admin"><AdminLandingContent /></AdminRoute>} />
          <Route path="under-development" element={<AdminRoute requiredRole="admin"><AdminUnderDevelopment /></AdminRoute>} />
        </Route>
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
