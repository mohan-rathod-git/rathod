import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ShieldCheck, Clock, XCircle, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminVerification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("verification_requests" as any).select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;

    if (data && data.length > 0) {
      const userIds = [...new Set((data as any[]).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, photo_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setRequests((data as any[]).map((r: any) => ({ ...r, profile: profileMap.get(r.user_id) })));
    } else {
      setRequests([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleAction = async (requestId: string, userId: string, action: "approved" | "rejected", notes?: string) => {
    setProcessing(requestId);
    try {
      await supabase.from("verification_requests" as any).update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        admin_notes: notes || null,
      } as any).eq("id", requestId);

      if (action === "approved") {
        await supabase.from("profiles").update({ is_verified: true }).eq("user_id", userId);
      }

      toast.success(`Request ${action}`);
      await loadRequests();
    } catch {
      toast.error("Action failed");
    } finally {
      setProcessing(null);
    }
  };

  const statusIcon: Record<string, any> = { pending: Clock, approved: ShieldCheck, rejected: XCircle };
  const statusColor: Record<string, string> = { pending: "text-amber-600", approved: "text-emerald-600", rejected: "text-destructive" };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Verification Requests</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filter === f ? "gradient-saffron text-white shadow-glow-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {filter !== "all" ? filter : ""} requests</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {requests.map((req) => {
              const Icon = statusIcon[req.status] || Clock;
              return (
                <div key={req.id} className="rounded-2xl bg-card shadow-soft border border-border/50 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={req.profile?.photo_url || "/placeholder.svg"}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{req.profile?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${statusColor[req.status]}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {req.status}
                      </span>
                    </div>

                    <img
                      src={req.id_photo_url}
                      alt="Verification ID"
                      className="w-full rounded-xl object-contain max-h-56 bg-muted"
                    />
                  </div>

                  {req.status === "pending" && (
                    <div className="flex border-t border-border/50">
                      <button
                        onClick={() => handleAction(req.id, req.user_id, "rejected", "Photo unclear or doesn't meet guidelines")}
                        disabled={processing === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                      <div className="w-px bg-border/50" />
                      <button
                        onClick={() => handleAction(req.id, req.user_id, "approved")}
                        disabled={processing === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/5 transition-colors"
                      >
                        {processing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;
