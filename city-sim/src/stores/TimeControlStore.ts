import { create } from 'zustand';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { useUIStore } from './UIStore';

interface TimeControlState {
  // 時間制御の状態
  isPaused: boolean;           // 一時停止状態
  speedMultiplier: number;     // 速度倍率
  baseInterval: number;        // 基本間隔（ミリ秒）
  wasPausedBeforeModal: boolean; // モーダル表示前の一時停止状態
  
  // アクション
  togglePause: () => void;     // 一時停止/再開の切り替え
  setSpeed: (multiplier: number) => void; // 速度設定
  pause: () => void;           // 一時停止
  resume: () => void;          // 再開
  
  // 計算プロパティ
  getCurrentInterval: () => number; // 現在の間隔を取得
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (data: any) => void;
  resetToInitial: () => void;
  
  // 自動停止機能
  checkModalState: () => void; // モーダル状態をチェックして自動停止/再開
}

export const useTimeControlStore = create<TimeControlState>((set, get) => {
  const initialState = {
    isPaused: false,
    speedMultiplier: 1,
    baseInterval: 5000, // 5秒（デフォ）
    wasPausedBeforeModal: false,
  };

  const store = {
    ...initialState,
    
    // アクション
    togglePause: () => {
      set((state) => ({
        isPaused: !state.isPaused
      }));
    },
    
    setSpeed: (multiplier: number) => {
      // 有効な速度倍率のみ許可
      if ([1, 2, 4].includes(multiplier)) {
        set({ speedMultiplier: multiplier });
      }
    },
    
    pause: () => {
      set({ isPaused: true });
    },
    
    resume: () => {
      set({ isPaused: false });
    },
    
    // 計算プロパティ
    getCurrentInterval: () => {
      const { baseInterval, speedMultiplier, isPaused } = get();
      if (isPaused) {
        return Infinity; // 一時停止中は無限大を返す
      }
      return baseInterval / speedMultiplier;
    },
    
    // セーブ・ロード機能
    saveState: () => {
      const { speedMultiplier } = get();
      return { speedMultiplier };
    },
    
    loadState: (data: any) => {
      if (data && typeof data.speedMultiplier === 'number' && [1, 2, 4].includes(data.speedMultiplier)) {
        set({ speedMultiplier: data.speedMultiplier });
      }
    },
    
    resetToInitial: () => {
      set(initialState);
    },
    
    // 自動停止機能
    checkModalState: () => {
      const uiState = useUIStore.getState();
      const { isPaused, wasPausedBeforeModal } = get();
      
      // モーダルが開いているかチェック
      const isModalOpen = uiState.isSettingsOpen || 
                         uiState.isCreditsOpen || 
                         uiState.isSaveLoadOpen || 
                         uiState.isStatisticsOpen;
      
      if (isModalOpen && !isPaused) {
        // モーダルが開いたとき、現在一時停止していない場合は停止
        set({ 
          isPaused: true, 
          wasPausedBeforeModal: false 
        });
        console.log('Modal opened, auto-pausing game time');
      } else if (!isModalOpen && isPaused && !wasPausedBeforeModal) {
        // モーダルが閉じたとき、モーダル表示前は一時停止していなかった場合は再開
        set({ isPaused: false });
        console.log('Modal closed, auto-resuming game time');
      }
    }
  };

  saveLoadRegistry.register('timeControl', store);
  
  return store;
}); 
