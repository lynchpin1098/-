import { useState, useCallback, useRef } from "react";
import { saveDiary } from "@/utils/db";
import { generateId } from "@/utils/formatTime";
import { useDiaryStore } from "@/store/diaryStore";
import { useAudioRecorder } from "./useAudioRecorder";
import { useWaveform } from "./useWaveform";
import { useSpeechRecognition } from "./useSpeechRecognition";

const MAX_RECORDING_DURATION = 600;

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(32).fill(0));
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMaxDurationReached, setIsMaxDurationReached] = useState(false);

  const loadDiaries = useDiaryStore((s) => s.loadDiaries);
  const { startWaveform, stopWaveform } = useWaveform();
  const { isSupported: isSpeechSupported, startRecognition, stopRecognition, getResult } = useSpeechRecognition();

  const isStoppingRef = useRef(false);

  const handleError = useCallback((message: string) => {
    setError(message);
    setIsRecording(false);
    setWaveformData(new Array(32).fill(0));
  }, []);

  const handleDurationUpdate = useCallback((d: number) => {
    setDuration(d);
  }, []);

  const handleMaxDurationReached = useCallback(() => {
    setIsMaxDurationReached(true);
  }, []);

  const audioRecorder = useAudioRecorder({
    onError: handleError,
    onDurationUpdate: handleDurationUpdate,
    onMaxDurationReached: handleMaxDurationReached,
  });

  const resetState = useCallback(() => {
    setIsRecording(false);
    setDuration(0);
    setWaveformData(new Array(32).fill(0));
    setIsTranscribing(false);
    setIsMaxDurationReached(false);
    isStoppingRef.current = false;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setIsMaxDurationReached(false);
    isStoppingRef.current = false;

    const success = await audioRecorder.startRecording();
    if (!success) return;

    setIsRecording(true);
    setDuration(0);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startWaveform(stream, (data) => setWaveformData(data));

    if (isSpeechSupported) {
      startRecognition((msg) => {
        console.warn(msg);
      });
    }
  }, [audioRecorder, startWaveform, startRecognition, isSpeechSupported]);

  const stopRecording = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    stopWaveform();
    stopRecognition();

    const result = await audioRecorder.stopRecording();

    if (!result) {
      resetState();
      return;
    }

    const { blob, duration: recordedDuration } = result;
    const { transcript, segments } = getResult();

    setIsRecording(false);
    setDuration(0);
    setWaveformData(new Array(32).fill(0));

    if (transcript) {
      setIsTranscribing(true);
    }

    const diary = {
      id: generateId(),
      audioBlob: blob,
      transcript,
      segments,
      duration: recordedDuration,
      createdAt: new Date().toISOString(),
      fileSize: blob.size,
    };

    try {
      await saveDiary(diary);
      await loadDiaries();
    } catch {
      setError("保存日记失败，请重试。");
    } finally {
      setIsTranscribing(false);
      isStoppingRef.current = false;
    }
  }, [audioRecorder, stopWaveform, stopRecognition, getResult, resetState, loadDiaries]);

  return {
    isRecording,
    duration,
    waveformData,
    isTranscribing,
    error,
    isMaxDurationReached,
    maxDuration: MAX_RECORDING_DURATION,
    startRecording,
    stopRecording,
  };
}
