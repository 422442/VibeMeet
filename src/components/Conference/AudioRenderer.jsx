import React, { useEffect, useRef } from 'react';

function AudioTrackRenderer({ track }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

function AudioRenderer({ tracks, localIdentity }) {
  const remoteTracks = tracks.filter(
    (t) => t.participant?.identity !== localIdentity && t.publication?.track
  );

  return (
    <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      {remoteTracks.map((t) => (
        <AudioTrackRenderer
          key={t.participant.identity + '-audio'}
          track={t.publication.track}
        />
      ))}
    </div>
  );
}

export default React.memo(AudioRenderer);
