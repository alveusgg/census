import { Audio, Video } from '@react-av/core';
import Hls from 'hls.js';
import { ComponentProps, forwardRef, useEffect, useRef } from 'react';

export interface HLSContext {
  instance?: Hls;
  isNative: boolean;
}

export const HLSVideo = forwardRef<HTMLVideoElement, ComponentProps<typeof Video> & { src: string }>(function HLSVideo(
  { src, children, ...props },
  f_ref
) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (Hls.isSupported()) {
      // The HLS.js transmuxing worker can stall silently on Mux's MPEG-TS
      // renditions before appending the first fragment. Main-thread transmuxing
      // is reliable here and inexpensive for these short, resolution-capped clips.
      const hls = new Hls({
        enableWorker: false,
        // Avoid eagerly downloading and transmuxing an entire high-bitrate clip.
        // A small forward buffer is sufficient for playback and limits memory use.
        maxBufferLength: 8,
        maxMaxBufferLength: 12,
        backBufferLength: 4
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS playback error', data);
      });
      const reportWaiting = () => console.warn('HLS video waiting for media data');
      const reportStalled = () => console.warn('HLS video download stalled');
      video.addEventListener('waiting', reportWaiting);
      video.addEventListener('stalled', reportStalled);

      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        video.removeEventListener('waiting', reportWaiting);
        video.removeEventListener('stalled', reportStalled);
        // TODO: first class support for resetting value
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS is required where Media Source Extensions are unavailable,
      // notably iOS. Prefer HLS.js elsewhere for consistent playback behavior.
      video.src = src;
    } else {
      // TODO: fallback
    }
  }, [src]);

  return (
    <Video
      {...props}
      ref={current => {
        if (typeof f_ref === 'function') f_ref(current);
        else if (f_ref) f_ref.current = current;
        // @ts-expect-error The internal ref is synchronized by the composed callback ref.
        ref.current = current;
      }}
    >
      {children}
    </Video>
  );
});

export const HLSAudio = forwardRef<HTMLAudioElement, ComponentProps<typeof Audio> & { src: string }>(function HLSAudio(
  { src, children, ...props },
  f_ref
) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(audio);
      return () => {
        // TODO: first class support for resetting value
        hls.destroy();
      };
    } else {
      // TODO: fallback
    }
  }, [src]);

  return (
    <Audio
      {...props}
      ref={current => {
        if (typeof f_ref === 'function') f_ref(current);
        else if (f_ref) f_ref.current = current;
        // @ts-expect-error The internal ref is synchronized by the composed callback ref.
        ref.current = current;
      }}
    >
      {children}
    </Audio>
  );
});
