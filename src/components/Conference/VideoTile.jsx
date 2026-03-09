import React, { useRef, useEffect } from 'react';
import NetworkBadge from './NetworkBadge';
import styles from './VideoTile.module.css';

function VideoTile({ track, participant, quality, isLocal, isSpeaker }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && track) {
      track.attach(el);
      return () => {
        track.detach(el);
      };
    }
  }, [track]);

  const name = participant?.identity || 'Unknown';
  const initials = name
    .split(/[_\s]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasVideo = track && !track.isMuted;

  return (
    <div className={`${styles.tile} ${isSpeaker ? styles.speaking : ''}`}>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`${styles.video} ${isLocal ? styles.mirrored : ''}`}
        />
      ) : (
        <div className={styles.avatar}>
          <span className={styles.initials}>{initials}</span>
        </div>
      )}
      <div className={styles.overlay}>
        <span className={styles.name}>
          {name}
          {isLocal ? ' (You)' : ''}
        </span>
        <NetworkBadge quality={quality} />
      </div>
    </div>
  );
}

export default React.memo(VideoTile);
