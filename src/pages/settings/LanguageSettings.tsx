import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "మరాఠీ", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "కన్నడ", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
];

const LanguageSettings = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en");

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    i18n.changeLanguage(code);
    localStorage.setItem("i18nextLng", code);
    toast.success(`Language updated to ${LANGUAGES.find(l => l.code === code)?.name}`);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/40 px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-muted active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Select Language
          </h1>
          <p className="text-xs text-muted-foreground">Choose your preferred app display language</p>
        </div>
      </div>

      {/* Language Options Grid */}
      <div className="max-w-md mx-auto p-4 space-y-3 mt-2">
        {LANGUAGES.map((lang, index) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectLanguage(lang.code)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-soft ring-1 ring-primary/20"
                  : "bg-card border-border/50 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{lang.name}</h3>
                  <p className="text-xs text-muted-foreground">{lang.native}</p>
                </div>
              </div>

              {isSelected && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSettings;
