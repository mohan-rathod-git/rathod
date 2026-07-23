/**
 * Language Picker Component
 *
 * Used in Settings and Login pages. Shows supported languages
 * with native labels and allows switching with immediate effect.
 */

import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface LanguagePickerProps {
  variant?: 'dropdown' | 'inline';
}

const LanguagePicker = ({ variant = 'dropdown' }: LanguagePickerProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = i18n.language?.slice(0, 2) || 'en';

  const handleChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('bb_language', langCode);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className="space-y-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <motion.button
            key={lang.code}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleChange(lang.code)}
            className={`flex w-full items-center justify-between rounded-2xl p-3.5 transition-all ${
              currentLang === lang.code
                ? 'bg-primary/10 border-2 border-primary/30 shadow-soft'
                : 'bg-card border-2 border-transparent hover:border-border/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{lang.nativeLabel}</span>
              <span className="text-sm text-muted-foreground">({lang.label})</span>
            </div>
            {currentLang === lang.code && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-medium text-foreground shadow-soft border border-border/30 hover:shadow-medium transition-all"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span>{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeLabel || 'English'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl bg-card shadow-elevated border border-border/30 overflow-hidden"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleChange(lang.code)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-primary/5 ${
                    currentLang === lang.code ? 'text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  <span>{lang.nativeLabel}</span>
                  {currentLang === lang.code && <Check className="h-4 w-4" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguagePicker;
