import { create } from 'zustand';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import { useFacilityStore } from './FacilityStore';
import { FACILITY_DATA } from '../types/facility';
import { citizenFeedTask } from './CitizenFeedTask';
import { calculateProduction, calculateConsumptionAndRevenue } from './EconomyStore';
import { applyParkSatisfactionPenalty } from './ParkSatisfactionTask';
import { useInfrastructureStore } from './InfrastructureStore';
import { playLevelUpSound } from '../components/SoundSettings';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { getCurrentWorkforceAllocations, executeMonthlyWorkforceAllocation } from './EconomyStore';
import { calculateTotalTaxRevenue } from './EconomyStore';

// --- 月次処理の型定義 ---
export type MonthlyTask = (get: () => GameStore, set: (partial: Partial<GameStore>) => void) => void;

interface GameStore {
  stats: GameStats;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  advanceTime: () => void;
  addPopulation: (count: number) => void;
  recalculateSatisfaction: (facilities: Facility[]) => void;
  monthlyTasks: MonthlyTask[];
  levelUpMessage: string | null;
  setLevelUpMessage: (msg: string | null) => void;
  usedWorkforce: number;
  recalculateUsedWorkforce: () => void;
  
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

// --- 月次処理の具体的なロジックを独立した関数として定義 ---

/**
 * 税収を計算し、資金に加算するタスク
 */
const calculateTaxRevenue: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const hasCityHall = facilities.some(f => f.type === 'city_hall');

  if (hasCityHall && stats.population > 0) {
    const taxRevenue = calculateTotalTaxRevenue(stats, facilities);
    
    if (taxRevenue > 0) {
      const currentMoney = get().stats.money;
      set({
        stats: {
          ...stats,
          money: currentMoney + taxRevenue
        }
      });
      console.log(`Total Tax Revenue: +$${taxRevenue}`);
    }
  }
};

/**
 * 施設の維持費を合計し、資金から差し引くタスク
 */
const payMaintenanceCost: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  let totalCost = 0;
  facilities.forEach(facility => {
    const data = FACILITY_DATA[facility.type];
    if (data && data.maintenanceCost) {
      totalCost += data.maintenanceCost;
    }
  });
  if (totalCost > 0) {
    const currentMoney = get().stats.money;
    set({
      stats: {
        ...stats,
        money: currentMoney - totalCost
      }
    });
    console.log(`Maintenance Cost: -$${totalCost}`);
  }
};
/**
 * 満足度に応じて人口を増減させるタスク
 */
const adjustPopulationBySatisfaction: MonthlyTask = (get, set) => {
  const { stats } = get();
  let populationChange = 0;
  if (stats.satisfaction >= 80) {
    // 満足度が高い場合、人口増加
    populationChange = Math.max(1, Math.floor(stats.population * 0.05)); // 5%増加、最低1人
  } else if (stats.satisfaction < 20) {
    // 満足度が低い場合、人口減少
    populationChange = -Math.max(1, Math.floor(stats.population * 0.05)); // 5%減少、最低1人
  }
  if (populationChange !== 0) {
    set({
      stats: {
        ...stats,
        population: Math.max(0, stats.population + populationChange)
      }
    });
    console.log(`Population ${populationChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(populationChange)} due to satisfaction (${stats.satisfaction})`);
  }
};
/**
 * 新しい経済サイクルを処理するタスク
 */
const processEconomicCycle: MonthlyTask = (get, set) => {
  const facilities = useFacilityStore.getState().facilities;
  let currentStats = get().stats;

  // 1. 製品を生産する
  const producedGoods = calculateProduction(currentStats, facilities);
  if (producedGoods > 0) {
    currentStats = { ...currentStats, goods: currentStats.goods + producedGoods };
    console.log(`Produced goods: +${producedGoods}`);
  }

  // 2. 製品を消費して収益を得る
  const { consumed, revenue } = calculateConsumptionAndRevenue(currentStats, facilities);
  if (consumed > 0) {
    currentStats = {
      ...currentStats,
      goods: currentStats.goods - consumed,
      money: currentStats.money + revenue
    };
    console.log(`Consumed goods: -${consumed}, Revenue from commerce: +${revenue}`);
  }
  
  // 最終的な状態を更新
  set({ stats: currentStats });
};

/**
 * インフラ計算タスク
 */
const processInfrastructure: MonthlyTask = (get, set) => {
  const facilities = useFacilityStore.getState().facilities;
  const { calculateInfrastructure, getInfrastructureShortage } = useInfrastructureStore.getState();
  
  // インフラ状況を計算
  calculateInfrastructure(facilities);
  
  // インフラ不足
  const shortage = getInfrastructureShortage();
  let satisfactionPenalty = 0;
  
  // 水道不足
  if (shortage.water > 0) {
    satisfactionPenalty += Math.min(20, shortage.water / 10);
    console.log(`Water shortage: -${shortage.water}, Satisfaction penalty: -${Math.min(20, shortage.water / 10)}`);
  }
  
  // 電気不足
  if (shortage.electricity > 0) {
    satisfactionPenalty += Math.min(20, shortage.electricity / 10);
    console.log(`Electricity shortage: -${shortage.electricity}, Satisfaction penalty: -${Math.min(20, shortage.electricity / 10)}`);
  }
  
  // 満足度更新
  if (satisfactionPenalty > 0) {
    const currentStats = get().stats;
    const newSatisfaction = Math.max(0, currentStats.satisfaction - satisfactionPenalty);
    set({
      stats: {
        ...currentStats,
        satisfaction: newSatisfaction
      }
    });
    console.log(`Infrastructure shortage total penalty: -${satisfactionPenalty}`);
  }
};

/*
 * 人口が一定数を超えたらレベルアップするタスク
 */
// レベルアップ判定関数（人口や満足度など複数条件に対応可能）
function checkLevelUp(stats: GameStats, set: (partial: Partial<GameStore>) => void) {
  // レベルごとの人口閾値
  const levelThresholds = [0, 100, 300, 1000, 3000, 10000];
  let newLevel = stats.level;
  let levelUpMsg = null;
  // 例：今後は満足度条件も追加可能
  while (
    newLevel + 1 < levelThresholds.length &&
    stats.population >= levelThresholds[newLevel + 1]
    // && stats.satisfaction >= 50  // 例：満足度条件を追加したい場合
  ) {
    newLevel++;
    levelUpMsg = `レベル${newLevel}にアップしました！`;
  }
  if (newLevel !== stats.level) {
    // レベルアップ効果音を再生
    playLevelUpSound();
    
    set({
      stats: {
        ...stats,
        level: newLevel
      },
      levelUpMessage: levelUpMsg
    });
    console.log(`Level Up! 都市レベル${stats.level} → ${newLevel}`);
  }
}
// --- ストアの作成 ---


const INITIAL_STATS: GameStats = {
    level: 1, 
    money: 10000,
    population: 0,
    satisfaction: 50,
    workforce: 0, // 労働力（初期値0、人口から計算する場合は後で上書き）
    goods: 0,     // 製品（初期値0）
    workforceAllocations: [], // 労働力配分情報（初期値は空配列）
    date: { year: 2024, month: 1, week: 1, totalWeeks: 1 }
}


export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  monthlyTasks: [
    // 労働力配分を最初に実行
    (get, set) => {
      const facilities = useFacilityStore.getState().facilities;
      const { stats } = get();
      
      // 労働力配分を実行
      const newAllocations = executeMonthlyWorkforceAllocation(facilities, stats.workforce);
      
      // 配分結果をGameStoreの状態に反映
      set({
        stats: {
          ...stats,
          workforceAllocations: newAllocations
        }
      });
      
      // 労働力配分の状況をログ出力
      const allocations = getCurrentWorkforceAllocations(get().stats);
      if (allocations.length > 0) {
        console.log('=== 労働力配分状況 ===');
        allocations.forEach(allocation => {
          const efficiencyPercent = (allocation.efficiency * 100).toFixed(0);
          console.log(`${allocation.facility.type}: ${allocation.assignedWorkforce}人配分, ${efficiencyPercent}%稼働`);
        });
        console.log('=====================');
      }
    },
    calculateTaxRevenue,
    payMaintenanceCost,
    adjustPopulationBySatisfaction,
    processEconomicCycle,
    applyParkSatisfactionPenalty,
    processInfrastructure,
    citizenFeedTask,
  ],
  levelUpMessage: null,
  setLevelUpMessage: (msg) => set({ levelUpMessage: msg }),
  usedWorkforce: 0,
  recalculateUsedWorkforce: () => {
    const facilities = useFacilityStore.getState().facilities;
    const workforce = facilities.reduce((total, facility) => {
      const workforceData = FACILITY_DATA[facility.type].workforceRequired;
      if (workforceData) {
        return total + workforceData.max; // 最大労働力で計算
      }
      return total;
    }, 0);
    set({ usedWorkforce: workforce });
  },

  addMoney: (amount) => set((state) => ({ stats: { ...state.stats, money: state.stats.money + amount }})),
  
  spendMoney: (amount) => {
    const currentMoney = get().stats.money;
    if (currentMoney >= amount) {
      set((state) => ({
        stats: {
          ...state.stats,
          money: currentMoney - amount
        }
      }));
      return true;
    }
    return false;
  },

  advanceTime: () => {
    const { stats, monthlyTasks } = get();
    const newStats = { ...stats };
    
    // 週の進行
    newStats.date.week++;
    newStats.date.totalWeeks++;
    
    // 月の進行
    if (newStats.date.week > 4) {
      newStats.date.week = 1;
      newStats.date.month++;
      
      // 年の進行
      if (newStats.date.month > 12) {
        newStats.date.month = 1;
        newStats.date.year++;
      }
      
      // 月次タスクの実行
      monthlyTasks.forEach(task => task(get, set));
    }
    
    // 労働力の再計算
    const { recalculateUsedWorkforce } = get();
    recalculateUsedWorkforce();
    
    // 満足度の再計算
    const facilities = useFacilityStore.getState().facilities;
    const { recalculateSatisfaction } = get();
    recalculateSatisfaction(facilities);
    
    set({ stats: newStats });
    
    // レベルアップチェック
    checkLevelUp(newStats, set);
  },

  addPopulation: (count) => {
    const { stats } = get();
    const newPopulation = Math.max(0, stats.population + count);
    const newWorkforce = Math.floor(newPopulation * 0.6); // 人口の60%が労働力
    
    set({
      stats: {
        ...stats,
        population: newPopulation,
        workforce: newWorkforce
      }
    });
  },

  recalculateSatisfaction: (facilities) => {
    const { stats } = get();
    let totalSatisfaction = 50; // 基本満足度
    
    // 公園の効果を計算
    facilities.forEach(facility => {
      if (facility.type === 'park') {
        const parkData = FACILITY_DATA[facility.type];
        const effectRadius = parkData.effectRadius || 3;
        
        // 公園の効果範囲内の住宅をカウント
        let affectedHouses = 0;
        facilities.forEach(otherFacility => {
          if (otherFacility.type === 'residential') {
            const distance = Math.sqrt(
              Math.pow(facility.position.x - otherFacility.position.x, 2) +
              Math.pow(facility.position.y - otherFacility.position.y, 2)
            );
            if (distance <= effectRadius) {
              affectedHouses++;
            }
          }
        });
        
        totalSatisfaction += affectedHouses * 5; // 公園1つにつき5ポイント
      }
    });
    
    // 工業区画の環境悪化効果
    const industrialCount = facilities.filter(f => f.type === 'industrial').length;
    totalSatisfaction -= industrialCount * 3;
    
    // 満足度を0-100の範囲に制限
    totalSatisfaction = Math.max(0, Math.min(100, totalSatisfaction));
    
    set({
      stats: {
        ...stats,
        satisfaction: totalSatisfaction
      }
    });
  },

  // セーブ・ロード機能
  saveState: () => {
    const state = get();
    return {
      stats: state.stats,
      levelUpMessage: state.levelUpMessage,
      usedWorkforce: state.usedWorkforce
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.stats) {
      set({
        stats: savedState.stats,
        levelUpMessage: savedState.levelUpMessage || null,
        usedWorkforce: savedState.usedWorkforce || 0
      });
    }
  },

  resetToInitial: () => {
    set({
      stats: INITIAL_STATS,
      levelUpMessage: null,
      usedWorkforce: 0
    });
  }
}));

// 自動登録
saveLoadRegistry.register('game', useGameStore.getState());
