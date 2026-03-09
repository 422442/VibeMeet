import React from 'react';
import styles from './Spinner.module.css';

function Spinner({ size = 24, label = 'Loading' }) {
  return (
    <div className={styles.container} role="status" aria-label={label}>
      <div className={styles.spinner} style={{ width: size, height: size }} />
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}

export default React.memo(Spinner);
