import { create } from 'zustand';
import type { 
  FactionType, 
  FactionSupport, 
  SupportSystemState, 
  MonthlySupportHistory,
  YearlySupportHistory,
  CityStateForSupport,
  SupportCalculationResult,
  SupportLevelEffect
} from '../types/support';
import { FACTION_DATA, SUPPORT_LEVEL_EFFECTS } from '../types/support';
import { saveLoadRegistry } from './SaveLoadRegistry';

// SupportStoreのインターフェース
interface SupportStore {
  // 状態
  state: SupportSystemState;
  
  // 基本アクション
  initializeSupportSystem: () => void;
  getFactionSupport: (factionType: FactionType) => FactionSupport | undefined;
  getAllFactionSupports: () => FactionSupport[];
  
  // 支持率の更新
  updateFactionSupport: (factionType: FactionType, newRating: number) => void;
  updateAllFactionSupports: (newRatings: Record<FactionType, number>) => void;
  
  // 支持率の計算
  calculateSupportRatings: (cityState: CityStateForSupport) => Record<FactionType, number>;
  calculateFactionSupport: (factionType: FactionType, cityState: CityStateForSupport) => SupportCalculationResult;
  
  // 支持率による効果
  getSupportLevel: (rating: number) => 'very_low' | 'low' | 'neutral' | 'high' | 'very_high';
  getActiveEffects: (factionType: FactionType) => SupportLevelEffect['effects'];
  getAllActiveEffects: () => Record<FactionType, SupportLevelEffect['effects']>;
  
  // 履歴の管理
  recordMonthlyHistory: (year: number, month: number) => void;
  recordYearlyHistory: (year: number) => void;

  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}
