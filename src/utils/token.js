export async function fetchToken(roomName, participantName) {
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName, participantName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get token' }));
    throw new Error(error.error || 'Failed to get token');
  }

  return response.json();
}
