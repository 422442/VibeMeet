import React, { useEffect, useCallback } from 'react';
import styles from './ControlBar.module.css';

const MicOnIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const CamOnIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const CamOffIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ScreenIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const LeaveIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" />
  </svg>
);

const SidebarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="14" height="20" rx="2" />
    <rect x="18" y="2" width="4" height="9" rx="1" />
    <rect x="18" y="13" width="4" height="9" rx="1" />
  </svg>
);

function ControlBar({
  micEnabled,
  camEnabled,
  screenShareEnabled,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onLeave,
  viewMode,
  onViewChange,
}) {
  const handleKeyboard = useCallback(
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case 'm': onToggleMic(); break;
        case 'v': onToggleCam(); break;
        case 's': onToggleScreenShare(); break;
        default: break;
      }
    },
    [onToggleMic, onToggleCam, onToggleScreenShare]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  const views = [
    { key: 'grid', icon: <GridIcon />, label: 'Grid' },
    { key: 'speaker', icon: <SpeakerIcon />, label: 'Speaker' },
    { key: 'sidebar', icon: <SidebarIcon />, label: 'Sidebar' },
  ];

  return (
    <div className={styles.bar}>
      <div className={styles.viewGroup}>
        {views.map((v) => (
          <button
            key={v.key}
            className={`${styles.viewBtn} ${viewMode === v.key ? styles.viewActive : ''}`}
            onClick={() => onViewChange(v.key)}
            aria-label={v.label + ' view'}
            title={v.label}
          >
            {v.icon}
          </button>
        ))}
      </div>

      <div className={styles.controlGroup}>
        <button
          className={`${styles.ctrlBtn} ${!micEnabled ? styles.off : ''}`}
          onClick={onToggleMic}
          aria-label={micEnabled ? 'Mute (M)' : 'Unmute (M)'}
          title={micEnabled ? 'Mute (M)' : 'Unmute (M)'}
        >
          {micEnabled ? <MicOnIcon /> : <MicOffIcon />}
        </button>

        <button
          className={`${styles.ctrlBtn} ${!camEnabled ? styles.off : ''}`}
          onClick={onToggleCam}
          aria-label={camEnabled ? 'Camera off (V)' : 'Camera on (V)'}
          title={camEnabled ? 'Camera off (V)' : 'Camera on (V)'}
        >
          {camEnabled ? <CamOnIcon /> : <CamOffIcon />}
        </button>

        <button
          className={`${styles.ctrlBtn} ${screenShareEnabled ? styles.sharing : ''}`}
          onClick={onToggleScreenShare}
          aria-label={screenShareEnabled ? 'Stop sharing (S)' : 'Share screen (S)'}
          title={screenShareEnabled ? 'Stop sharing (S)' : 'Share screen (S)'}
        >
          <ScreenIcon />
        </button>

        <button
          className={styles.leaveBtn}
          onClick={onLeave}
          aria-label="Leave meeting"
          title="Leave meeting"
        >
          <LeaveIcon />
        </button>
      </div>

      <div className={styles.spacer} />
    </div>
  );
}

export default React.memo(ControlBar);
