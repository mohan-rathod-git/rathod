import { ArrowLeft, MessageCircle, Mail, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const faqs = [
  { q: "How do I verify my profile?", a: "Upload a clear selfie holding your ID. Our team reviews it within 24-48 hours and adds a verified badge to your profile." },
  { q: "How do I send an interest?", a: "Visit any profile and tap the ❤️ heart button. The other person will be notified instantly. If they accept, you both become a match!" },
  { q: "Is my data safe?", a: "Absolutely. We use end-to-end encryption for messages and never share your personal information with third parties." },
  { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account. Your data will be permanently removed within 30 days." },
  { q: "Can I hide my profile temporarily?", a: "Yes! Toggle 'Hide Profile' in Settings → Privacy. Your profile becomes invisible until you turn it back on." },
  { q: "How do voice/video calls work?", a: "Once you have a mutual match, open the chat and tap the phone or video icon. Calls use peer-to-peer WebRTC for privacy." },
  { q: "What is a premium membership?", a: "Premium unlocks unlimited interests, advanced filters, profile boosts, and the ability to see who viewed your profile." },
];

const FAQSupport = () => {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">FAQ & Support</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-4 animate-fade-up">
        <div className="rounded-2xl bg-card shadow-soft border border-border/50 overflow-hidden divide-y divide-border/50">
          {faqs.map((faq, i) => (
            <button key={i} onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full text-left px-4 py-4 active:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`} />
              </div>
              {openIdx === i && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Still need help?</h3>
          <div className="flex gap-3">
            <a href="mailto:support@banjarabandhan.com" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary py-3 text-xs font-semibold active:scale-95 transition-transform">
              <Mail className="h-4 w-4" /> Email Us
            </a>
            <button className="flex-1 flex items-center justify-center gap-2 rounded-xl gradient-saffron text-white py-3 text-xs font-bold shadow-glow-primary active:scale-95 transition-transform">
              <MessageCircle className="h-4 w-4" /> Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSupport;
