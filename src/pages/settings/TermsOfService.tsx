import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  { title: "1. Acceptance of Terms", content: "By creating an account on Banjara Bandhan, you agree to these Terms of Service. If you do not agree, please do not use our platform." },
  { title: "2. Eligibility", content: "You must be at least 18 years old and legally eligible for marriage under applicable laws to use this service. By registering, you confirm that all information provided is truthful." },
  { title: "3. Account Responsibilities", content: "You are responsible for maintaining the confidentiality of your login credentials. You must not share your account or impersonate another person. Report any unauthorized access immediately." },
  { title: "4. Acceptable Use", content: "You agree not to: post false information, harass other users, use the platform for commercial purposes, upload inappropriate content, or attempt to circumvent security measures." },
  { title: "5. Content Guidelines", content: "Profile photos must be recent, clear, and of yourself only. Offensive, explicit, or copyrighted content is prohibited and will result in immediate account suspension." },
  { title: "6. Premium Services", content: "Premium subscriptions are billed as per the chosen plan. Refunds are available within 7 days of purchase if no premium features were used. Auto-renewal can be cancelled at any time." },
  { title: "7. Limitation of Liability", content: "Banjara Bandhan facilitates introductions but does not guarantee compatibility or outcomes. We are not liable for any interactions between users outside our platform." },
  { title: "8. Termination", content: "We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through Settings." },
  { title: "9. Modifications", content: "We may update these terms periodically. Continued use after changes constitutes acceptance. Major changes will be communicated via email or in-app notification." },
  { title: "10. Governing Law", content: "These terms are governed by the laws of India. Disputes shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996." },
];

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Terms of Service</h1>
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

export default TermsOfService;
