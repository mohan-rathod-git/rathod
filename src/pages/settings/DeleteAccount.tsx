import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE" || !user) return;
    setDeleting(true);
    try {
      // Hide profile and clear data
      await supabase.from("profiles").update({ registration_step: -1, full_name: "Deleted User", photo_url: null, about: null, phone: null }).eq("user_id", user.id);
      await signOut();
      toast.success("Account scheduled for deletion. Your data will be removed within 30 days.");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-destructive">Delete Account</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-5 animate-fade-up">
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-5 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-destructive">This action is permanent</h3>
            <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
              Deleting your account will permanently remove your profile, matches, messages, and all associated data within 30 days. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">What will be deleted:</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {["Your profile and photos", "All matches and interests", "Chat messages", "Notification preferences", "Subscription data"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-5 space-y-3">
          <label className="text-sm font-bold text-foreground">
            Type <span className="text-destructive font-mono">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-destructive/30"
          />
          <button
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || deleting}
            className="w-full rounded-xl bg-destructive text-white py-3 text-sm font-bold disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {deleting ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
