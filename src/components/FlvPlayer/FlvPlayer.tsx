import { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import type { PlayerState } from '../../types';
import { useVisibility } from '../../hooks/useVisibility';

interface FlvPlayerProps {
  url: string;
  autoplay?: boolean;
  onStateChange?: (state: PlayerState) => void;
}

export function FlvPlayer({ url, autoplay = true, onStateChange }: FlvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);
  const [state, setState] = useState<PlayerState>('loading');

  const { isVisible, setElement } = useVisibility((visible) => {
    if (playerRef.current) {
      if (visible) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  });

  useEffect(() => {
    if (!videoRef.current) return;

    const handleError = () => {
      setState('error');
      onStateChange?.('error');
    };

    const handleLoadingComplete = () => {
      setState('paused');
      onStateChange?.('paused');
    };

    if (flvjs.isSupported()) {
      const player = flvjs.createPlayer({
        type: 'flv',
        url,
        hasAudio: false,
        hasVideo: true,
        isLive: true,
      });

      player.attachMediaElement(videoRef.current);
      player.load();

      if (autoplay) {
        player.play();
      }

      player.on(flvjs.Events.ERROR, handleError);
      player.on(flvjs.Events.LOADING_COMPLETE, handleLoadingComplete);

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.off(flvjs.Events.ERROR, handleError);
        playerRef.current.off(flvjs.Events.LOADING_COMPLETE, handleLoadingComplete);
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [url, autoplay, onStateChange]);

  useEffect(() => {
    if (isVisible && state !== 'loading') {
      playerRef.current?.play();
      setState('playing');
      onStateChange?.('playing');
    } else if (!isVisible && state === 'playing') {
      playerRef.current?.pause();
      setState('paused');
      onStateChange?.('paused');
    }
  }, [isVisible, state, onStateChange]);

  return (
    <div ref={setElement} style={{ width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        muted
      />
    </div>
  );
}