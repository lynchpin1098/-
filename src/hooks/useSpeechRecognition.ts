import { useRef, useCallback, useEffect } from "react";
import type { TranscriptSegment } from "@/utils/db";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface SpeechRecognitionState {
  isSupported: boolean;
  error: string | null;
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const segmentsRef = useRef<TranscriptSegment[]>([]);
  const fullTranscriptRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  const isSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startRecognition = useCallback((onError?: (msg: string) => void) => {
    if (!isSupported) {
      onError?.("当前浏览器不支持语音转文字功能");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    segmentsRef.current = [];
    fullTranscriptRef.current = "";
    startTimeRef.current = Date.now();
    isActiveRef.current = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i] as unknown as SpeechRecognitionResult;
        const transcript = result[0].transcript;
        if (result.isFinal) {
          const now = Date.now();
          const elapsed = (now - startTimeRef.current) / 1000;
          segmentsRef.current.push({
            text: transcript,
            startTime: Math.max(0, elapsed - 3),
            endTime: elapsed,
          });
          fullTranscriptRef.current += transcript;
        }
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === "no-speech") return;
      if (event.error === "aborted") return;
      onError?.(`语音识别出错: ${event.error}`);
    };

    recognition.onend = () => {
      if (isActiveRef.current) {
        try {
          recognition.start();
        } catch {
          isActiveRef.current = false;
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      onError?.("语音识别启动失败");
      isActiveRef.current = false;
    }
  }, [isSupported]);

  const stopRecognition = useCallback(() => {
    isActiveRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    }
  }, []);

  const getResult = useCallback(() => ({
    transcript: fullTranscriptRef.current,
    segments: [...segmentsRef.current],
  }), []);

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return {
    isSupported,
    startRecognition,
    stopRecognition,
    getResult,
  };
}
