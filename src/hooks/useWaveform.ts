import { useRef, useCallback, useEffect } from "react";

export function useWaveform() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  const startWaveform = useCallback((stream: MediaStream, onData: (data: number[]) => void) => {
    isActiveRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 64;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    isActiveRef.current = true;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateWaveform = () => {
      if (!isActiveRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const normalized = Array.from(dataArray).map((v) => v / 255);
      onData(normalized);
      animationRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  }, []);

  const stopWaveform = useCallback(() => {
    isActiveRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopWaveform();
    };
  }, [stopWaveform]);

  return { startWaveform, stopWaveform };
}
