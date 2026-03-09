import React, { useMemo } from 'react';
import styles from './VideoGrid.module.css';

function getGridColumns(count, width) {
  if (width < 480) return 1;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return width < 768 ? 1 : 2;
  return width < 768 ? 2 : 3;
}

function VideoGrid({ children, participantCount, viewMode = 'grid' }) {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = useMemo(
    () => getGridColumns(participantCount, width),
    [participantCount, width]
  );

  if (viewMode === 'speaker') {
    return <div className={styles.speakerLayout}>{children}</div>;
  }

  if (viewMode === 'sidebar') {
    return <div className={styles.sidebarLayout}>{children}</div>;
  }

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {children}
    </div>
  );
}

export default React.memo(VideoGrid);
