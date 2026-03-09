import { useState, useEffect, useCallback } from 'react';

const MAX_PARTICIPANTS = 5;

export function useParticipants(room) {
  const [participants, setParticipants] = useState([]);
  const [isFull, setIsFull] = useState(false);

  const updateParticipants = useCallback(() => {
    if (!room) return;
    const all = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
    setParticipants(all);
    setIsFull(all.length >= MAX_PARTICIPANTS);
  }, [room]);

  useEffect(() => {
    if (!room) return;

    updateParticipants();

    room.on('participantConnected', updateParticipants);
    room.on('participantDisconnected', updateParticipants);
    room.on('trackSubscribed', updateParticipants);
    room.on('trackUnsubscribed', updateParticipants);

    return () => {
      room.off('participantConnected', updateParticipants);
      room.off('participantDisconnected', updateParticipants);
      room.off('trackSubscribed', updateParticipants);
      room.off('trackUnsubscribed', updateParticipants);
    };
  }, [room, updateParticipants]);

  return { participants, isFull, count: participants.length };
}
