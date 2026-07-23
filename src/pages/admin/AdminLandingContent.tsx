/**
 * AdminLandingContent — Section 7 Admin Management
 *
 * Allows admins to update the landing page tagline, member counts,
 * hero photo, and CTA text in real time.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Layout, Save, Loader2, Sparkles } from 'lucide-react';
import { uploadWithQuotaCheck } from '@/lib/storageQuota';
import { useAuth } from '@/contexts/AuthContext';

export const AdminLandingContent = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    tagline_line1: 'Find Your',
    tagline_line2: 'Sacred Bond',
    stat_profiles: 12500,
    stat_matches: 3400,
    stat_success: 890,
    hero_photo_url: '',
    cta_text: 'Begin Your Journey',
    cta_link: '/register',
  });

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('landing_content' as any)
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (data) {
        setForm({
          tagline_line1: data.tagline_line1 || 'Find Your',
          tagline_line2: data.tagline_line2 || 'Sacred Bond',
          stat_profiles: data.stat_profiles || 12500,
          stat_matches: data.stat_matches || 3400,
          stat_success: data.stat_success || 890,
          hero_photo_url: data.hero_photo_url || '',
          cta_text: data.cta_text || 'Begin Your Journey',
          cta_link: data.cta_link || '/register',
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('landing_content' as any)
      .upsert({
        id: 'default',
        ...form,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);
    if (error) {
      toast.error('Failed to save landing content');
      console.error(error);
      return;
    }

    toast.success('Landing page content updated successfully! ✨');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `landing/hero-${Date.now()}.${ext}`;

    const result = await uploadWithQuotaCheck(file, user.id, path, 'avatars', { upsert: true });

    setUploadingPhoto(false);
    if (!result.success || !result.publicUrl) {
      toast.error(result.error || 'Photo upload failed');
      return;
    }

    setForm((p) => ({ ...p, hero_photo_url: result.publicUrl! }));
    toast.success('Hero photo uploaded!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Landing Hero Editor</h1>
          <p className="text-xs text-muted-foreground">Customize headline copy, verified stats, and hero photo shown on the landing page</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Headlines */}
        <div className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft space-y-4">
          <h2 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Hero Tagline
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Line 1 (e.g. Find Your)</label>
              <input
                type="text"
                value={form.tagline_line1}
                onChange={(e) => setForm({ ...form, tagline_line1: e.target.value })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Line 2 (e.g. Sacred Bond)</label>
              <input
                type="text"
                value={form.tagline_line2}
                onChange={(e) => setForm({ ...form, tagline_line2: e.target.value })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft space-y-4">
          <h2 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Layout className="h-4 w-4 text-primary" /> Social Proof Numbers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Verified Profiles</label>
              <input
                type="number"
                value={form.stat_profiles}
                onChange={(e) => setForm({ ...form, stat_profiles: Number(e.target.value) })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Matches Made</label>
              <input
                type="number"
                value={form.stat_matches}
                onChange={(e) => setForm({ ...form, stat_matches: Number(e.target.value) })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Success Stories</label>
              <input
                type="number"
                value={form.stat_success}
                onChange={(e) => setForm({ ...form, stat_success: Number(e.target.value) })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Photo & CTA */}
        <div className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft space-y-4">
          <h2 className="font-heading text-sm font-bold text-foreground">Hero Photo & Call-To-Action</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Button Label</label>
              <input
                type="text"
                value={form.cta_text}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Destination Link</label>
              <input
                type="text"
                value={form.cta_link}
                onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                className="w-full rounded-xl bg-background border border-border/50 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Hero Phone Photo</label>
            <div className="flex items-center gap-4">
              {form.hero_photo_url ? (
                <img src={form.hero_photo_url} alt="Hero" className="h-16 w-16 rounded-xl object-cover border border-border/50" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  Default
                </div>
              )}
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors">
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl gradient-saffron px-6 py-3 text-sm font-bold text-white shadow-glow-primary active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Landing Content
        </button>
      </form>
    </div>
  );
};

export default AdminLandingContent;
