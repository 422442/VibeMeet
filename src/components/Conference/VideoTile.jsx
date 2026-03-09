import React, { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import NetworkBadge from './NetworkBadge';
import styles from './VideoTile.module.css';

function VideoTile({ trackRef, participant, quality, isLocal }) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  const publication = trackRef?.publication;
  const track = publication?.track;
  const isScreen = trackRef?.source === Track.Source.ScreenShare;
  const isCameraMuted = !track || track.isMuted;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) {
      setHasVideo(false);
      return;
    }

    track.attach(el);
    setHasVideo(!track.isMuted);

    const handleMuted = () => setHasVideo(false);
    const handleUnmuted = () => setHasVideo(true);

    track.on('muted', handleMuted);
    track.on('unmuted', handleUnmuted);

    return () => {
      track.off('muted', handleMuted);
      track.off('unmuted', handleUnmuted);
      track.detach(el);
    };
  }, [track]);

  const micPub = participant?.getTrackPublication(Track.Source.Microphone);
  const isMicMuted = !micPub || micPub.isMuted;

  const displayName = participant?.name || participant?.identity || 'Unknown';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${styles.tile} ${isScreen ? styles.screen : ''} ${isLocal ? styles.local : ''}`}
      data-has-video={hasVideo}
    >
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ opacity: hasVideo ? 1 : 0 }}
      />

      {!hasVideo && (
        <div className={styles.avatar}>
          <span className={styles.initials}>{initials}</span>
        </div>
      )}

      <div className={styles.overlay}>
        <div className={styles.nameTag}>
          {isMicMuted && (
            <svg className={styles.mutedIcon} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
          <span className={styles.name}>{displayName}{isLocal ? ' (You)' : ''}</span>
        </div>
        {quality && <NetworkBadge quality={quality} />}
      </div>
    </div>
  );
}

export default React.memo(VideoTile);
