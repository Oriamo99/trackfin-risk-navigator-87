import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security headers ───────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── Proxy Mistral OCR ──────────────────────────────────────
app.use('/api/mistral', createProxyMiddleware({
  target: 'https://api.mistral.ai',
  changeOrigin: true,
  pathRewrite: { '^/api/mistral': '' },
  on: {
    proxyReq: (proxyReq) => {
      if (process.env.MISTRAL_API_KEY) {
        proxyReq.setHeader('Authorization', `Bearer ${process.env.MISTRAL_API_KEY}`);
      }
    },
    error: (err, req, res) => {
      console.error('[Mistral proxy error]', err.message);
      res.status(502).json({ error: 'Mistral API unreachable' });
    },
  },
}));

// ─── Proxy Apimo ────────────────────────────────────────────
app.use('/api/apimo', createProxyMiddleware({
  target: 'https://api.apimo.pro',
  changeOrigin: true,
  pathRewrite: { '^/api/apimo': '' },
  on: {
    proxyReq: (proxyReq) => {
      if (process.env.APIMO_PROVIDER_ID && process.env.APIMO_TOKEN) {
        const credentials = Buffer.from(
          `${process.env.APIMO_PROVIDER_ID}:${process.env.APIMO_TOKEN}`
        ).toString('base64');
        proxyReq.setHeader('Authorization', `Basic ${credentials}`);
      }
    },
    error: (err, req, res) => {
      console.error('[Apimo proxy error]', err.message);
      res.status(502).json({ error: 'Apimo API unreachable' });
    },
  },
}));

// ─── Proxy DG Trésor (CORS workaround) ──────────────────────
app.use('/api/dgtresor', createProxyMiddleware({
  target: 'https://gels-avoirs.dgtresor.gouv.fr',
  changeOrigin: true,
  pathRewrite: { '^/api/dgtresor': '' },
  on: {
    error: (err, req, res) => {
      console.error('[DG Trésor proxy error]', err.message);
      res.status(502).json({ error: 'DG Trésor API unreachable' });
    },
  },
}));

// ─── Config publique (valeurs non sensibles) ─────────────────
app.get('/api/config', (req, res) => {
  res.json({
    apimoAgencyId: process.env.APIMO_AGENCY_ID || '',
  });
});

// ─── Health check (for Coolify) ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Static React files ─────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ─── SPA fallback (all non-API routes → index.html) ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TRACKFIN server running on port ${PORT}`);

  if (!process.env.MISTRAL_API_KEY) {
    console.warn('[WARN] MISTRAL_API_KEY not set — OCR will not work');
  }
  if (!process.env.APIMO_PROVIDER_ID || !process.env.APIMO_TOKEN) {
    console.warn('[WARN] APIMO credentials not set — CRM integration will not work');
  }
  if (!process.env.APIMO_AGENCY_ID) {
    console.warn('[WARN] APIMO_AGENCY_ID not set — CRM integration will not work');
  }
});
