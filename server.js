/**
 * Servidor Next.js Standalone para Electron
 * Se ejecuta cuando la app está empaquetada como .exe
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // Siempre producción en .exe
const hostname = 'localhost';
const port = 3000;

// Crear app Next.js
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
