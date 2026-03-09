import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '../UI/Button';
import styles from './SetupPanel.module.css';

function generateGuestName() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return 'Guest_' + num;
}

function SetupPanel({ roomCode, onJoin }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [name, setName] = useState(generateGuestName);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [devices, setDevices] = useState({ cameras: [], mics: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const formattedCode = roomCode
    ? roomCode.slice(0, 3) + '-' + roomCode.slice(3, 6)
    : '';

  const requestMedia = useCallback(async (cameraId, micId) => {
    try {
      const constraints = {
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream((prev) => {
        if (prev) prev.getTracks().forEach((t) => t.stop());
        return mediaStream;
      });
      setPermissionDenied(false);
      setIsLoading(false);

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter((d) => d.kind === 'videoinput');
      const mics = deviceList.filter((d) => d.kind === 'audioinput');
      setDevices({ cameras, mics });

      if (!cameraId && cameras.length > 0) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (!micId && mics.length > 0) {
        setSelectedMic(mics[0].deviceId);
      }
    } catch {
      setPermissionDenied(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestMedia();
    return () => {
      setStream((prev) => {
        if (prev) prev.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = camEnabled ? stream : null;
    }
  }, [stream, camEnabled]);

  const handleCameraChange = (e) => {
    setSelectedCamera(e.target.value);
    requestMedia(e.target.value, selectedMic);
  };

  const handleMicChange = (e) => {
    setSelectedMic(e.target.value);
    requestMedia(selectedCamera, e.target.value);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setMicEnabled((prev) => !prev);
  };

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setCamEnabled((prev) => !prev);
  };

  const handleJoin = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    onJoin(name.trim() || generateGuestName());
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Requesting camera and microphone access...</div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className={styles.container}>
        <div className={styles.denied}>
          <h2>Camera or microphone access denied</h2>
          <p>VibeMeet needs access to your camera and microphone to join a meeting.</p>
          <div className={styles.guide}>
            <h3>How to enable access:</h3>
            <ol>
              <li>Click the camera/lock icon in your browser address bar</li>
              <li>Set Camera and Microphone to "Allow"</li>
              <li>Reload this page</li>
            </ol>
          </div>
          <Button variant="primary" onClick={() => requestMedia()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.previewSection}>
          <div className={styles.videoWrapper}>
            {camEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
              />
            ) : (
              <div className={styles.cameraOff}>Camera is off</div>
            )}
          </div>
          <div className={styles.mediaControls}>
            <button
              className={`${styles.mediaToggle} ${!micEnabled ? styles.mediaOff : ''}`}
              onClick={toggleMic}
              aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              aria-pressed={!micEnabled}
            >
              <span className={styles.mediaIcon}>{micEnabled ? 'Mic' : 'Mic Off'}</span>
            </button>
            <button
              className={`${styles.mediaToggle} ${!camEnabled ? styles.mediaOff : ''}`}
              onClick={toggleCam}
              aria-label={camEnabled ? 'Turn off camera' : 'Turn on camera'}
              aria-pressed={!camEnabled}
            >
              <span className={styles.mediaIcon}>{camEnabled ? 'Cam' : 'Cam Off'}</span>
            </button>
          </div>
        </div>

        <div className={styles.settingsSection}>
          <h2 className={styles.heading}>Check your setup</h2>

          <label className={styles.label}>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              maxLength={30}
              placeholder="Enter your name"
            />
          </label>

          {devices.cameras.length > 1 && (
            <label className={styles.label}>
              Camera
              <select
                value={selectedCamera}
                onChange={handleCameraChange}
                className={styles.select}
              >
                {devices.cameras.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Camera'}
                  </option>
                ))}
              </select>
            </label>
          )}

          {devices.mics.length > 1 && (
            <label className={styles.label}>
              Microphone
              <select
                value={selectedMic}
                onChange={handleMicChange}
                className={styles.select}
              >
                {devices.mics.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Microphone'}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className={styles.roomInfo}>
            Room: <span className={styles.roomCode}>{formattedCode}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleJoin}
            disabled={!name.trim()}
            className={styles.joinButton}
          >
            Join meeting
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SetupPanel;
