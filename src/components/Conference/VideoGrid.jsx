import React from 'react';
import styles from './VideoGrid.module.css';

function VideoGrid({ participantCount, viewMode, children }) {
  const childArray = React.Children.toArray(children);

  if (viewMode === 'speaker' && childArray.length > 1) {
    return (
      <div className={styles.speakerLayout}>
        <div className={styles.mainStage}>{childArray[0]}</div>
        <div className={styles.strip}>
          {childArray.slice(1).map((child) => (
            <div key={child.key} className={styles.stripTile}>
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'sidebar' && childArray.length > 1) {
    return (
      <div className={styles.sidebarLayout}>
        <div className={styles.mainStage}>{childArray[0]}</div>
        <div className={styles.sidebar}>
          {childArray.slice(1).map((child) => (
            <div key={child.key} className={styles.sidebarTile}>
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cols =
    participantCount <= 1 ? 1 : participantCount <= 4 ? 2 : participantCount <= 9 ? 3 : 4;

  return (
    <div
      className={styles.grid}
      style={{ '--cols': cols }}
    >
      {childArray.map((child) => (
        <div key={child.key} className={styles.cell}>
          {child}
        </div>
      ))}
    </div>
  );
}

export default React.memo(VideoGrid);
