/**
 * CropModal — In-app photo cropping before upload.
 *
 * Uses react-easy-crop for pan/zoom in a fixed 1:1 aspect ratio.
 * After cropping, resizes to max 1200px on long edge and compresses
 * to JPEG at 0.85 quality before passing to the upload handler.
 */

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CropModalProps {
  imageUrl: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  maxDimension?: number;
}

const MAX_DIM = 1200;
const JPEG_QUALITY = 0.85;

/**
 * Creates a cropped, resized, compressed blob from the source image.
 */
async function getCroppedBlob(
  imageSrc: string,
  cropArea: Area,
  maxDim: number = MAX_DIM
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Determine output size (cap at maxDim)
  let outW = cropArea.width;
  let outH = cropArea.height;
  if (outW > maxDim || outH > maxDim) {
    const scale = maxDim / Math.max(outW, outH);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

const CropModal = ({
  imageUrl,
  onConfirm,
  onCancel,
  aspectRatio = 1,
  maxDimension = MAX_DIM,
}: CropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageUrl, croppedArea, maxDimension);
      onConfirm(blob);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
      >
        {/* Cropper area */}
        <div className="flex-1 relative">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: { border: '2px solid rgba(201, 162, 39, 0.8)' },
            }}
          />
        </div>

        {/* Controls */}
        <div className="bg-black/80 backdrop-blur-xl px-4 py-4 pb-8 space-y-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary h-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="ml-2 h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white active:scale-[0.97] transition-transform"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl gradient-saffron py-3 text-sm font-bold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {processing ? 'Cropping…' : 'Use Photo'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CropModal;
