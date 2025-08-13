import { create } from "zustand";
import type { Position } from "../types/grid";
import { useFacilityStore } from "./FacilityStore"; 
import { playPanelSound } from "../components/SoundSettings"; 

export interface UIStore {
  // パネルの表示状態
  showPanel: boolean;
  isSettingsOpen: boolean;
  isCreditsOpen: boolean;
  isInfrastructureInfoOpen: boolean;

  selectedTile: Position | null;

  // アクション
  togglePanel: () => void;
  setShowPanel: (show: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openCredits: () => void;
  closeCredits: () => void;
  setSelectedTile: (tile: Position | null) => void;
  switchToCredits: () => void; 
  toggleInfrastructureInfo: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // 初期状態
  showPanel: false,
  isSettingsOpen: false,
  isCreditsOpen: false,
  selectedTile: null,
  isInfrastructureInfoOpen: false,

  togglePanel: () => {
    set((state) => {
      const newShowPanel = !state.showPanel;
      playPanelSound(); 
      return { showPanel: newShowPanel };
    });
    useFacilityStore.getState().setSelectedFacilityType(null);
  },
  setShowPanel: (show) => {
    set((state) => {
      if (show !== state.showPanel) {
        playPanelSound(); 
      }
      return { showPanel: show };
    });
  },
  openSettings: () => {
    playPanelSound();
    set({ isSettingsOpen: true });
  },
  closeSettings: () => {
    playPanelSound();
    set({ isSettingsOpen: false });
  },
  openCredits: () => {
    playPanelSound();
    set({ 
      isCreditsOpen: true,
      isSettingsOpen: false 
    });
  },
  closeCredits: () => {
    playPanelSound();
    set({ isCreditsOpen: false });
  },
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  switchToCredits: () => set({ 
    isSettingsOpen: false,
    isCreditsOpen: true 
  }),
  toggleInfrastructureInfo: () => {
    set((state) => {
      playPanelSound(); 
      return { isInfrastructureInfoOpen: !state.isInfrastructureInfoOpen };
    });
  },
}));
