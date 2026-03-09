import React from 'react';

const VIEW_MODES = ['grid', 'speaker', 'sidebar'];

function ViewToggle({ current, onChange }) {
  const nextMode = () => {
    const idx = VIEW_MODES.indexOf(current);
    const next = VIEW_MODES[(idx + 1) % VIEW_MODES.length];
    onChange(next);
  };

  return (
    <button onClick={nextMode} aria-label={`Switch view mode, current: ${current}`}>
      {current}
    </button>
  );
}

export default React.memo(ViewToggle);
