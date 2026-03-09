import React, { useState, useEffect, useRef, useCallback } from 'react';
import Spinner from '../UI/Spinner';
import styles from './SetupPanel.module.css';

function SetupPanel({ roomCode, onJoin }) {
  const [name, setName] = useState('');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [mics, setMics] = useState([]);
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopTracks = useCallback((kind) => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((t) => {
      if (!kind || t.kind === kind) {
        t.stop();
        stream.removeTrack(t);
      }
    });
  }, []);

  const startCamera = useCallback(async (deviceId) => {
    stopTracks('video');
    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = s.getVideoTracks()[0];
      if (!streamRef.current) {
        streamRef.current = new MediaStream();
      }
      streamRef.current.addTrack(videoTrack);
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    } catch (err) {
      console.warn('Camera access failed:', err.message);
      setCamOn(false);
    }
  }, [stopTracks]);

  const startMic = useCallback(async (deviceId) => {
    stopTracks('audio');
    try {
      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTrack = s.getAudioTracks()[0];
      if (!streamRef.current) {
        streamRef.current = new MediaStream();
      }
      streamRef.current.addTrack(audioTrack);
    } catch (err) {
      console.warn('Mic access failed:', err.message);
      setMicOn(false);
    }
  }, [stopTracks]);

  // Enumerate devices
  useEffect(() => {
    async function enumerate() {
      try {
        // Request permissions first to get labeled devices
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach((t) => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameras(devices.filter((d) => d.kind === 'videoinput'));
        setMics(devices.filter((d) => d.kind === 'audioinput'));
      } catch (err) {
        setError('Please allow camera and microphone access to continue.');
      }
    }
    enumerate();
  }, []);

  // Manage camera stream
  useEffect(() => {
    if (camOn) {
      startCamera(selectedCam);
    } else {
      stopTracks('video');
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current || null;
      }
    }
  }, [camOn, selectedCam, startCamera, stopTracks]);

  // Manage mic stream
  useEffect(() => {
    if (micOn) {
      startMic(selectedMic);
    } else {
      stopTracks('audio');
    }
  }, [micOn, selectedMic, startMic, stopTracks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setJoining(true);
    setError('');
    try {
      stopTracks();
      streamRef.current = null;
      await onJoin(name.trim());
    } catch (err) {
      setError(err.message || 'Failed to join room');
      setJoining(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && name.trim() && !joining) {
      handleJoin();
    }
  };

  return (
    <div className={styles.setupRoot}>
      <div className={styles.setupCard}>
        <div className={styles.previewSection}>
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              className={styles.preview}
              autoPlay
              playsInline
              muted
              style={{ opacity: camOn ? 1 : 0 }}
            />
            {!camOn && (
              <div className={styles.camOff}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <span>Camera off</span>
              </div>
            )}
          </div>

          <div className={styles.toggleRow}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${micOn ? styles.active : styles.inactive}`}
              onClick={() => setMicOn((v) => !v)}
              aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micOn ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${camOn ? styles.active : styles.inactive}`}
              onClick={() => setCamOn((v) => !v)}
              aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {camOn ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.title}>Join Room</h2>
          <p className={styles.roomCode}>Room: <strong>{roomCode}</strong></p>

          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.label}>
            Your name
            <input
              className={styles.input}
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={30}
              autoFocus
            />
          </label>

          {cameras.length > 1 && (
            <label className={styles.label}>
              Camera
              <select
                className={styles.select}
                value={selectedCam}
                onChange={(e) => setSelectedCam(e.target.value)}
              >
                {cameras.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Camera'}
                  </option>
                ))}
              </select>
            </label>
          )}

          {mics.length > 1 && (
            <label className={styles.label}>
              Microphone
              <select
                className={styles.select}
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
              >
                {mics.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Microphone'}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={joining || !name.trim()}
          >
            {joining ? <Spinner size={18} /> : 'Join now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetupPanel;
