import { useState, useCallback } from 'react';
import { fetchToken } from '../utils/token';

export function useRoom() {
  const [token, setToken] = useState(null);
  const [wsUrl, setWsUrl] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async (roomName, participantName) => {
    setIsConnecting(true);
    setError(null);
    try {
      const data = await fetchToken(roomName, participantName);
      setToken(data.token);
      setWsUrl(data.wsUrl);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setToken(null);
    setWsUrl(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return { token, wsUrl, isConnecting, error, isConnected, connect, disconnect };
}
