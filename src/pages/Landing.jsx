import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.brand}>VibeMeet</h1>
        <p className={styles.tagline}>Video calls, simplified. No accounts, no downloads.</p>

        <div className={styles.actions}>
          <button className={styles.startBtn} onClick={handleStart}>
            Start a meeting
          </button>

          <div className={styles.divider}>or join with a code</div>

          <div className={styles.joinGroup}>
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
            <button
              className={styles.joinBtn}
              onClick={handleJoin}
              disabled={joinCode.length < 6}
            >
              Join
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default Landing;
