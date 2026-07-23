import { Heart, Compass, Users, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

  const activeIndex = tabs.findIndex((tab) => tab.path === location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      {/* Outer centering wrapper for desktop */}
      <div className="w-full max-w-[480px] bg-card/90 backdrop-blur-2xl border-t border-border/30 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around px-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <motion.button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                whileTap={{ scale: 0.85 }}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 px-4 transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 h-[3px] w-7 rounded-full gradient-saffron"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ boxShadow: "0 2px 8px hsl(14 80% 52% / 0.4)" }}
                  />
                )}

                <motion.div
                  animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                >
                  <tab.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                </motion.div>

                <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>

                {isActive && (
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary/8 blur-md" />
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
