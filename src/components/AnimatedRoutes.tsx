import React, { useEffect, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
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
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/auth/ResetPassword"));
const NotificationPreferences = React.lazy(() => import("@/pages/NotificationPreferences"));
const FAQSupport = React.lazy(() => import("@/pages/settings/FAQSupport"));
const PrivacyPolicy = React.lazy(() => import("@/pages/settings/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("@/pages/settings/TermsOfService"));
const DeleteAccount = React.lazy(() => import("@/pages/settings/DeleteAccount"));
const VerifyProfile = React.lazy(() => import("@/pages/VerifyProfile"));
const AdminVerification = React.lazy(() => import("@/pages/admin/AdminVerification"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

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
  return pathname;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown");
    if (!splashShown && location.pathname !== "/splash") {
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
        <Route path="/register" element={<PageWrapper><RegisterStep1 /></PageWrapper>} />
        <Route path="/register/step2" element={<PageWrapper><ProtectedRoute><RegisterStep2 /></ProtectedRoute></PageWrapper>} />
        <Route path="/register/step3" element={<PageWrapper><ProtectedRoute><RegisterStep3 /></ProtectedRoute></PageWrapper>} />
        <Route path="/" element={<PageWrapper><ProtectedRoute><Index /></ProtectedRoute></PageWrapper>} />
        <Route path="/explore" element={<PageWrapper><ProtectedRoute><Explore /></ProtectedRoute></PageWrapper>} />
        <Route path="/profile/:id" element={<PageWrapper><ProtectedRoute><ProfileDetail /></ProtectedRoute></PageWrapper>} />
        <Route path="/matches" element={<PageWrapper><ProtectedRoute><Matches /></ProtectedRoute></PageWrapper>} />
        <Route path="/messages" element={<PageWrapper><ProtectedRoute><Messages /></ProtectedRoute></PageWrapper>} />
        <Route path="/chat/:partnerId" element={<PageWrapper><ProtectedRoute><Chat /></ProtectedRoute></PageWrapper>} />
        <Route path="/my-profile" element={<PageWrapper><ProtectedRoute><MyProfile /></ProtectedRoute></PageWrapper>} />
        <Route path="/edit-profile" element={<PageWrapper><ProtectedRoute><EditProfile /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><ProtectedRoute><Settings /></ProtectedRoute></PageWrapper>} />
        <Route path="/notification-preferences" element={<PageWrapper><ProtectedRoute><NotificationPreferences /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/faq" element={<PageWrapper><ProtectedRoute><FAQSupport /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/privacy-policy" element={<PageWrapper><ProtectedRoute><PrivacyPolicy /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/terms" element={<PageWrapper><ProtectedRoute><TermsOfService /></ProtectedRoute></PageWrapper>} />
        <Route path="/settings/delete-account" element={<PageWrapper><ProtectedRoute><DeleteAccount /></ProtectedRoute></PageWrapper>} />
        <Route path="/subscription" element={<PageWrapper><ProtectedRoute><Subscription /></ProtectedRoute></PageWrapper>} />
        <Route path="/horoscope" element={<PageWrapper><ProtectedRoute><HoroscopeMatch /></ProtectedRoute></PageWrapper>} />
        <Route path="/success-stories" element={<PageWrapper><ProtectedRoute><SuccessStories /></ProtectedRoute></PageWrapper>} />
        <Route path="/verify-profile" element={<PageWrapper><ProtectedRoute><VerifyProfile /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/verification" element={<PageWrapper><ProtectedRoute><AdminVerification /></ProtectedRoute></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
