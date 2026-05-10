import { useRef, useCallback, useEffect } from "react";

const MAX_RECORDING_DURATION = 600;
const MIN_RECORDING_DURATION = 1;

export interface AudioRecorderOptions {
  onError?: (message: string) => void;
  onDurationUpdate?: (duration: number) => void;
  onMaxDurationReached?: () => void;
}

export function useAudioRecorder(options: AudioRecorderOptions = {}) {
  const { onError, onDurationUpdate, onMaxDurationReached } = options;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = 0;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      durationRef.current = 0;
      isRecordingRef.current = true;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onerror = () => {
        onError?.("录音过程中发生错误");
        stopTimer();
        stopStream();
        isRecordingRef.current = false;
      };

      mediaRecorder.start(100);

      timerRef.current = window.setInterval(() => {
        const next = durationRef.current + 1;
        durationRef.current = next;
        onDurationUpdate?.(next);

        if (next >= MAX_RECORDING_DURATION) {
          stopTimer();
          onMaxDurationReached?.();
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);

      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        onError?.("麦克风权限被拒绝，请允许麦克风权限后重试。");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        onError?.("未找到麦克风设备，请检查设备连接。");
      } else {
        onError?.("录音启动失败，请检查麦克风权限和设备。");
      }
      return false;
    }
  }, [onError, onDurationUpdate, onMaxDurationReached, stopTimer, stopStream]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      stopTimer();

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        stopStream();
        isRecordingRef.current = false;
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const recordedDuration = durationRef.current;

        if (recordedDuration < MIN_RECORDING_DURATION) {
          stopStream();
          isRecordingRef.current = false;
          resolve(null);
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        stopStream();
        isRecordingRef.current = false;
        resolve({ blob, duration: recordedDuration });
      };

      recorder.stop();
    });
  }, [stopTimer, stopStream]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, [stopTimer, stopStream]);

  return {
    startRecording,
    stopRecording,
    isRecording: () => isRecordingRef.current,
    getDuration: () => durationRef.current,
  };
}
