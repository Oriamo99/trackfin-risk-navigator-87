import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/apimo-api': {
        target: 'https://api.apimo.pro',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/apimo-api/, ''),
        secure: true,
      },
      '/mistral-api': {
        target: 'https://api.mistral.ai',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/mistral-api/, ''),
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
