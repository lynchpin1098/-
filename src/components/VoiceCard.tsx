import { Play, Pause, Clock } from "lucide-react";
import { formatDate, formatDuration, formatMatchTime } from "@/utils/formatTime";
import type { VoiceDiary } from "@/utils/db";

interface VoiceCardProps {
  diary: VoiceDiary;
  matchTime?: number;
  isPlaying: boolean;
  currentTime: number;
  onPlay: (id: string, blob: Blob, startTime?: number) => void;
  onStop: () => void;
  keyword?: string;
}

export default function VoiceCard({
  diary,
  matchTime,
  isPlaying,
  currentTime,
  onPlay,
  onStop,
  keyword,
}: VoiceCardProps) {
  const handlePlay = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay(diary.id, diary.audioBlob, matchTime && matchTime > 0 ? matchTime : 0);
    }
  };

  return (
    <div className="bg-base-card rounded-2xl p-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-base-muted/60" />
            <span className="text-sm text-base-text font-light">
              {formatDate(diary.createdAt)}
            </span>
            <span className="text-xs text-base-muted/60 font-light">
              {formatDuration(diary.duration)}
            </span>
          </div>

          {isPlaying && (
            <div className="mt-2 mb-1">
              <div className="w-full h-1 bg-base-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-base-accent rounded-full transition-all duration-100"
                  style={{
                    width: `${Math.min(100, (currentTime / diary.duration) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {matchTime !== undefined && matchTime > 0 && keyword && (
            <p className="text-xs text-base-muted/80 font-light mt-1.5">
              在第 {formatMatchTime(matchTime)} 提到了「{keyword}」
            </p>
          )}
        </div>

        <button
          onClick={handlePlay}
          className="ml-3 w-10 h-10 rounded-full bg-base-bg flex items-center justify-center
                     hover:bg-base-hover active:scale-95 transition-all duration-150 shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-base-accent" />
          ) : (
            <Play className="w-4 h-4 text-base-muted ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
