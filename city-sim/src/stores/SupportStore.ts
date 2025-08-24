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

// 初期状態の作成
const createInitialState = (): SupportSystemState => {
  const factionSupports: FactionSupport[] = Object.keys(FACTION_DATA).map(factionType => ({
    type: factionType as FactionType,
    currentRating: 50,        // 初期支持率は50%
    previousRating: 50,
    change: 0
  }));

  return {
    factionSupports,
    monthlyHistory: [],
    yearlyHistory: [],
    lastCalculationDate: {
      year: 1,
      month: 1
    }
  };
};

// 支持率計算のヘルパー関数
const calculateFactorScore = (value: number, min: number, max: number): number => {
  if (max === min) return 50; // 変化がない場合は50点
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

// 支持率レベルを判定するヘルパー関数
const getSupportLevel = (rating: number): 'very_low' | 'low' | 'neutral' | 'high' | 'very_high' => {
  if (rating >= 80) return 'very_high';
  if (rating >= 60) return 'high';
  if (rating >= 40) return 'neutral';
  if (rating >= 20) return 'low';
  return 'very_low';
};

// SupportStoreの作成
export const useSupportStore = create<SupportStore>((set, get) => ({
  // 初期状態
  state: createInitialState(),

  // 支持率システムの初期化
  initializeSupportSystem: () => {
    set({ state: createInitialState() });
  },

  // 特定の派閥の支持率を取得
  getFactionSupport: (factionType: FactionType) => {
    return get().state.factionSupports.find(support => support.type === factionType);
  },

  // 全派閥の支持率を取得
  getAllFactionSupports: () => {
    return get().state.factionSupports;
  },

  // 特定の派閥の支持率を更新
  updateFactionSupport: (factionType: FactionType, newRating: number) => {
    const currentState = get().state;
    const factionSupport = currentState.factionSupports.find(support => support.type === factionType);
    
    if (factionSupport) {
      const updatedSupports = currentState.factionSupports.map(support => {
        if (support.type === factionType) {
          return {
            ...support,
            previousRating: support.currentRating,
            currentRating: Math.max(0, Math.min(100, newRating)), // 0-100の範囲に制限
            change: newRating - support.currentRating
          };
        }
        return support;
      });

      set({
        state: {
          ...currentState,
          factionSupports: updatedSupports
        }
      });
    }
  },

  // 全派閥の支持率を一括更新
  updateAllFactionSupports: (newRatings: Record<FactionType, number>) => {
    const currentState = get().state;
    
    const updatedSupports = currentState.factionSupports.map(support => {
      const newRating = newRatings[support.type];
      if (newRating !== undefined) {
        return {
          ...support,
          previousRating: support.currentRating,
          currentRating: Math.max(0, Math.min(100, newRating)),
          change: newRating - support.currentRating
        };
      }
      return support;
    });

    set({
      state: {
        ...currentState,
        factionSupports: updatedSupports
      }
    });
  },

  // 全派閥の支持率を計算
  calculateSupportRatings: (cityState: CityStateForSupport): Record<FactionType, number> => {
    const results: Record<FactionType, number> = {} as Record<FactionType, number>;
    
    Object.keys(FACTION_DATA).forEach(factionType => {
      const result = get().calculateFactionSupport(factionType as FactionType, cityState);
      results[factionType as FactionType] = result.calculatedRating;
    });
    
    return results;
  },

  // 特定の派閥の支持率を計算
  calculateFactionSupport: (factionType: FactionType, cityState: CityStateForSupport): SupportCalculationResult => {
    const factionInfo = FACTION_DATA[factionType];
    const priorities = factionInfo.priorities;
    
    // 各要素のスコアを計算
    const factors = {
      taxStability: calculateFactorScore(cityState.taxRevenueGrowth, -50, 100), // 税収成長率
      infrastructure: calculateFactorScore(cityState.infrastructureEfficiency, 0, 1), // インフラ効率
      development: calculateFactorScore(cityState.totalFacilityCount, 0, 100), // 施設数
      fiscalBalance: calculateFactorScore(cityState.fiscalBalance, -10000, 10000), // 財政バランス
      satisfaction: cityState.satisfaction, // 満足度（そのまま使用）
      parksAndGreenery: calculateFactorScore(cityState.parkCount, 0, 20), // 公園数
      populationGrowth: calculateFactorScore(cityState.populationGrowth, -100, 500), // 人口増加
      commercialActivity: calculateFactorScore(cityState.commercialFacilityCount, 0, 50), // 商業施設数
      industrialActivity: calculateFactorScore(cityState.industrialFacilityCount, 0, 30), // 工業施設数
      workforceEfficiency: cityState.workforceEfficiency * 100, // 労働力効率
      infrastructureSurplus: calculateFactorScore(cityState.infrastructureSurplus, -100, 100) // インフラ余剰
    };
    
    // 重み付けで総合スコアを計算
    let totalScore = 0;
    Object.entries(priorities).forEach(([key, weight]) => {
      const factorKey = key as keyof typeof factors;
      totalScore += factors[factorKey] * (weight / 100);
    });
    
    // スコアを0-100の範囲に制限
    const calculatedRating = Math.max(0, Math.min(100, Math.round(totalScore)));
    
    return {
      factionType,
      calculatedRating,
      factors,
      totalScore
    };
  },

  // 支持率レベルを判定
  getSupportLevel: (rating: number) => {
    return getSupportLevel(rating);
  },

  // 特定の派閥のアクティブな効果を取得
  getActiveEffects: (factionType: FactionType) => {
    const factionSupport = get().getFactionSupport(factionType);
    if (!factionSupport) return {};
    
    const level = get().getSupportLevel(factionSupport.currentRating);
    const levelEffects = SUPPORT_LEVEL_EFFECTS[factionType];
    
    const activeEffect = levelEffects.find(effect => effect.level === level);
    return activeEffect ? activeEffect.effects : {};
  },

  // 全派閥のアクティブな効果を取得
  getAllActiveEffects: () => {
    const allEffects: Record<FactionType, SupportLevelEffect['effects']> = {} as Record<FactionType, SupportLevelEffect['effects']>;
    
    Object.keys(FACTION_DATA).forEach(factionType => {
      allEffects[factionType as FactionType] = get().getActiveEffects(factionType as FactionType);
    });
    
    return allEffects;
  },

  // 月次履歴を記録
  recordMonthlyHistory: (year: number, month: number) => {
    const currentState = get().state;
    const currentSupports = [...currentState.factionSupports];
    
    const monthlyHistory: MonthlySupportHistory = {
      year,
      month,
      factionSupports: currentSupports
    };

    set({
      state: {
        ...currentState,
        monthlyHistory: [...currentState.monthlyHistory, monthlyHistory],
        lastCalculationDate: { year, month }
      }
    });
  },

  // 年次履歴を記録
  recordYearlyHistory: (year: number) => {
    const currentState = get().state;
    const currentSupports = currentState.factionSupports;
    
    // 年間平均支持率を計算
    const averageRatings: Record<FactionType, number> = {} as Record<FactionType, number>;
    const yearEndRatings: Record<FactionType, number> = {} as Record<FactionType, number>;
    const totalChanges: Record<FactionType, number> = {} as Record<FactionType, number>;
    
    currentSupports.forEach(support => {
      averageRatings[support.type] = support.currentRating; // 簡易版（後で改善）
      yearEndRatings[support.type] = support.currentRating;
      totalChanges[support.type] = support.change;
    });

    const yearlyHistory: YearlySupportHistory = {
      year,
      averageRatings,
      yearEndRatings,
      totalChanges
    };

    set({
      state: {
        ...currentState,
        yearlyHistory: [...currentState.yearlyHistory, yearlyHistory]
      }
    });
  },

  // セーブ・ロード機能
  saveState: () => {
    return get().state;
  },

  loadState: (savedState: any) => {
    if (savedState) {
      set({ state: savedState });
    }
  },

  resetToInitial: () => {
    set({ state: createInitialState() });
  }
}));

// 自動登録
saveLoadRegistry.register('support', useSupportStore.getState());
