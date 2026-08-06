/**
 * AdminHeroBanner — Hero Banner Management (super_admin only)
 *
 * Super admin can upload a video or image for the home hero section,
 * or revert to the animated gradient.
 * Files are stored in Supabase Storage bucket: hero-banners
 */

import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { logAdminAction } from '@/lib/adminAudit';
import { toast } from 'sonner';
import {
  Image, Video, Sparkles, Upload, X, Loader2,
  CheckCircle2, Play, Trash2, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const BUCKET = 'hero-banners';

type HeroType = 'gradient' | 'image' | 'video';

const AdminHeroBanner = () => {
  const { user: adminUser } = useAuth();
  const { heroType: currentHeroType, heroUrl: currentHeroUrl, activeTheme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<HeroType>(currentHeroType);
  const [manualUrl, setManualUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!adminUser) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Only image or video files are allowed');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Max size is 50MB.');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${ext}`;

    const { error: uploadError, data } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    setPreviewUrl(publicUrl);
    setSelectedType(isVideo ? 'video' : 'image');
    setUploading(false);
    toast.success('File uploaded! Click "Apply to Hero" to go live.');
  };

  const handleApply = async () => {
    if (!adminUser) return;
    setSaving(true);

    const urlToSave = selectedType === 'gradient' ? null : (previewUrl || manualUrl || null);
    const heroTypeToSave = selectedType;

    await logAdminAction(adminUser.id, {
      action: 'role_change' as any,
      targetType: 'system',
      targetId: 'global_settings',
      details: { op: 'hero_banner_change', hero_type: heroTypeToSave, hero_url: urlToSave },
    });

    const { error } = await (supabase as any)
      .from('global_settings')
      .upsert(
        {
          id: 'main',
          hero_type: heroTypeToSave,
          hero_url: urlToSave,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      toast.error(`Failed to apply: ${error.message}`);
    } else {
      toast.success(
        heroTypeToSave === 'gradient'
          ? 'Reverted to animated gradient hero!'
          : `${heroTypeToSave === 'video' ? 'Video' : 'Image'} banner is now live for all users!`
      );
    }
    setSaving(false);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedType('gradient');
    setManualUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const modeCards = [
    {
      type: 'gradient' as HeroType,
      icon: Sparkles,
      label: 'Animated Gradient',
      desc: 'Beautiful animated gradient from the active theme — no upload needed',
    },
    {
      type: 'image' as HeroType,
      icon: Image,
      label: 'Static Image',
      desc: 'Upload a JPG/PNG/WebP image as the hero background',
    },
    {
      type: 'video' as HeroType,
      icon: Video,
      label: 'Video Banner',
      desc: 'Upload an MP4/WebM video that plays silently in the hero',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Image className="h-6 w-6 text-primary" />
          Hero Banner
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Control what appears in the home page hero section for all users.
        </p>
      </div>

      {/* Current Status */}
      <div className="mb-6 rounded-2xl bg-card border border-border/30 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Currently Live: {currentHeroType === 'gradient' ? 'Animated Gradient' : currentHeroType === 'video' ? 'Video Banner' : 'Image Banner'}
          </p>
          {currentHeroUrl && (
            <p className="text-[10px] text-muted-foreground truncate max-w-xs">{currentHeroUrl}</p>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {modeCards.map(({ type, icon: Icon, label, desc }) => (
          <motion.button
            key={type}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedType(type)}
            className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
              selectedType === type
                ? 'border-primary bg-primary/5 shadow-soft'
                : 'border-border/30 bg-card hover:border-primary/20'
            }`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${selectedType === type ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Upload Area (image/video) */}
      {selectedType !== 'gradient' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {selectedType === 'video'
                ? 'Recommended: MP4, max 50MB, 16:9 ratio, short loop (5–15s)'
                : 'Recommended: JPG/PNG/WebP, 1080×400px or wider'}
            </p>
          </div>

          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-border/30">
              {selectedType === 'video' ? (
                <video src={previewUrl} className="w-full h-48 object-cover" muted autoPlay loop playsInline />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              )}
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 rounded-full bg-black/50 text-white text-[10px] px-2.5 py-1 font-bold flex items-center gap-1">
                <Play className="h-3 w-3" />
                Preview
              </div>
            </div>
          ) : (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 py-12 cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading to Supabase Storage...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">Click to upload {selectedType === 'video' ? 'video' : 'image'}</p>
                  <p className="text-[11px] text-muted-foreground">Max 50MB</p>
                </>
              )}
            </motion.div>
          )}

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={selectedType === 'video' ? 'video/*' : 'image/*'}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />

          {/* Manual URL input */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1.5">Or enter a direct URL:</p>
            <input
              type="url"
              placeholder={`https://example.com/hero.${selectedType === 'video' ? 'mp4' : 'jpg'}`}
              value={manualUrl}
              onChange={(e) => { setManualUrl(e.target.value); setPreviewUrl(null); }}
              className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </motion.div>
      )}

      {/* Gradient preview */}
      {selectedType === 'gradient' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-2xl overflow-hidden border border-border/30 h-32 relative"
          style={{ background: activeTheme.heroGradient }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/80 text-sm font-semibold drop-shadow">Live Animated Gradient Preview</p>
          </div>
        </motion.div>
      )}

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={saving || (selectedType !== 'gradient' && !previewUrl && !manualUrl)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-soft hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Applying to all users...</>
        ) : selectedType === 'gradient' ? (
          <><Sparkles className="h-4 w-4" /> Apply Animated Gradient</>
        ) : (
          <><CheckCircle2 className="h-4 w-4" /> Apply {selectedType === 'video' ? 'Video' : 'Image'} Banner</>
        )}
      </button>

      {/* Remove banner */}
      {(currentHeroType !== 'gradient') && (
        <button
          onClick={() => { setSelectedType('gradient'); handleApply(); }}
          className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-all"
        >
          <Trash2 className="h-4 w-4" />
          Remove Banner — Revert to Gradient
        </button>
      )}
    </div>
  );
};

export default AdminHeroBanner;
