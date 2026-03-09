import React from 'react';
import { ConnectionQuality } from 'livekit-client';
import styles from './NetworkBadge.module.css';

const QUALITY_MAP = {
  [ConnectionQuality.Excellent]: { className: 'excellent', label: 'Excellent' },
  [ConnectionQuality.Good]: { className: 'good', label: 'Good' },
  [ConnectionQuality.Poor]: { className: 'poor', label: 'Poor' },
  [ConnectionQuality.Lost]: { className: 'lost', label: 'Lost' },
};

function NetworkBadge({ quality }) {
  const info = QUALITY_MAP[quality] || { className: 'good', label: 'Connecting' };

  return (
    <span
      className={`${styles.badge} ${styles[info.className]}`}
      aria-label={`Connection: ${info.label}`}
      title={`Connection: ${info.label}`}
    >
      <span className={styles.bar} />
      <span className={styles.bar} />
      <span className={styles.bar} />
      <span className={styles.bar} />
    </span>
  );
}

export default React.memo(NetworkBadge);
