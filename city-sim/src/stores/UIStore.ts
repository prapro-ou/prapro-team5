import { create } from "zustand";
import type { Position } from "../types/grid";

export interface UIStore {
  // パネルの表示状態
  showPanel: boolean;
  isSettingsOpen: boolean;
  isCreditsOpen: boolean;

  selectedTile: Position | null;

  // アクション
  togglePanel: () => void;
  setShowPanel: (show: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openCredits: () => void;
  closeCredits: () => void;
  setSelectedTile: (tile: Position | null) => void;
}
