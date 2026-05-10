import { useEffect } from "react";
import RecordButton from "@/components/RecordButton";
import VoiceCard from "@/components/VoiceCard";
import { useRecorder } from "@/hooks/useRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useDiaryStore } from "@/store/diaryStore";
import { Loader2, AlertCircle } from "lucide-react";

export default function RecordPage() {
  const { isRecording, duration, waveformData, isTranscribing, error, isMaxDurationReached, maxDuration, startRecording, stopRecording } =
    useRecorder();
  const { diaries, count, loadDiaries } = useDiaryStore();
  const { playingId, currentTime, play, stop } = useAudioPlayer();

  useEffect(() => {
    loadDiaries();
  }, [loadDiaries]);

  const recentDiaries = diaries.slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-base-bg">
      <header className="pt-12 pb-4 px-6 text-center">
        <h1 className="text-lg font-light text-base-text tracking-wider">语音日记</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {error && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-base-card rounded-xl max-w-xs">
            <AlertCircle className="w-4 h-4 text-base-accent shrink-0" />
            <span className="text-xs text-base-text font-light leading-relaxed">{error}</span>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 mb-6 text-base-muted text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>正在处理语音...</span>
          </div>
        )}

        <RecordButton
          isRecording={isRecording}
          duration={duration}
          maxDuration={maxDuration}
          waveformData={waveformData}
          isMaxDurationReached={isMaxDurationReached}
          onStart={startRecording}
          onStop={stopRecording}
        />

        <p className="mt-8 text-base-muted/50 text-xs font-light">
          已保存 {count} 条语音日记
        </p>
      </div>

      {recentDiaries.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-base-muted/40 font-light mb-3 px-2">最近记录</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {recentDiaries.map((diary) => (
              <VoiceCard
                key={diary.id}
                diary={diary}
                isPlaying={playingId === diary.id}
                currentTime={currentTime}
                onPlay={play}
                onStop={stop}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
