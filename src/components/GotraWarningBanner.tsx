/**
 * Gotra Warning Banner — Shows advisory when profiles share same gotra
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { checkGotraCompatibility, getGotraWarningMessage } from '@/lib/gotraValidator';
import { useTranslation } from 'react-i18next';

interface GotraWarningBannerProps {
  viewerGotra: string | null | undefined;
  targetGotra: string | null | undefined;
}

const GotraWarningBanner = ({ viewerGotra, targetGotra }: GotraWarningBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const { i18n } = useTranslation();

  const status = checkGotraCompatibility(viewerGotra, targetGotra);

  if (status !== 'same_gotra' || dismissed) return null;

  const lang = (i18n.language?.slice(0, 2) || 'en') as 'en' | 'hi' | 'kn' | 'te';
  const message = getGotraWarningMessage(status, viewerGotra || '', targetGotra || '', lang);

  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="relative rounded-2xl border-2 border-amber-400/30 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-soft"
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Gotra Advisory
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GotraWarningBanner;
