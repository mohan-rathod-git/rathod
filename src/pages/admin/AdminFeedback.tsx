/**
 * AdminFeedback — View all user-submitted feedback
 *
 * Feedback is stored in admin_audit_log with action = 'USER_FEEDBACK'.
 * No separate table needed — reuses the existing audit infrastructure.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, MessageSquare, ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const PAGE_SIZE = 20;

const CATEGORIES = ['All', 'General Feedback', 'Feature Request', 'Bug Report', 'Match Quality', 'Safety & Trust'];

const ratingColor = (r: number) =>
  r >= 4 ? 'text-emerald-600' : r === 3 ? 'text-amber-600' : 'text-destructive';

const AdminFeedback = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = (supabase as any)
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .eq('action', 'USER_FEEDBACK')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category !== 'All') {
      // Filter inside the JSONB details column
      q = q.eq('details->>category', category);
    }

    const { data, count, error } = await q;
    if (!error) {
      setEntries(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Aggregate average rating
  const avgRating =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + (e.details?.rating || 0), 0) / entries.length).toFixed(1)
      : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User Feedback</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} submissions{avgRating ? ` · avg rating ${avgRating} / 5` : ''}
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(0); }}
            className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              category === cat ? 'gradient-saffron text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/30 p-4 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-4 w-64 bg-muted rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No feedback yet</p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const d = entry.details || {};
            const rating = d.rating || 0;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl bg-card border border-border/30 p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-bold ${ratingColor(rating)}`}>{rating}/5</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                    {d.category || 'General'}
                  </span>
                </div>

                <p className="text-sm text-foreground leading-relaxed mb-2">
                  {d.message || '(no message)'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{d.user_email || 'Anonymous'}</span>
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
