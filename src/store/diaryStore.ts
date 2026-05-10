import { create } from "zustand";
import { type VoiceDiary, getAllDiaries, getDiaryCount, searchDiaries } from "@/utils/db";

interface SearchResultItem extends VoiceDiary {
  matchTime: number;
}

interface DiaryState {
  diaries: VoiceDiary[];
  count: number;
  searchResults: SearchResultItem[];
  searchKeyword: string;
  isSearching: boolean;
  loadDiaries: () => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
  performSearch: () => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  diaries: [],
  count: 0,
  searchResults: [],
  searchKeyword: "",
  isSearching: false,

  loadDiaries: async () => {
    const [diaries, count] = await Promise.all([getAllDiaries(), getDiaryCount()]);
    set({ diaries, count });
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
    if (!keyword.trim()) {
      set({ searchResults: [], isSearching: false });
    }
  },

  performSearch: async () => {
    const { searchKeyword, diaries } = get();
    if (!searchKeyword.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    const results = searchDiaries(diaries, searchKeyword);
    set({ searchResults: results, isSearching: false });
  },
}));
