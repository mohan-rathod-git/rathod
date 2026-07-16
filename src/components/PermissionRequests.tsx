import { useState, useEffect } from "react";
import { Bell, Camera, MapPin, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Permission {
  key: string;
  icon: typeof Bell;
  title: string;
  desc: string;
  request: () => Promise<boolean>;
}

const PermissionRequests = () => {
  const location = useLocation();
  const { session, loading } = useAuth();
  const [pending, setPending] = useState<Permission[]>([]);
  const [current, setCurrent] = useState<Permission | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("perm_dismissed") === "true");
  const [initialized, setInitialized] = useState(false);

  // Build permission list only ONCE after login, not on every route change
  useEffect(() => {
    if (dismissed || initialized) return;

    const hiddenRoutes = ["/splash", "/login", "/forgot-password", "/reset-password"];
    const shouldHide = !session || loading || hiddenRoutes.includes(location.pathname) || location.pathname.startsWith("/register");

    if (shouldHide) return;

    const perms: Permission[] = [];

    const syncAndBuild = async () => {
      if (navigator.permissions?.query) {
        const checks: Array<{ name: PermissionName; storageKey: string }> = [
          { name: "notifications", storageKey: "perm_notification" },
          { name: "geolocation", storageKey: "perm_location" },
          { name: "camera", storageKey: "perm_av" },
          { name: "microphone", storageKey: "perm_av" },
        ];
        await Promise.all(checks.map(async ({ name, storageKey }) => {
          try {
            const status = await navigator.permissions.query({ name } as PermissionDescriptor);
            if (status.state === "granted") localStorage.setItem(storageKey, "granted");
          } catch {}
        }));
      }
      if ("Notification" in window && Notification.permission === "granted") {
        localStorage.setItem("perm_notification", "granted");
      }

      if ("Notification" in window && Notification.permission === "default" && localStorage.getItem("perm_notification") !== "granted") {
        perms.push({
          key: "notification", icon: Bell, title: "Enable Notifications",
          desc: "Get instant alerts for new interests, messages & matches",
          request: async () => { const r = await Notification.requestPermission(); if (r === "granted") localStorage.setItem("perm_notification", "granted"); return r === "granted"; },
        });
      }
      if ("geolocation" in navigator && localStorage.getItem("perm_location") !== "granted") {
        perms.push({
          key: "location", icon: MapPin, title: "Share Location",
          desc: "Find matches near you for better recommendations",
          request: async () => new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => { localStorage.setItem("perm_location", "granted"); resolve(true); },
              () => resolve(false), { timeout: 10000 }
            );
          }),
        });
      }
      if (navigator.mediaDevices && localStorage.getItem("perm_av") !== "granted") {
        perms.push({
          key: "camera", icon: Camera, title: "Camera Access",
          desc: "Take photos for your profile and video calls",
          request: async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              stream.getTracks().forEach((t) => t.stop());
              localStorage.setItem("perm_av", "granted");
              return true;
            } catch { return false; }
          },
        });
      }

      if (perms.length > 0) {
        setPending(perms);
        setCurrent(perms[0]);
      }
      setInitialized(true);
    };

    void syncAndBuild();
  }, [loading, session, location.pathname, dismissed, initialized]);

  const handleAllow = async () => {
    if (!current) return;
    await current.request();
    next();
  };

  const next = () => {
    const remaining = pending.filter((p) => p.key !== current?.key);
    setPending(remaining);
    if (remaining.length > 0) {
      setCurrent(remaining[0]);
    } else {
      setCurrent(null);
      setDismissed(true);
      localStorage.setItem("perm_dismissed", "true");
    }
  };

  if (!current) return null;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={current.key}
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-4 right-4 z-50 rounded-3xl bg-card border border-border/50 shadow-elevated p-5"
      >
        <button onClick={next} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-saffron text-white shadow-glow-primary flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-sm font-bold text-foreground">{current.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{current.desc}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={next}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground active:scale-95 transition-transform">
                Not Now
              </button>
              <button onClick={handleAllow}
                className="rounded-xl gradient-saffron px-4 py-2 text-xs font-bold text-white shadow-glow-primary active:scale-95 transition-transform flex items-center gap-1">
                <Check className="h-3 w-3" /> Allow
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PermissionRequests;
