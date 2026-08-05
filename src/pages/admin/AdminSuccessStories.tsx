/**
 * AdminSuccessStories — Manage curated success stories shown on the app.
 *
 * Admins can add, edit, and delete success story entries stored in
 * the success_stories table. Stories appear on the public /success-stories page.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/lib/adminAudit';
import { toast } from 'sonner';
import { Heart, Plus, Trash2, Edit2, Save, X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: string;
  names: string;
  location: string;
  date: string;
  quote: string;
  photo_url?: string;
  is_featured: boolean;
  created_at: string;
}

const EMPTY_FORM = { names: '', location: '', date: '', quote: '', photo_url: '', is_featured: false };

const AdminSuccessStories = () => {
  const { user: adminUser } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('success_stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setStories(data || []);
    else {
      // Table might not exist yet — show empty state with helpful note
      setStories([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); };

  const startEdit = (s: Story) => {
    setForm({ names: s.names, location: s.location, date: s.date, quote: s.quote, photo_url: s.photo_url || '', is_featured: s.is_featured });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.names.trim() || !form.quote.trim()) {
      toast.error('Names and quote are required');
      return;
    }
    if (!adminUser) return;
    setSaving(true);

    if (editId) {
      // Update
      const { error } = await (supabase as any)
        .from('success_stories')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editId);

      if (error) { toast.error('Failed to update story'); }
      else {
        await logAdminAction(adminUser.id, { action: 'verify_user', targetType: 'system', targetId: editId, details: { op: 'update_story', names: form.names } });
        toast.success('Story updated');
        resetForm();
        load();
      }
    } else {
      // Insert
      const { error } = await (supabase as any)
        .from('success_stories')
        .insert({ ...form, created_at: new Date().toISOString() });

      if (error) {
        if (error.message?.includes('does not exist')) {
          toast.error('success_stories table not found. Please run the SQL migration first.', { duration: 8000 });
        } else {
          toast.error('Failed to add story');
        }
      } else {
        toast.success('Story added!');
        resetForm();
        load();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, names: string) => {
    if (!adminUser) return;
    setDeleting(id);
    const { error } = await (supabase as any).from('success_stories').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); }
    else {
      await logAdminAction(adminUser.id, { action: 'verify_user', targetType: 'system', targetId: id, details: { op: 'delete_story', names } });
      toast.success('Story deleted');
      load();
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Success Stories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stories.length} stories — shown on the /success-stories page
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-saffron text-white text-sm font-bold shadow-soft"
        >
          <Plus className="h-4 w-4" />
          Add Story
        </button>
      </div>

      {/* SQL migration hint */}
      {!loading && stories.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
            📋 Run this SQL in Supabase first if the table doesn't exist:
          </p>
          <pre className="text-[10px] text-muted-foreground bg-muted/50 rounded-xl p-3 overflow-x-auto leading-relaxed">{`CREATE TABLE IF NOT EXISTS public.success_stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  names       TEXT NOT NULL,
  location    TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL DEFAULT '',
  quote       TEXT NOT NULL,
  photo_url   TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read stories" ON public.success_stories FOR SELECT USING (true);
CREATE POLICY "Admins can manage stories" ON public.success_stories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());`}</pre>
        </div>
      )}

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 rounded-2xl bg-card border border-border/30 p-5 shadow-soft"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-bold text-foreground">
                {editId ? 'Edit Story' : 'Add New Story'}
              </h3>
              <button onClick={resetForm} className="h-8 w-8 flex items-center justify-center rounded-xl bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Couple Names *</label>
                <input
                  value={form.names}
                  onChange={(e) => setForm(f => ({ ...f, names: e.target.value }))}
                  placeholder="e.g. Rahul & Meena Rathod"
                  className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Marriage Date</label>
                <input
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  placeholder="e.g. March 2025"
                  className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Photo URL (optional)</label>
                <input
                  value={form.photo_url}
                  onChange={(e) => setForm(f => ({ ...f, photo_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Their Quote *</label>
                <textarea
                  value={form.quote}
                  onChange={(e) => setForm(f => ({ ...f, quote: e.target.value }))}
                  placeholder="Their love story in their own words..."
                  rows={3}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.is_featured}
                  onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium text-foreground cursor-pointer">
                  Feature prominently (shown first)
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editId ? 'Update' : 'Add Story'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : stories.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No success stories yet — add the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-card border border-border/30 p-4 shadow-soft relative group"
            >
              {story.is_featured && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Featured
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                {story.photo_url ? (
                  <img src={story.photo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-foreground">{story.names}</p>
                  <p className="text-[10px] text-muted-foreground">{story.location} · {story.date}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed mb-4 line-clamp-3">
                "{story.quote}"
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => startEdit(story)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(story.id, story.names)}
                  disabled={deleting === story.id}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  {deleting === story.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSuccessStories;
