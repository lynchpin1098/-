import { useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import VoiceCard from "@/components/VoiceCard";
import { useDiaryStore } from "@/store/diaryStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useDebounce } from "@/hooks/useDebounce";
import { FileQuestion } from "lucide-react";

export default function SearchPage() {
  const { searchKeyword, searchResults, isSearching, loadDiaries, setSearchKeyword, performSearch } =
    useDiaryStore();
  const { playingId, currentTime, play, stop, seekTo } = useAudioPlayer();

  useEffect(() => {
    loadDiaries();
  }, [loadDiaries]);

  const debouncedSearch = useDebounce(() => {
    performSearch();
  }, 300);

  const handleSearch = useCallback(() => {
    performSearch();
  }, [performSearch]);

  const handleKeywordChange = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword);
      if (keyword.trim()) {
        debouncedSearch();
      }
    },
    [setSearchKeyword, debouncedSearch]
  );

  const handlePlayWithSeek = useCallback(
    (id: string, blob: Blob, startTime?: number) => {
      play(id, blob, startTime || 0);
    },
    [play]
  );

  const handleKeywordClick = useCallback(
    (diaryId: string, matchTime: number) => {
      if (playingId === diaryId) {
        seekTo(matchTime);
      }
    },
    [playingId, seekTo]
  );

  return (
    <div className="flex flex-col h-full bg-base-bg">
      <header className="pt-12 pb-2 px-6">
        <h1 className="text-lg font-light text-base-text tracking-wider mb-4">搜索</h1>
        <SearchBar
          value={searchKeyword}
          onChange={handleKeywordChange}
          onSearch={handleSearch}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-base-accent/30 border-t-base-accent rounded-full animate-spin" />
          </div>
        )}

        {!isSearching && searchKeyword && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-base-muted/40">
            <FileQuestion className="w-10 h-10 mb-3" />
            <p className="text-sm font-light">没有找到相关语音</p>
          </div>
        )}

        {!isSearching && !searchKeyword && (
          <div className="flex flex-col items-center justify-center py-16 text-base-muted/30">
            <p className="text-sm font-light">输入关键词搜索语音内容</p>
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-base-muted/40 font-light px-2 mb-1">
              找到 {searchResults.length} 条相关语音
            </p>
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() =>
                  result.matchTime > 0 && handleKeywordClick(result.id, result.matchTime)
                }
              >
                <VoiceCard
                  diary={result}
                  matchTime={result.matchTime}
                  isPlaying={playingId === result.id}
                  currentTime={currentTime}
                  onPlay={handlePlayWithSeek}
                  onStop={stop}
                  keyword={searchKeyword}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
