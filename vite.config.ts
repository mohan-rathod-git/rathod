import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // lovable-tagger is dev-only — dynamically imported to avoid ESM/CJS issues on Vercel
    mode === "development" && {
      name: 'lovable-tagger-loader',
      async configResolved() {
        try {
          const { componentTagger } = await import("lovable-tagger");
          if (componentTagger) componentTagger();
        } catch {
          // not installed in production — safe to ignore
        }
      },
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["placeholder.svg", "robots.txt"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /\/auth\/v1\/callback/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
      },
      manifest: {
        name: "Banjara Bandhan - Matrimony",
        short_name: "Banjara Bandhan",
        description: "Connecting Souls of the Wandering Star — Banjara Community Matrimony App",
        theme_color: "#E8541E",
        background_color: "#FDF6EC",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover', 'lucide-react', 'framer-motion'],
        },
      },
    },
  },
}));
