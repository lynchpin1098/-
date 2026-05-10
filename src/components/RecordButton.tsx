import { Mic, Square } from "lucide-react";
import { useRef, useState, useCallback } from "react";

interface RecordButtonProps {
  isRecording: boolean;
  duration: number;
  maxDuration: number;
  waveformData: number[];
  isMaxDurationReached: boolean;
  onStart: () => void;
  onStop: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function RecordButton({
  isRecording,
  duration,
  maxDuration,
  waveformData,
  isMaxDurationReached,
  onStart,
  onStop,
}: RecordButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const startYRef = useRef<number>(0);
  const hasTriggeredRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsPressed(true);
    startYRef.current = e.clientY;
    onStart();
  }, [onStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (!hasTriggeredRef.current) return;
    hasTriggeredRef.current = false;
    setIsPressed(false);
    onStop();
  }, [onStop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isRecording) return;
    const deltaY = Math.abs(e.clientY - startYRef.current);
    if (deltaY > 100) {
      // 用户向下滑动超过100px，视为取消录音
      if (hasTriggeredRef.current) {
        hasTriggeredRef.current = false;
        setIsPressed(false);
        onStop();
      }
    }
  }, [isRecording, onStop]);

  const progressPercent = isRecording ? Math.min(100, (duration / maxDuration) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {isRecording && (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-sm font-light tracking-widest ${isMaxDurationReached ? "text-red-400" : "text-base-muted"}`}>
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </span>
          {isMaxDurationReached && (
            <span className="text-xs text-red-400">已达到最大录音时长</span>
          )}
        </div>
      )}

      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <div className="absolute w-28 h-28 rounded-full bg-base-accent/20 animate-pulse-ring" />
            <div className="absolute w-28 h-28 rounded-full bg-base-accent/15 animate-pulse-ring-delay" />
            <div className="absolute w-28 h-28 rounded-full bg-base-accent/10 animate-pulse-ring-delay2" />
          </>
        )}

        {/* 进度环 */}
        {isRecording && (
          <svg className="absolute w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-base-accent/20"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progressPercent * 2.89} 289`}
              className="text-base-accent transition-all duration-1000"
            />
          </svg>
        )}

        <button
          ref={buttonRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`
            relative z-10 w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 select-none touch-none
            ${
              isRecording
                ? "bg-base-accent scale-110 shadow-lg shadow-base-accent/30"
                : "bg-base-card hover:bg-base-hover active:scale-95 shadow-md"
            }
            ${isPressed ? "scale-105" : ""}
          `}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white fill-white" />
          ) : (
            <Mic className="w-8 h-8 text-base-muted" />
          )}
        </button>
      </div>

      {isRecording && waveformData.length > 0 && (
        <div className="flex items-center justify-center gap-[3px] h-8">
          {waveformData.map((value, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-base-accent/60 transition-all duration-75"
              style={{
                height: `${Math.max(4, value * 28)}px`,
                animationDelay: `${i * 30}ms`,
              }}
            />
          ))}
        </div>
      )}

      <span className="text-base-muted/60 text-xs font-light">
        {isRecording ? "松开结束录音，下滑取消" : "长按开始录音"}
      </span>
    </div>
  );
}
