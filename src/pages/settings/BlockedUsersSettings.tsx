import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, UserX, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BlockedUsersSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: blocks } = await supabase
      .from("blocked_users" as any)
      .select("*")
      .eq("blocker_id", user.id);

    const blockedIds = (blocks || []).map((block: any) => block.blocked_id);
    const { data: profiles } = blockedIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, photo_url, city_village, state").in("user_id", blockedIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((item: any) => [item.user_id, item]));
    setBlockedUsers((blocks || []).map((block: any) => ({
      ...block,
      blockedProfile: profileMap.get(block.blocked_id),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = async (blockId: string, name: string) => {
    const { error } = await supabase.from("blocked_users" as any).delete().eq("id", blockId);
    if (error) {
      toast.error("Failed to unblock user");
      return;
    }
    await loadBlockedUsers();
    toast.success(`${name || "User"} has been unblocked`);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/40 px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-muted active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Blocked Users
          </h1>
          <p className="text-xs text-muted-foreground">Manage users you have blocked from contacting you</p>
        </div>
      </div>

      {/* List */}
      <div className="max-w-md mx-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-16 px-4 bg-card rounded-3xl border border-border/40 my-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground mb-3">
              <UserX className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-base text-foreground">No Blocked Users</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              You haven't blocked anyone yet. Blocked profiles won't be able to send you messages or view your details.
            </p>
          </div>
        ) : (
          blockedUsers.map((item, index) => {
            const p = item.blockedProfile;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3.5 bg-card rounded-2xl border border-border/50 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={p?.photo_url || "/placeholder.svg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{p?.full_name || "Blocked User"}</h4>
                    <p className="text-xs text-muted-foreground">
                      {[p?.city_village, p?.state].filter(Boolean).join(", ") || "Location hidden"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(item.id, p?.full_name)}
                  className="px-3 py-1.5 rounded-xl border border-destructive/30 text-xs font-bold text-destructive hover:bg-destructive/10 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Unblock
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BlockedUsersSettings;
