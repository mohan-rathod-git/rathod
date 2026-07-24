<div align="center">

# 💕 Banjara Bandhan

### *Connecting Souls of the Wandering Star*

A premium matrimony platform built exclusively for the **Banjara-Lambani community** — where tradition meets technology to help you find your perfect life partner.

[![Live App](https://img.shields.io/badge/Live-App-E8541E?style=for-the-badge&logo=vercel&logoColor=white)](https://banjarabandhan.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## ✨ Features

### 🏠 Discovery & Matching
- **Smart Recommendations** — Weighted scoring engine with preference overlap, freshness, reciprocity, and diversity injection
- **Advanced Filters** — Filter by age, location, education, occupation, community, gotra, and more
- **Interest State Machine** — Send interests, receive matches, track status (None → Interest Sent → Matched)
- **Gotra Exogamy Validation** — Cultural advisory for same-gotra matches with respectful guidance

### 💬 Chat & Communication
- **Real-time Messaging** — Instant messages with typing indicators and read receipts
- **Couple Chat Themes** — 6 curated romantic themes (Saffron Love, Rose Garden, Golden Hour, and more)
- **Animated Emoji Reactions** — Long-press reaction picker with spring pop animations, double-tap-to-heart
- **Voice & Video Calls** — WebRTC-powered calls (unlocked at Friend tier)
- **Friend Tier System** — Layered trust: Match → Friend → unlocked call features
- **Content Moderation** — Automatic filtering of phone numbers, emails, links, and profanity

### 👤 Profile & Privacy
- **Multi-Step Registration** — Guided 3-step profile creation with photo crop tool
- **Photo Privacy Matrix** — Blur/filter controls based on match status
- **Hide Profile** — Toggle visibility from discovery feeds (server-side enforced)
- **Profile Verification** — Admin-reviewed identity verification flow
- **50MB Storage Quota** — Per-user storage management with visual usage meter

### 🌐 Internationalization
- **6 Languages** — English, Hindi, Telugu, Marathi, Kannada, Tamil
- **Persistent Language Selection** — Survives page refresh and re-login

### 🔔 Notifications
- **Real-time Alerts** — Live notifications for interests, messages, matches, and calls
- **Granular Preferences** — Toggle individual notification types on/off
- **Sound Controls** — Per-category sound enable/disable

### 🛡️ Safety & Security
- **Block & Report System** — Instant user blocking with structured abuse reporting
- **RLS Security** — Row Level Security policies across all Supabase tables
- **Enterprise Security Headers** — HSTS, Referrer-Policy, Permissions-Policy
- **Admin Dashboard** — User management, abuse reports, broadcast notifications, analytics, audit logs

### 📱 Progressive Web App
- **Installable PWA** — Add to home screen on Android, iOS, and desktop
- **Offline-Ready** — Service worker with smart caching strategies
- **Responsive Design** — Mobile-first with fluid typography and safe area support

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3, CSS Variables, Framer Motion |
| **UI Components** | Radix UI, shadcn/ui, Lucide Icons |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **Authentication** | Email/Password, Phone OTP, Email OTP, Google OAuth |
| **State Management** | React Context, TanStack React Query |
| **i18n** | i18next, react-i18next |
| **Forms** | React Hook Form, Zod validation |
| **Real-time** | Supabase Realtime (Postgres Changes), WebRTC |
| **Deployment** | Vercel (with PWA via vite-plugin-pwa) |
| **SEO** | react-helmet-async, Open Graph, Twitter Cards |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **bun**
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/banjara-bandhan.git
cd banjara-bandhan

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase (required)
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"

# Twilio (optional — for phone OTP via Supabase)
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

> ⚠️ **Never commit real secret values.** Use `.env.example` as a reference template.

### Database Setup

Apply the Supabase migrations to set up the required tables:

```bash
# Using the complete migration file
# Import supabase/COMPLETE_MIGRATION_NEW_PROJECT.sql into your Supabase SQL editor
```

---

## 📁 Project Structure

```
rathod/
├── public/                  # Static assets (logo, PWA icons, splash screens)
├── src/
│   ├── assets/              # App assets
│   ├── components/          # Reusable components
│   │   ├── chat/            # Chat-specific components (composer, reactions, themes)
│   │   ├── graphics/        # SVG graphics and decorative components
│   │   ├── landing/         # Landing page components
│   │   ├── profile/         # Profile-related components
│   │   └── ui/              # shadcn/ui base components
│   ├── contexts/            # React contexts (AuthContext)
│   ├── data/                # Static data files
│   ├── hooks/               # Custom React hooks
│   ├── i18n/                # Internationalization (6 language bundles)
│   ├── integrations/        # Third-party integrations (Supabase client)
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Route pages
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── auth/            # Authentication pages
│   │   ├── legal/           # Legal pages (Privacy, Terms, etc.)
│   │   └── settings/        # Settings sub-pages
│   └── types/               # TypeScript type definitions
├── supabase/                # Database migrations and config
├── tests/                   # Test files
├── vercel.json              # Vercel deployment config
├── vite.config.ts           # Vite build configuration
└── tailwind.config.ts       # Tailwind CSS configuration
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your repository to [Vercel](https://vercel.com)
2. Set the following in Project Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --include=dev`
3. Add environment variables in Vercel Dashboard:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
4. Deploy!

> **Note:** Node version is pinned to `>=18` in `package.json` engines field. Do not remove this — it prevents deployment failures from Node version mismatches.

### Google OAuth Setup

See the [OAuth Setup Checklist](./OAUTH_SETUP_CHECKLIST.md) for step-by-step configuration of Google Sign-In across Google Cloud Console, Supabase Dashboard, and Supabase Auth Settings.

---

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |

---

## 🤝 Contributing

Banjara Bandhan is built with love for the Banjara-Lambani community. If you'd like to contribute, please reach out to the founder.

---

<div align="center">

**Made with ❤️ for the Banjara Community**

*Where traditions meet hearts* ✨

</div>
