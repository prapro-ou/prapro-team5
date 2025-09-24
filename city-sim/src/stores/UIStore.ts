import { create } from "zustand";
import type { Position } from "../types/grid";
import { useFacilityStore } from "./FacilityStore"; 
import { playPanelSound } from "../components/SoundSettings"; 

export interface UIStore {
  // パネル表示状態
  showPanel: boolean;
  togglePanel: () => void;
  setShowPanel: (show: boolean) => void;
  
  // 設定画面
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  
  // クレジット画面
  isCreditsOpen: boolean;
  openCredits: () => void;
  closeCredits: () => void;
  
  // インフラ情報画面
  isInfrastructureInfoOpen: boolean;
  toggleInfrastructureInfo: () => void;
  
  // セーブ・ロード画面
  isSaveLoadOpen: boolean;
  openSaveLoad: () => void;
  closeSaveLoad: () => void;
  
  // 統計画面
  isStatisticsOpen: boolean;
  openStatistics: () => void;
  closeStatistics: () => void;
  
  // 年末評価結果表示画面
  isYearlyEvaluationResultOpen: boolean;
  openYearlyEvaluationResult: () => void;
  closeYearlyEvaluationResult: () => void;
  
  // ミッションパネル
  isMissionPanelOpen: boolean;
  openMissionPanel: () => void;
  closeMissionPanel: () => void;
  
  // オープニングシークエンス設定
  showOpeningSequence: boolean;
  setShowOpeningSequence: (show: boolean) => void;
  
  // 選択されたタイル
  selectedTile: Position | null;
  setSelectedTile: (tile: Position | null) => void;
  switchToCredits: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // 初期状態
  showPanel: false,
  isSettingsOpen: false,
  isCreditsOpen: false,
  selectedTile: null,
  isInfrastructureInfoOpen: false,
  isSaveLoadOpen: false,
  isStatisticsOpen: false,
  isYearlyEvaluationResultOpen: false,
  isMissionPanelOpen: false,
  showOpeningSequence: false, // デフォルトでオープニングなし

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
  openSaveLoad: () => {
    playPanelSound();
    set({ isSaveLoadOpen: true });
  },
  closeSaveLoad: () => {
    set({ isSaveLoadOpen: false });
  },
  openStatistics: () => {
    playPanelSound();
    set({ isStatisticsOpen: true });
  },
  closeStatistics: () => {
    playPanelSound();
    set({ isStatisticsOpen: false });
  },
  openYearlyEvaluationResult: () => {
    playPanelSound();
    set({ isYearlyEvaluationResultOpen: true });
  },
  closeYearlyEvaluationResult: () => {
    playPanelSound();
    set({ isYearlyEvaluationResultOpen: false });
  },
  openMissionPanel: () => {
    playPanelSound();
    set({ isMissionPanelOpen: true });
  },
  closeMissionPanel: () => {
    playPanelSound();
    set({ isMissionPanelOpen: false });
  },
  setShowOpeningSequence: (show) => {
    set({ showOpeningSequence: show });
  },
}));
