import { useEffect, useRef, useState } from 'react';
import type { PlayerState } from '../../types';
import { useVisibility } from '../../hooks/useVisibility';

interface Mp4PlayerProps {
  url: string;
  autoplay?: boolean;
  onStateChange?: (state: PlayerState) => void;
}

export function Mp4Player({ url, autoplay = true, onStateChange }: Mp4PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlayerState>('loading');

  const { isVisible, setElement } = useVisibility((visible) => {
    if (videoRef.current) {
      if (visible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  });

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleCanPlay = () => {
      setState('paused');
      onStateChange?.('paused');
      if (autoplay) {
        video.play();
      }
    };

    const handlePlay = () => {
      setState('playing');
      onStateChange?.('playing');
    };

    const handlePause = () => {
      setState('paused');
      onStateChange?.('paused');
    };

    const handleError = () => {
      setState('error');
      onStateChange?.('error');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [url, autoplay, onStateChange]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isVisible && state !== 'loading' && state !== 'playing') {
      videoRef.current.play();
    } else if (!isVisible && state === 'playing') {
      videoRef.current.pause();
    }
  }, [isVisible, state]);

  return (
    <div ref={setElement} style={{ width: '100%', height: '100%', background: '#000' }}>
      <video
        ref={videoRef}
        src={url}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        muted
        playsInline
      />
    </div>
  );
}