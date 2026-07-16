import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

interface ProfilePhotoGalleryProps {
  alt: string;
  photos: string[];
}

const ProfilePhotoGallery = ({ alt, photos }: ProfilePhotoGalleryProps) => {
  const gallery = useMemo(() => Array.from(new Set(photos.filter(Boolean))), [photos]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [gallery.length]);

  if (gallery.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Images className="h-8 w-8" />
          <span className="text-xs font-medium">No photos yet</span>
        </div>
      </div>
    );
  }

  const activePhoto = gallery[activeIndex] ?? gallery[0];
  const showControls = gallery.length > 1;

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      <img src={activePhoto} alt={alt} className="h-full w-full object-cover" loading="eager" />

      {showControls && (
        <>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-card/80 text-foreground shadow-soft backdrop-blur-sm active:scale-95 transition-transform"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev + 1) % gallery.length)}
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-card/80 text-foreground shadow-soft backdrop-blur-sm active:scale-95 transition-transform"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2 overflow-x-auto scrollbar-none">
            {gallery.map((photo, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-14 w-12 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    isActive ? "border-primary shadow-glow-primary" : "border-card/70"
                  }`}
                  aria-label={`View photo ${index + 1}`}
                >
                  <img src={photo} alt={`${alt} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePhotoGallery;