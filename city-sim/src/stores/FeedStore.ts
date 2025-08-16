import { create } from "zustand";
import { playPressEnterSound } from "../components/SoundSettings";

export type Feed = {
  text: string;
  icon: string;
  timestamp: number;
  mood: "positive" | "negative";
};

interface FeedState {
  feeds: Feed[];
  addFeed: (feed: Feed) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feeds: [],
  addFeed: (feed) => {
    playPressEnterSound();
    set((state) => ({
      feeds: [feed, ...state.feeds].slice(0, 10), // 最大10件保持
    }));
  },
  clearFeed: () => set({ feeds: [] }),
}));
