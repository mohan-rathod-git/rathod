/**
 * AdminBroadcasts — Section 6: Notification Broadcasting
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/lib/adminAudit';
import { toast } from 'sonner';
import { Megaphone, Send, Clock, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminBroadcasts = () => {
  const { user: adminUser } = useAuth();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', deepLink: '' });
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_broadcasts' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setBroadcasts(data as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBroadcasts(); }, [fetchBroadcasts]);

  // Rate limit: 1 broadcast per hour (client-side)
  const canSend = !lastSentAt || Date.now() - lastSentAt > 3600_000;
  const cooldownRemaining = lastSentAt
    ? Math.max(0, Math.ceil((3600_000 - (Date.now() - lastSentAt)) / 60_000))
    : 0;

  const handleSend = async () => {
    if (!adminUser || !form.title.trim() || !form.body.trim() || !canSend) return;
    setSending(true);

    // Count recipients (all active users)
    const { count: recipientCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Log to audit trail
    await logAdminAction(adminUser.id, {
      action: 'broadcast_sent',
      targetType: 'broadcast',
      targetId: 'new',
      details: { title: form.title, recipient_count: recipientCount },
    });

    // Insert broadcast record
    const { error } = await supabase
      .from('admin_broadcasts' as any)
      .insert({
        admin_id: adminUser.id,
        title: form.title,
        body: form.body,
        deep_link: form.deepLink || null,
        recipient_count: recipientCount || 0,
        status: 'sent',
        sent_at: new Date().toISOString(),
      } as any);

    if (error) {
      toast.error('Failed to send broadcast');
    } else {
      toast.success(`Broadcast sent to ${recipientCount?.toLocaleString()} users`);
      setLastSentAt(Date.now());
      setForm({ title: '', body: '', deepLink: '' });
      setShowCompose(false);
      fetchBroadcasts();
    }
    setSending(false);
  };

  const statusIcons: Record<string, React.ElementType> = {
    draft: Clock,
    sent: CheckCircle,
    failed: XCircle,
  };

  const statusColors: Record<string, string> = {
    draft: 'text-muted-foreground',
    sent: 'text-emerald-600',
    failed: 'text-destructive',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Broadcasts</h1>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-saffron text-white text-sm font-bold shadow-glow-primary"
        >
          <Megaphone className="h-4 w-4" />
          New Broadcast
        </button>
      </div>

      {/* Compose form */}
      {showCompose && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl bg-card border border-border/30 p-5 shadow-soft"
        >
          <h3 className="font-heading text-sm font-bold text-foreground mb-4">Compose Broadcast</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title..."
                maxLength={100}
                className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Body *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Notification message..."
                rows={3}
                maxLength={500}
                className="w-full rounded-xl bg-muted px-4 py-3 text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{form.body.length}/500</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Deep Link (optional)</label>
              <input
                value={form.deepLink}
                onChange={(e) => setForm(f => ({ ...f, deepLink: e.target.value }))}
                placeholder="/explore, /settings, etc."
                className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Preview */}
            {form.title && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> Preview
                </p>
                <div className="rounded-xl bg-card p-3 shadow-soft">
                  <p className="text-sm font-bold text-foreground">{form.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{form.body}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {!canSend && (
                <p className="text-xs text-amber-600 font-medium">
                  Rate limited — wait {cooldownRemaining} min
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!form.title.trim() || !form.body.trim() || !canSend || sending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/30 p-4 animate-pulse">
              <div className="h-5 w-48 bg-muted rounded mb-2" />
              <div className="h-4 w-72 bg-muted rounded" />
            </div>
          ))
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No broadcasts sent yet</p>
          </div>
        ) : (
          broadcasts.map((bc: any) => {
            const StatusIcon = statusIcons[bc.status] || Clock;
            return (
              <div key={bc.id} className="rounded-2xl bg-card border border-border/30 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{bc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bc.body}</p>
                  </div>
                  <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColors[bc.status]}`} />
                </div>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span>{bc.recipient_count?.toLocaleString()} recipients</span>
                  <span>·</span>
                  <span>{new Date(bc.sent_at || bc.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminBroadcasts;
