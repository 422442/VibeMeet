import React, { useCallback } from 'react';
import styles from './ControlBar.module.css';

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
  const handleKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toUpperCase()) {
        case 'M':
          onToggleMic();
          break;
        case 'V':
          onToggleCam();
          break;
        case 'S':
          onToggleScreenShare();
          break;
        case 'G':
          onViewChange('grid');
          break;
        case 'P':
          onViewChange('speaker');
          break;
        case 'B':
          onViewChange('sidebar');
          break;
        case 'ESCAPE':
          onLeave();
          break;
        default:
          break;
      }
    },
    [onToggleMic, onToggleCam, onToggleScreenShare, onLeave, onViewChange]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={styles.bar}>
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${!micEnabled ? styles.off : ''}`}
          onClick={onToggleMic}
          aria-label={micEnabled ? 'Mute microphone (M)' : 'Unmute microphone (M)'}
          aria-pressed={!micEnabled}
          title="Toggle microphone (M)"
        >
          <span className={styles.btnLabel}>{micEnabled ? 'Mic' : 'Mic Off'}</span>
        </button>

        <button
          className={`${styles.controlBtn} ${!camEnabled ? styles.off : ''}`}
          onClick={onToggleCam}
          aria-label={camEnabled ? 'Turn off camera (V)' : 'Turn on camera (V)'}
          aria-pressed={!camEnabled}
          title="Toggle camera (V)"
        >
          <span className={styles.btnLabel}>{camEnabled ? 'Cam' : 'Cam Off'}</span>
        </button>

        <button
          className={`${styles.controlBtn} ${screenShareEnabled ? styles.active : ''}`}
          onClick={onToggleScreenShare}
          aria-label={
            screenShareEnabled ? 'Stop sharing screen (S)' : 'Share screen (S)'
          }
          aria-pressed={screenShareEnabled}
          title="Toggle screen share (S)"
        >
          <span className={styles.btnLabel}>
            {screenShareEnabled ? 'Stop Share' : 'Share'}
          </span>
        </button>
      </div>

      <div className={styles.viewControls}>
        <button
          className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
          onClick={() => onViewChange('grid')}
          aria-label="Grid view (G)"
          title="Grid view (G)"
        >
          Grid
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === 'speaker' ? styles.viewActive : ''}`}
          onClick={() => onViewChange('speaker')}
          aria-label="Speaker view (P)"
          title="Speaker view (P)"
        >
          Speaker
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === 'sidebar' ? styles.viewActive : ''}`}
          onClick={() => onViewChange('sidebar')}
          aria-label="Sidebar view (B)"
          title="Sidebar view (B)"
        >
          Sidebar
        </button>
      </div>

      <button
        className={styles.leaveBtn}
        onClick={onLeave}
        aria-label="Leave meeting (Escape)"
        title="Leave meeting (Escape)"
      >
        Leave
      </button>
    </div>
  );
}

export default React.memo(ControlBar);
