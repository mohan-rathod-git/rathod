/**
 * BottomNav — Fixed bottom navigation for Banjara Bandhan.
 *
 * Uses `position: sticky; bottom: 0` inside the AppShell's flex-column container.
 * This keeps the nav inside the max-480px centered phone-frame on desktop,
 * while always pinning it to the viewport bottom on mobile.
 *
 * Keyboard: hidden via CSS when body.keyboard-open is active (see index.css).
 */

import { Heart, Compass, Users, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

const tabs = [
  { icon: Heart, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Users, label: "Connect", path: "/matches" },
  { icon: MessageCircle, label: "Chat", path: "/messages" },
  { icon: User, label: "Profile", path: "/my-profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <nav
      aria-label="Main navigation"
      className="bottom-nav-root hide-on-keyboard"
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        marginTop: "auto",
        flexShrink: 0,
        /* The nav must be a direct flex child of the page flex-col root */
      }}
    >
      <div
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))",
          boxShadow: "0 -1px 0 0 hsl(var(--border) / 0.3), 0 -8px 32px -8px rgba(0,0,0,0.12)",
        }}
        className="bg-card/96 backdrop-blur-2xl"
      >
        <div className="flex items-center justify-around px-1">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(tab.path);

            const showBadge = tab.path === "/messages" && unreadCount > 0;

            return (
              <motion.button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                whileTap={{ scale: 0.87 }}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                style={{ minWidth: 44, minHeight: 52 }}
              >
                {/* Top active pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      key="pill"
                      layoutId="bnav-pill"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute -top-px left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full gradient-saffron"
                      style={{ boxShadow: "0 2px 8px hsl(14 80% 52% / 0.5)" }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon with scale animation */}
                <div className="relative">
                  <motion.div
                    animate={isActive ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  >
                    <tab.icon
                      className="h-[22px] w-[22px]"
                      strokeWidth={isActive ? 2.4 : 1.7}
                    />
                  </motion.div>

                  {/* Unread badge */}
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-md">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] leading-none mt-0.5 transition-all duration-200 ${
                    isActive ? "font-bold text-primary" : "font-medium"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-primary/5 pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
