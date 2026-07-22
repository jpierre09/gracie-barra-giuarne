import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      team: 'Gracie Barra Guarne',
      architecture: 'Monolithic PWA with Docker & Django Ready Backend',
      language: 'Spanish',
      timestamp: new Date().toISOString(),
    });
  });

  // Serve PWA Manifest & Service Worker directly
  app.get('/manifest.json', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
  });

  app.get('/service-worker.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'service-worker.js'));
  });

  // Simulated Email Reminders API
  app.post('/api/send-email-reminders', (req, res) => {
    const { students } = req.body;
    res.json({
      success: true,
      message: 'Alertas automáticas en español enviadas exitosamente.',
      recipientsCount: Array.isArray(students) ? students.length : 0,
      timestamp: new Date().toISOString(),
    });
  });

  // Vite Middleware in Development vs Static in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gracie Barra Guarne PWA] Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error iniciando el servidor:', err);
});
