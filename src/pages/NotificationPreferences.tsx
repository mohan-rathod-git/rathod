import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Bell, MessageCircle, Heart, Sparkles, Phone, Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PreferencesState = {
  push_notifications: boolean;
  interest_notifications: boolean;
  message_notifications: boolean;
  match_notifications: boolean;
  call_notifications: boolean;
  sound_enabled: boolean;
};

const defaultPreferences: PreferencesState = {
  push_notifications: true,
  interest_notifications: true,
  message_notifications: true,
  match_notifications: true,
  call_notifications: true,
  sound_enabled: true,
};

const NotificationPreferences = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesState>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof PreferencesState | null>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const loadPreferences = async () => {
      const { data } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        await supabase.from("notification_preferences" as any).upsert({ user_id: user.id }, { onConflict: "user_id" });
      }

      if (active) {
        setPreferences({ ...defaultPreferences, ...((data as Partial<PreferencesState>) || {}) });
        setLoading(false);
      }
    };

    loadPreferences();

    return () => {
      active = false;
    };
  }, [user]);

  const handleToggle = async (key: keyof PreferencesState) => {
    if (!user) return;

    const nextValue = !preferences[key];
    setPreferences((current) => ({ ...current, [key]: nextValue }));
    setSavingKey(key);

    const { error } = await supabase
      .from("notification_preferences" as any)
      .upsert({ user_id: user.id, [key]: nextValue }, { onConflict: "user_id" });

    setSavingKey(null);

    if (error) {
      setPreferences((current) => ({ ...current, [key]: !nextValue }));
      toast.error("Could not update preferences");
      return;
    }

    toast.success("Notification preferences updated");
  };

  const Toggle = ({
    on,
    onToggle,
    disabled,
  }: {
    on: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${on ? "bg-primary" : "bg-muted"} ${disabled ? "opacity-60" : ""}`}
    >
      <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-primary-foreground shadow-soft transition-transform duration-300 ${on ? "translate-x-5" : ""}`} />
    </button>
  );

  const Row = ({
    icon: Icon,
    title,
    description,
    prefKey,
  }: {
    icon: any;
    title: string;
    description: string;
    prefKey: keyof PreferencesState;
  }) => (
    <button
      onClick={() => handleToggle(prefKey)}
      className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors active:bg-muted/20"
    >
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-h-10 items-center">
        {savingKey === prefKey ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Toggle on={preferences[prefKey]} onToggle={() => handleToggle(prefKey)} />
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/80 px-4 pt-12 pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">Notification Preferences</h1>
            <p className="text-xs text-muted-foreground">Choose which live alerts you want to see</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-soft divide-y divide-border/50">
            <Row icon={Bell} title="Push Notifications" description="Master switch for all live app alerts" prefKey="push_notifications" />
            <Row icon={Heart} title="Interest Alerts" description="Notify me when someone sends an interest" prefKey="interest_notifications" />
            <Row icon={MessageCircle} title="Message Alerts" description="Show new message notifications in real time" prefKey="message_notifications" />
            <Row icon={Sparkles} title="Match Alerts" description="Celebrate mutual matches instantly" prefKey="match_notifications" />
            <Row icon={Phone} title="Call Alerts" description="Notify me about voice and video call activity" prefKey="call_notifications" />
            <Row icon={Volume2} title="Sound" description="Play sound for supported in-app notifications" prefKey="sound_enabled" />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationPreferences;