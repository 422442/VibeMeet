import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomName, participantName } = req.body;

  if (!roomName || !participantName) {
    return res.status(400).json({ error: 'Missing roomName or participantName' });
  }

  if (!/^[A-Z0-9]{6}$/.test(roomName)) {
    return res.status(400).json({ error: 'Invalid room code format' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.VITE_LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  try {
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

    return res.status(200).json({
      token: jwt,
      wsUrl: wsUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}
