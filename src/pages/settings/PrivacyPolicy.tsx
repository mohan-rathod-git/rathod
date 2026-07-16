import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  { title: "Information We Collect", content: "We collect information you provide during registration (name, email, phone, photos, community details) and automatically generated data (usage analytics, device information, IP address)." },
  { title: "How We Use Your Data", content: "Your data is used to match you with compatible profiles, deliver notifications, improve our services, and ensure platform safety. We never sell your personal information." },
  { title: "Data Sharing", content: "We share limited profile information with other registered users for matchmaking. We may share anonymized analytics with partners. Law enforcement requests are handled per applicable laws." },
  { title: "Data Security", content: "We use industry-standard encryption (TLS 1.3) for data in transit and AES-256 for data at rest. Passwords are hashed using bcrypt. We conduct regular security audits." },
  { title: "Your Rights", content: "You can access, modify, or delete your personal data at any time through your profile settings. You may request a complete data export by contacting support." },
  { title: "Cookies & Tracking", content: "We use essential cookies for authentication and session management. Analytics cookies help us understand usage patterns. You can manage cookie preferences in your browser settings." },
  { title: "Data Retention", content: "Active account data is retained as long as your account exists. Deleted accounts are purged within 30 days. Chat messages are retained for 90 days after account deletion." },
  { title: "Contact Us", content: "For privacy concerns, contact our Data Protection Officer at privacy@banjarabandhan.com. We respond to all inquiries within 72 hours." },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Privacy Policy</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-4 animate-fade-up">
        <p className="text-xs text-muted-foreground">Last updated: April 1, 2026</p>
        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl bg-card shadow-soft border border-border/50 p-4">
            <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
