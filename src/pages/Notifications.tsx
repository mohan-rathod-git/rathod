import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  RotateCw,
  Heart,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  Settings,
  User,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNotifications, NotificationCategory, NotificationItem } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "interests", label: "Interests" },
  { key: "matches", label: "Matches" },
  { key: "messages", label: "Messages" },
  { key: "system", label: "System" },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, refresh } =
    useNotifications();
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filtered = notifications.filter((item) => {
    if (category === "all") return true;
    if (category === "likes" || category === "interests") return item.category === "interests";
    if (category === "matches") return item.category === "matches";
    if (category === "messages") return item.category === "messages";
    if (category === "system") return item.category === "system";
    return true;
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "match":
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case "interest_received":
        return <Heart className="h-4 w-4 text-primary" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-teal-500" />;
      case "system":
        return <ShieldAlert className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/50 px-4 pt-10 pb-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Updates & activity alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/80 text-foreground active:scale-95 transition-transform"
            >
              <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            </button>

            <button
              onClick={() => navigate("/notification-preferences")}
              aria-label="Notification Preferences"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/80 text-foreground active:scale-95 transition-transform"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-1 pb-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "gradient-saffron text-white shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 pt-4 space-y-3">
        {/* Mark All Read Action */}
        {unreadCount > 0 && (
          <div className="flex justify-end px-1">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-bold text-primary active:opacity-75 transition-opacity"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/40 animate-pulse"
              >
                <div className="h-11 w-11 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded-md w-3/4" />
                  <div className="h-3 bg-muted/60 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-card rounded-2xl border border-destructive/20 mt-4 space-y-3">
            <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
            <h3 className="font-heading text-sm font-bold text-foreground">{error}</h3>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-saffron text-xs font-bold text-white shadow-soft"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center bg-card rounded-2xl border border-border/40 mt-4 space-y-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">No Notifications</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {category === "all"
                ? "You're all caught up! New interests, matches, and messages will appear here."
                : `No notifications found under '${category}'.`}
            </p>
          </div>
        )}

        {/* Notification List */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2.5">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !item.read
                      ? "bg-card border-primary/30 shadow-soft"
                      : "bg-card/60 border-border/40 hover:bg-card"
                  }`}
                >
                  {/* Avatar / Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="h-11 w-11 rounded-full overflow-hidden bg-muted border border-border/40 flex items-center justify-center">
                      {item.fromUserPhoto ? (
                        <img
                          src={item.fromUserPhoto}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center shadow-xs border border-border/40">
                      {getIcon(item.type)}
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4
                        className={`text-xs text-foreground truncate ${
                          !item.read ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {item.body}
                    </p>
                  </div>

                  {/* Unread indicator / Arrow */}
                  <div className="flex items-center gap-1.5 self-center">
                    {!item.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      <BottomNav />

    </div>
  );
};

export default Notifications;
