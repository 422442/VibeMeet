import React, { useState, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useRoomContext, useTracks, useLocalParticipant } from '@livekit/components-react';
import { Track, RoomEvent, ConnectionQuality } from 'livekit-client';
import { useRoom } from '../hooks/useRoom';
import CodeDisplay from '../components/UI/CodeDisplay';
import Spinner from '../components/UI/Spinner';
import VideoGrid from '../components/Conference/VideoGrid';
import VideoTile from '../components/Conference/VideoTile';
import ControlBar from '../components/Conference/ControlBar';
import styles from './Room.module.css';

const SetupPanel = React.lazy(() => import('../components/SetupPanel/SetupPanel'));

function RoomInner({ roomCode, onLeave }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [viewMode, setViewMode] = useState('grid');
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [qualities, setQualities] = useState({});

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  React.useEffect(() => {
    if (!room) return;

    const handleQuality = (quality, participant) => {
      setQualities((prev) => ({ ...prev, [participant.identity]: quality }));
    };

    room.on(RoomEvent.ConnectionQualityChanged, handleQuality);
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQuality);
    };
  }, [room]);

  const handleToggleMic = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(!micEnabled);
    setMicEnabled((prev) => !prev);
  }, [localParticipant, micEnabled]);

  const handleToggleCam = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!camEnabled);
    setCamEnabled((prev) => !prev);
  }, [localParticipant, camEnabled]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setScreenShareEnabled(!screenShareEnabled);
    setScreenShareEnabled((prev) => !prev);
    if (!screenShareEnabled) {
      setViewMode('speaker');
    }
  }, [localParticipant, screenShareEnabled]);

  const handleLeave = useCallback(() => {
    room?.disconnect();
    onLeave();
  }, [room, onLeave]);

  const cameraTracks = tracks.filter(
    (t) =>
      t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  );

  const participants = room
    ? [room.localParticipant, ...Array.from(room.remoteParticipants.values())]
    : [];

  return (
    <div className={styles.conference}>
      <header className={styles.header}>
        <span className={styles.brand}>VibeMeet</span>
        <CodeDisplay code={roomCode} />
        <button className={styles.leaveHeader} onClick={handleLeave}>
          Leave
        </button>
      </header>

      <VideoGrid participantCount={participants.length} viewMode={viewMode}>
        {cameraTracks.map((trackRef) => {
          const participant = trackRef.participant;
          const isLocal =
            participant?.identity === room?.localParticipant?.identity;
          return (
            <VideoTile
              key={trackRef.participant?.identity + '-' + trackRef.source}
              track={trackRef.publication?.track}
              participant={participant}
              quality={qualities[participant?.identity]}
              isLocal={isLocal}
            />
          );
        })}
      </VideoGrid>

      <ControlBar
        micEnabled={micEnabled}
        camEnabled={camEnabled}
        screenShareEnabled={screenShareEnabled}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />
    </div>
  );
}

function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token, wsUrl, isConnecting, error, connect, disconnect } = useRoom();
  const [joined, setJoined] = useState(false);

  const handleJoin = useCallback(
    async (participantName) => {
      await connect(code, participantName);
      setJoined(true);
    },
    [code, connect]
  );

  const handleLeave = useCallback(() => {
    disconnect();
    setJoined(false);
    navigate('/');
  }, [disconnect, navigate]);

  if (!joined) {
    return (
      <Suspense
        fallback={
          <div className={styles.loadingScreen}>
            <Spinner size={32} label="Loading setup" />
          </div>
        }
      >
        <SetupPanel roomCode={code} onJoin={handleJoin} />
      </Suspense>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingScreen}>
        <p className={styles.errorText}>Failed to join: {error}</p>
        <button className={styles.retryBtn} onClick={() => { setJoined(false); }}>
          Try again
        </button>
        <button className={styles.retryBtn} onClick={() => navigate('/')}>
          Back to home
        </button>
      </div>
    );
  }

  if (isConnecting || !token) {
    return (
      <div className={styles.loadingScreen}>
        <Spinner size={32} label="Connecting to room" />
        <p className={styles.loadingText}>Connecting...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
        },
      }}
    >
      <RoomInner roomCode={code} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}

export default Room;
