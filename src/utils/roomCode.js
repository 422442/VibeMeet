const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode() {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

export function validateRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  const cleaned = code.replace(/[-\s]/g, '').toUpperCase();
  return /^[A-Z0-9]{6}$/.test(cleaned);
}

export function formatRoomCode(code) {
  const cleaned = code.replace(/[-\s]/g, '').toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 6);
}

export function cleanRoomCode(code) {
  return code.replace(/[-\s]/g, '').toUpperCase();
}
