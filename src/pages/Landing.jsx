import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import { generateRoomCode, validateRoomCode, cleanRoomCode, formatRoomCode } from '../utils/roomCode';
import styles from './Landing.module.css';

function Landing() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleStart = useCallback(() => {
    const code = generateRoomCode();
    navigate('/room/' + code + '?host=true');
  }, [navigate]);

  const handleJoin = useCallback(() => {
    const cleaned = cleanRoomCode(joinCode);
    if (!validateRoomCode(cleaned)) {
      setError('Enter a valid 6-character room code');
      return;
    }
    setError('');
    navigate('/room/' + cleaned);
  }, [joinCode, navigate]);

  const handleCodeInput = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setJoinCode(raw);
    if (error) setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>VibeMeet</div>
        <p className={styles.tagline}>Meet without the noise.</p>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={handleStart} className={styles.startBtn}>
            Start a meeting
          </Button>

          <div className={styles.divider}>
            <span className={styles.dividerText}>or join an existing one</span>
          </div>

          <div className={styles.joinRow}>
            <input
              type="text"
              value={formatRoomCode(joinCode)}
              onChange={handleCodeInput}
              onKeyDown={handleKeyDown}
              placeholder="Enter code"
              className={styles.codeInput}
              maxLength={7}
              autoComplete="off"
              spellCheck="false"
            />
            <Button variant="secondary" size="lg" onClick={handleJoin} disabled={joinCode.length < 6}>
              Join
            </Button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <p className={styles.footer}>
          No account. No download. Just the meeting.
        </p>
      </div>
    </div>
  );
}

export default Landing;
