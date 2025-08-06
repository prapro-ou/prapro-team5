import { create } from "zustand";
import type { Position } from "../types/grid";
import { useFacilityStore } from "./FacilityStore"; 

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
    set((state) => ({ showPanel: !state.showPanel }));
    useFacilityStore.getState().setSelectedFacilityType(null);
  },
  setShowPanel: (show) => set({ showPanel: show }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openCredits: () => set({ 
    isCreditsOpen: true,
    isSettingsOpen: false 
  }),
  closeCredits: () => set({ isCreditsOpen: false }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  switchToCredits: () => set({ 
    isSettingsOpen: false,
    isCreditsOpen: true 
  }),
  toggleInfrastructureInfo: () => set((state) => ({ isInfrastructureInfoOpen: !state.isInfrastructureInfoOpen })),
}));
