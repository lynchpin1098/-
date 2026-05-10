import { useRef, useState, useCallback, useEffect } from "react";

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    isPlayingRef.current = false;
    setPlayingId(null);
    setCurrentTime(0);
  }, []);

  const updateProgress = useCallback(() => {
    if (!audioRef.current || !isPlayingRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const play = useCallback(
    (id: string, blob: Blob, startTime: number = 0) => {
      cleanup();

      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.currentTime = startTime;
      setPlayingId(id);
      setCurrentTime(startTime);

      audio.onplay = () => {
        isPlayingRef.current = true;
        rafRef.current = requestAnimationFrame(updateProgress);
      };

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = () => {
        cleanup();
      };

      audio.onpause = () => {
        isPlayingRef.current = false;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      };

      audio.play().catch(() => {
        cleanup();
      });
    },
    [cleanup, updateProgress]
  );

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    playingId,
    currentTime,
    play,
    stop,
    seekTo,
  };
}
