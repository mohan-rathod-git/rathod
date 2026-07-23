/**
 * LegalPage — Consolidated Privacy Policy / Terms / Community Guidelines / Data & Cookies
 * Single URL `/legal` with anchored sections and sticky TOC.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const privacySections = [
  { title: "Information We Collect", content: "We collect information you provide during registration (name, email, phone, photos, community details) and automatically generated data (usage analytics, device information, IP address)." },
  { title: "How We Use Your Data", content: "Your data is used to match you with compatible profiles, deliver notifications, improve our services, and ensure platform safety. We never sell your personal information." },
  { title: "Data Sharing", content: "We share limited profile information with other registered users for matchmaking. We may share anonymized analytics with partners. Law enforcement requests are handled per applicable laws." },
  { title: "Data Security", content: "We use industry-standard encryption (TLS 1.3) for data in transit and AES-256 for data at rest. Passwords are hashed using bcrypt. We conduct regular security audits." },
  { title: "Your Rights", content: "You can access, modify, or delete your personal data at any time through your profile settings. You may request a complete data export by contacting support." },
];

const termsSections = [
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

const cookieSections = [
  { title: "Cookies & Tracking", content: "We use essential cookies for authentication and session management. Analytics cookies help us understand usage patterns. You can manage cookie preferences in your browser settings." },
  { title: "Data Retention", content: "Active account data is retained as long as your account exists. Deleted accounts are purged within 30 days. Chat messages are retained for 90 days after account deletion." },
  { title: "Contact Us", content: "For privacy concerns, contact our Data Protection Officer at privacy@banjarabandhan.com. We respond to all inquiries within 72 hours." },
];

interface LegalSection {
  id: string;
  label: string;
  sections: { title: string; content: string }[];
}

const allSections: LegalSection[] = [
  { id: 'privacy', label: 'Privacy Policy', sections: privacySections },
  { id: 'terms', label: 'Terms of Use', sections: termsSections },
  { id: 'community', label: 'Community Guidelines', sections: [
    { title: "[LEGAL TEXT PENDING — DO NOT SHIP]", content: "Community guidelines content will be provided by legal counsel. This section will cover: respectful interaction standards, prohibited behaviour, reporting procedures, enforcement actions, and appeal process." },
  ]},
  { id: 'cookies', label: 'Data & Cookies', sections: cookieSections },
];

const LegalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('privacy');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to anchor on mount/hash change
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && sectionRefs.current[hash]) {
      setActiveSection(hash);
      setTimeout(() => {
        sectionRefs.current[hash]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      for (const section of allSections) {
        const el = sectionRefs.current[section.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom > 120) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `/legal#${id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Legal</h1>
        </div>

        {/* Sticky TOC */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {allSections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                activeSection === s.id
                  ? 'gradient-saffron text-white shadow-glow-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md px-4 pt-5 space-y-8 animate-fade-up">
        <p className="text-xs text-muted-foreground">Last updated: April 1, 2026</p>

        {allSections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className="scroll-mt-28"
          >
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1 w-4 rounded-full bg-primary inline-block" />
              {section.label}
            </h2>
            <div className="space-y-3">
              {section.sections.map((s, i) => (
                <div key={i} className="rounded-2xl bg-card shadow-soft border border-border/50 p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalPage;
