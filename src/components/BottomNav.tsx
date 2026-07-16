import { Heart, Compass, Users, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-4 transition-all duration-300 active:scale-90 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
              )}
              <tab.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
