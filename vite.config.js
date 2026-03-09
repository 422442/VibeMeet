import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function livekitTokenPlugin() {
  return {
    name: 'livekit-token-api',
    configureServer(server) {
      server.middlewares.use('/api/token', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        const { roomName, participantName } = parsed;

        if (!roomName || !participantName) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing roomName or participantName' }));
          return;
        }

        if (!/^[A-Z0-9]{6}$/.test(roomName)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid room code format' }));
          return;
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.VITE_LIVEKIT_WS_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Server configuration missing. Check .env.local' }));
          return;
        }

        try {
          const { AccessToken } = await import('livekit-server-sdk');
          const token = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
            ttl: '2h',
          });

          token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
          });

          const jwt = await token.toJwt();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ token: jwt, wsUrl }));
        } catch (err) {
          console.error('Token generation error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to generate token' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), livekitTokenPlugin()],
  };
});
