import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionQuality } from 'livekit-client';

export function useNetworkQuality(room) {
  const [qualities, setQualities] = useState({});
  const disableTimers = useRef({});

  const scheduleVideoDisable = useCallback((participant, delay) => {
    if (disableTimers.current[participant.identity]) return;
    disableTimers.current[participant.identity] = setTimeout(() => {
      participant.videoTrackPublications.forEach((pub) => {
        if (pub.track && !pub.isMuted) {
          pub.track.mute();
        }
      });
      delete disableTimers.current[participant.identity];
    }, delay);
  }, []);

  const cancelVideoDisable = useCallback((participant) => {
    const timer = disableTimers.current[participant.identity];
    if (timer) {
      clearTimeout(timer);
      delete disableTimers.current[participant.identity];
    }
  }, []);

  const restoreVideo = useCallback((participant) => {
    participant.videoTrackPublications.forEach((pub) => {
      if (pub.track && pub.isMuted) {
        pub.track.unmute();
      }
    });
  }, []);

  useEffect(() => {
    if (!room) return;

    const handleQualityChange = (quality, participant) => {
      setQualities((prev) => ({
        ...prev,
        [participant.identity]: quality,
      }));

      if (quality === ConnectionQuality.Poor) {
        scheduleVideoDisable(participant, 5000);
      }
      if (
        quality === ConnectionQuality.Excellent ||
        quality === ConnectionQuality.Good
      ) {
        cancelVideoDisable(participant);
        restoreVideo(participant);
      }
    };

    room.on('connectionQualityChanged', handleQualityChange);

    return () => {
      room.off('connectionQualityChanged', handleQualityChange);
      Object.values(disableTimers.current).forEach(clearTimeout);
    };
  }, [room, scheduleVideoDisable, cancelVideoDisable, restoreVideo]);

  return qualities;
}
