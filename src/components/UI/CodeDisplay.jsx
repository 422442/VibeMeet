import React, { useState, useCallback } from 'react';
import styles from './CodeDisplay.module.css';

function CodeDisplay({ code }) {
  const [copied, setCopied] = useState(false);

  const formatted = code
    ? code.slice(0, 3) + '-' + code.slice(3, 6)
    : '';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: no-op on copy failure
    }
  }, [code]);

  return (
    <div className={styles.container}>
      <span className={styles.code}>{formatted}</span>
      <button
        className={styles.copyButton}
        onClick={handleCopy}
        aria-label="Copy room code"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default React.memo(CodeDisplay);
