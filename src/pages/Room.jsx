import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  useRoomContext,
  useTracks,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import { Track, RoomEvent, ConnectionQuality, VideoPresets } from 'livekit-client';
import { useRoom } from '../hooks/useRoom';
import CodeDisplay from '../components/UI/CodeDisplay';
import Spinner from '../components/UI/Spinner';
import VideoGrid from '../components/Conference/VideoGrid';
import VideoTile from '../components/Conference/VideoTile';
import AudioRenderer from '../components/Conference/AudioRenderer';
import ControlBar from '../components/Conference/ControlBar';
import styles from './Room.module.css';

const SetupPanel = React.lazy(() => import('../components/SetupPanel/SetupPanel'));

const ROOM_OPTIONS = {
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
  publishDefaults: {
    simulcast: true,
    videoSimulcastLayers: [
      VideoPresets.h540,
      VideoPresets.h216,
    ],
    videoCodec: 'vp8',
  },
  disconnectOnPageLeave: true,
  reconnectPolicy: {
    maxRetries: 5,
    nextRetryDelayInMs: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
  },
};

function RoomInner({ roomCode, onLeave }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [viewMode, setViewMode] = useState('grid');
  const [qualities, setQualities] = useState({});
  const [isReconnecting, setIsReconnecting] = useState(false);

  const micTrack = localParticipant?.getTrackPublication(Track.Source.Microphone);
  const camTrack = localParticipant?.getTrackPublication(Track.Source.Camera);
  const screenTrack = localParticipant?.getTrackPublication(Track.Source.ScreenShare);

  const micEnabled = !!micTrack && !micTrack.isMuted;
  const camEnabled = !!camTrack && !camTrack.isMuted;
  const screenShareEnabled = !!screenTrack;

  const videoTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  useEffect(() => {
    if (!room) return;

    const handleQuality = (quality, participant) => {
      setQualities((prev) => ({ ...prev, [participant.identity]: quality }));
    };

    const handleReconnecting = () => setIsReconnecting(true);
    const handleReconnected = () => setIsReconnecting(false);
    const handleDisconnected = () => onLeave();

    room.on(RoomEvent.ConnectionQualityChanged, handleQuality);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQuality);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, onLeave]);

  const handleToggleMic = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(!micEnabled);
  }, [localParticipant, micEnabled]);

  const handleToggleCam = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!camEnabled);
  }, [localParticipant, camEnabled]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setScreenShareEnabled(!screenShareEnabled);
      if (!screenShareEnabled) {
        setViewMode('speaker');
      }
    } catch {
      // User cancelled screen share picker
    }
  }, [localParticipant, screenShareEnabled]);

  const handleLeave = useCallback(() => {
    room?.disconnect();
    onLeave();
  }, [room, onLeave]);

  return (
    <div className={styles.conference}>
      {isReconnecting && (
        <div className={styles.reconnectBar}>
          Reconnecting...
        </div>
      )}

      <header className={styles.header}>
        <span className={styles.brand}>VibeMeet</span>
        <CodeDisplay code={roomCode} />
        <button className={styles.leaveHeader} onClick={handleLeave}>
          Leave
        </button>
      </header>

      <AudioRenderer tracks={audioTracks} localIdentity={localParticipant?.identity} />

      <VideoGrid participantCount={participants.length} viewMode={viewMode}>
        {videoTracks.map((trackRef) => {
          const participant = trackRef.participant;
          const isLocal = participant?.identity === localParticipant?.identity;
          return (
            <VideoTile
              key={participant?.identity + '-' + trackRef.source}
              trackRef={trackRef}
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
        <button className={styles.retryBtn} onClick={() => setJoined(false)}>
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
      audio={true}
      video={true}
      options={ROOM_OPTIONS}
    >
      <RoomInner roomCode={code} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}

export default Room;
