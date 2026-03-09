import React from 'react';
import styles from './Button.module.css';

function Button({ children, variant = 'primary', size = 'md', disabled, onClick, className, ...props }) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export default React.memo(Button);
