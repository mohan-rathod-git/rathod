import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Moon, Sun, Bell, Shield, Lock, Trash2, LogOut, ChevronRight, HelpCircle, FileText, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LanguagePicker from "@/components/LanguagePicker";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, user, profile, refreshProfile } = useAuth();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [hideProfile, setHideProfile] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const storageUsed = (profile as any)?.storage_used_bytes || 0;
  const STORAGE_MAX = 52428800; // 50MB
  const storagePct = Math.min(100, Math.round((storageUsed / STORAGE_MAX) * 100));
  const storageLabel = `${(storageUsed / 1048576).toFixed(1)} MB of 50 MB used`;

  const loadBlockedUsers = useCallback(async () => {
    if (!user) return;

    const { data: blocks } = await supabase
      .from("blocked_users" as any)
      .select("*")
      .eq("blocker_id", user.id);

    const blockedIds = (blocks || []).map((block: any) => block.blocked_id);
    const { data: profiles } = blockedIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, photo_url").in("user_id", blockedIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((item: any) => [item.user_id, item]));
    setBlockedUsers((blocks || []).map((block: any) => ({
      ...block,
      blockedProfile: profileMap.get(block.blocked_id),
    })));
  }, [user]);

  useEffect(() => {
    if (profile) {
      // Use dedicated is_hidden column (not registration_step hack)
      setHideProfile(!!(profile as any).is_hidden);
    }
  }, [profile]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleHideProfile = async () => {
    if (!user) return;
    const newVal = !hideProfile;
    // Optimistic UI
    setHideProfile(newVal);
    const { error } = await supabase.from("profiles").update({
      is_hidden: newVal,
    } as any).eq("user_id", user.id);
    if (error) {
      // Roll back on failure
      setHideProfile(!newVal);
      toast.error("Failed to update — please try again");
      return;
    }
    await refreshProfile();
    toast.success(newVal ? "Profile hidden from discovery" : "Profile visible again");
  };

  const handleUnblock = async (blockId: string) => {
    await supabase.from("blocked_users" as any).delete().eq("id", blockId);
    await loadBlockedUsers();
    toast.success("User unblocked");
  };

  const handleLogout = async () => { await signOut(); toast.success("Logged out"); navigate("/login", { replace: true }); };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${on ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-300 ${on ? "translate-x-5" : ""}`} />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="rounded-2xl bg-card shadow-soft divide-y divide-border/50 overflow-hidden">{children}</div>
    </div>
  );

  const Row = ({ icon: Icon, label, right, onClick, danger }: any) => (
    <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted/20 transition-colors ${danger ? "text-destructive" : "text-foreground"}`}>
      <Icon className={`h-4 w-4 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {right || <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 animate-fade-up">
        <Section title="Appearance">
          <Row icon={darkMode ? Moon : Sun} label="Dark Mode" right={<Toggle on={darkMode} onToggle={toggleDark} />} onClick={toggleDark} />
        </Section>

        <Section title="Language">
          <div className="px-1">
            <LanguagePicker variant="inline" />
          </div>
        </Section>

        <Section title="Notifications">
          <Row icon={Bell} label="Notification Preferences" onClick={() => navigate("/notification-preferences")} />
        </Section>

        <Section title="Privacy">
          <Row icon={Shield} label="Hide Profile" right={<Toggle on={hideProfile} onToggle={handleHideProfile} />} onClick={handleHideProfile} />
          {/* Storage usage bar */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Storage Used</span>
              <span className="text-xs text-muted-foreground">{storageLabel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePct > 90 ? 'bg-destructive' : storagePct > 70 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${storagePct}%` }}
              />
            </div>
            {storagePct > 90 && (
              <p className="text-[10px] text-destructive font-semibold">
                Almost full! Delete photos to free space.
              </p>
            )}
          </div>
          <Row icon={Lock} label={`Blocked Users (${blockedUsers.length})`} onClick={() => setShowBlocked(!showBlocked)} />
        </Section>

        {showBlocked && (
          <div className="mb-5 space-y-2">
            {blockedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No blocked users</p>
              ) : blockedUsers.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft border border-border/50">
                <img src={b.blockedProfile?.photo_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-xl object-cover" />
                <span className="flex-1 text-sm font-medium text-foreground">{b.blockedProfile?.full_name || "User"}</span>
                <button onClick={() => handleUnblock(b.id)} className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 active:scale-95 transition-transform">
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}

        <Section title="Help & Legal">
          <Row icon={HelpCircle} label="About Us" onClick={() => navigate("/about")} />
          <Row icon={HelpCircle} label="FAQ & Support" onClick={() => navigate("/settings/faq")} />
          <Row icon={FileText} label="Privacy Policy" onClick={() => navigate("/legal#privacy")} />
          <Row icon={FileText} label="Terms of Service" onClick={() => navigate("/legal#terms")} />
          <Row icon={FileText} label="Community Guidelines" onClick={() => navigate("/legal#community")} />
        </Section>

        <Section title="Account">
          <Row icon={LogOut} label="Logout" onClick={handleLogout} />
          <Row icon={Trash2} label="Delete Account" danger onClick={() => navigate("/settings/delete-account")} />
        </Section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
