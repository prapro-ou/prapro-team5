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
import { calculateTotalTaxRevenue, calculateMonthlyBalance } from './EconomyStore';
import { useProductStore } from './ProductStore';
import { useYearlyEvaluationStore } from './YearlyEvaluationStore';

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
  
  // 活動中の施設のみ維持費を支払う
  facilities.forEach(facility => {
    if (!facility.isActive) {
      console.log(`施設 ${facility.type} (${facility.id}) は道路未接続のため維持費を免除`);
      return;
    }
    
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
 * レベルに応じて人口を増減させるタスク
 */
const adjustPopulationByGrowth: MonthlyTask = (get) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const residentials = facilities.filter(f => f.type === 'residential');
  let totalIncrease = 0;
  let growthrate = 0;
  let random = Math.random()*0.2 + 0.9;

  if (stats.level == 1) {
    growthrate = 0.2;
  } else if (stats.level == 2) {
    growthrate = 0.1;
  } else {
    growthrate = 0.03;
  } 

  for (const res of residentials) {
    // 道路接続されていない住宅施設からの人口増加は停止
    if (!res.isActive) {
      console.log(`住宅施設 ${res.id} は道路未接続のため人口増加を停止`);
      continue;
    }
    
    const basePop = FACILITY_DATA[res.type].basePopulation || 100; 
    totalIncrease += Math.floor(basePop * growthrate * random); // 条件係数を後で追加
  }
  console.log(`Population Growth: +${totalIncrease}`);
  get().addPopulation(totalIncrease);
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
    console.log(`Produced goods: +${producedGoods}`);
  }

  // 2. 製品を消費して収益を得る
  const { consumed, revenue } = calculateConsumptionAndRevenue(currentStats, facilities);
  if (consumed > 0) {
    currentStats = {
      ...currentStats,
      money: currentStats.money + revenue
    };
    console.log(`Consumed goods: -${consumed}, Revenue from commerce: +${revenue}`);
  }
  
  // 3. 製品需給状況をログ出力
  const { getProductSupplyDemandStatus } = useProductStore.getState();
  const { demand, production, efficiency } = getProductSupplyDemandStatus(facilities);
  console.log(`=== 製品需給状況 ===`);
  console.log(`需要: [原材料:${demand[0]}, 中間製品:${demand[1]}, 最終製品:${demand[2]}, サービス:${demand[3]}]`);
  console.log(`供給: [原材料:${production[0]}, 中間製品:${production[1]}, 最終製品:${production[2]}, サービス:${production[3]}]`);
  console.log(`製品効率: ${(efficiency * 100).toFixed(1)}%`);
  console.log(`====================`);
  
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

/**
 * 月次収支を計算し、統計に反映するタスク
 */
const processMonthlyBalance: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const { income, expense, balance } = calculateMonthlyBalance(stats, facilities);

  set({
    stats: {
      ...stats,
      monthlyBalance: { income, expense, balance }
    }
  });
  console.log(`Monthly Balance: Income +$${income}, Expense -$${expense}, Balance +$${balance}`);
};

/**
 * 月次データを累積するタスク
 */
const accumulateMonthlyData: MonthlyTask = (get, set) => {
  const { stats } = get();
  const currentMonth = stats.date.month - 1; // 配列のインデックスは0ベース
  
  // 年度が変わった場合は累積データをリセット
  if (stats.monthlyAccumulation.year !== stats.date.year) {
    set({
      stats: {
        ...stats,
        monthlyAccumulation: {
          year: stats.date.year,
          monthlyTaxRevenue: new Array(12).fill(0),
          monthlyMaintenanceCost: new Array(12).fill(0),
          monthlyPopulation: new Array(12).fill(0),
          monthlySatisfaction: new Array(12).fill(50)
        }
      }
    });
  }
  
  // 現在の月次データを累積
  const newAccumulation = { ...stats.monthlyAccumulation };
  
  // 税収を累積（市庁舎がある場合のみ）
  const facilities = useFacilityStore.getState().facilities;
  const hasCityHall = facilities.some(f => f.type === 'city_hall');
  if (hasCityHall && stats.population > 0) {
    const taxRevenue = calculateTotalTaxRevenue(stats, facilities);
    newAccumulation.monthlyTaxRevenue[currentMonth] = taxRevenue;
  }
  
  // 維持費を累積
  let totalMaintenanceCost = 0;
  facilities.forEach(facility => {
    if (facility.isActive) {
      const data = FACILITY_DATA[facility.type];
      if (data && data.maintenanceCost) {
        totalMaintenanceCost += data.maintenanceCost;
      }
    }
  });
  newAccumulation.monthlyMaintenanceCost[currentMonth] = totalMaintenanceCost;
  
  // 人口と満足度を累積
  newAccumulation.monthlyPopulation[currentMonth] = stats.population;
  newAccumulation.monthlySatisfaction[currentMonth] = stats.satisfaction;
  
  set({
    stats: {
      ...stats,
      monthlyAccumulation: newAccumulation
    }
  });
  
  console.log(`Monthly Data Accumulated: Month ${stats.date.month}, Tax: ${newAccumulation.monthlyTaxRevenue[currentMonth]}, Maintenance: ${newAccumulation.monthlyMaintenanceCost[currentMonth]}`);
};

/**
 * 年末評価処理タスク
 */
const processYearlyEvaluation: MonthlyTask = (get, set) => {
  const { stats } = get();
  
  // 12月の最終週の場合のみ実行
  if (stats.date.month === 12 && stats.date.week === 4) {
    console.log(`=== 年度${stats.date.year} 年末評価開始 ===`);
    
    const facilities = useFacilityStore.getState().facilities;
    const { executeYearlyEvaluation, calculateYearlyStats } = useYearlyEvaluationStore.getState();
    
    // 現在の年度の統計データを計算
    const yearlyStats = calculateYearlyStats(stats, facilities);
    
    // 年末評価を実行
    const yearlyEvaluation = executeYearlyEvaluation(stats, facilities);
    
    // 評価結果と年次統計をGameStoreの状態に反映
    set({
      stats: {
        ...stats,
        yearlyEvaluation,
        yearlyStats
      }
    });
    
    // 補助金を資金に追加
    if (yearlyEvaluation.subsidy > 0) {
      const currentMoney = get().stats.money;
      set({
        stats: {
          ...stats,
          money: currentMoney + yearlyEvaluation.subsidy
        }
      });
      
      console.log(`年末評価完了: ${yearlyEvaluation.grade}評価 (${yearlyEvaluation.totalScore}点)`);
      console.log(`補助金: +¥${yearlyEvaluation.subsidy.toLocaleString()}`);
      console.log(`=== 年度${stats.date.year} 年末評価完了 ===`);
    }
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
    workforceAllocations: [], // 労働力配分情報（初期値は空配列）
    date: { year: 2024, month: 1, week: 1, totalWeeks: 1 },
    monthlyBalance: { income: 0, expense: 0, balance: 0 }, // 月次収支の初期値
    yearlyEvaluation: null, // 年次評価データ（初期値はnull）
    yearlyStats: null, // 年次統計データ（初期値はnull）
    previousYearStats: null, // 前年度統計データ（初期値はnull）
    monthlyAccumulation: { // 月次データの累積（初期値は12ヶ月分の0配列）
      year: 2024,
      monthlyTaxRevenue: new Array(12).fill(0),
      monthlyMaintenanceCost: new Array(12).fill(0),
      monthlyPopulation: new Array(12).fill(0),
      monthlySatisfaction: new Array(12).fill(50)
    }
}


export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  monthlyTasks: [
    // 労働力配分を最初に実行
    (get, set) => {
      const facilities = useFacilityStore.getState().facilities;
      const { stats } = get();
      
      // 人口0の場合は配分をスキップ
      if (stats.population === 0) {
        console.log('人口0のため労働力配分をスキップ');
        return;
      }
      
      // 労働力配分を実行（人口の60%を労働力として使用）
      const availableWorkforce = Math.floor(stats.population * 0.6);
      const newAllocations = executeMonthlyWorkforceAllocation(facilities, availableWorkforce);
      
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
    processEconomicCycle,
    applyParkSatisfactionPenalty,
    processInfrastructure,
    processMonthlyBalance,
    accumulateMonthlyData, // 月次データ累積タスクを追加
    processYearlyEvaluation,
    adjustPopulationByGrowth,
    citizenFeedTask,
    // 他の月次タスクをここに追加
  ],
  levelUpMessage: null,
  setLevelUpMessage: (msg) => set({ levelUpMessage: msg }),

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
      
      // 月次タスク実行後の最新状態を取得して日付のみ更新
      const currentStats = get().stats;
      
      // 年度が変わった時に前年度の統計データを保存
      if (newStats.date.month === 1 && newStats.date.year > stats.date.year && currentStats.yearlyStats) {
        set({
          stats: {
            ...currentStats,
            previousYearStats: {
              year: currentStats.yearlyStats.year,
              totalTaxRevenue: currentStats.yearlyStats.totalTaxRevenue,
              totalMaintenanceCost: currentStats.yearlyStats.totalMaintenanceCost,
              populationGrowth: currentStats.yearlyStats.populationGrowth,
              facilityCount: currentStats.yearlyStats.facilityCount,
              infrastructureEfficiency: currentStats.yearlyStats.infrastructureEfficiency
            }
          }
        });
        console.log(`前年度(${currentStats.yearlyStats.year})の統計データを保存しました`);
      }
      
      set({
        stats: {
          ...currentStats,
          date: newStats.date
        }
      });
    } else {
      // 週の進行のみの場合
      set({ stats: newStats });
    }
    
    // 満足度の再計算
    const facilities = useFacilityStore.getState().facilities;
    const { recalculateSatisfaction } = get();
    recalculateSatisfaction(facilities);
    
    // レベルアップチェック
    checkLevelUp(get().stats, set);
  },

  addPopulation: (count) => {
    const { stats } = get();
    const newPopulation = Math.max(0, stats.population + count);
    
    set({
      stats: {
        ...stats,
        population: newPopulation
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
      levelUpMessage: state.levelUpMessage
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.stats) {
      const savedStats = savedState.stats;
      
      // 新しく追加したフィールドの初期化（後方互換性のため）
      const validatedStats: GameStats = {
        ...INITIAL_STATS, // デフォルト値を設定
        ...savedStats,    // 保存されたデータで上書き
        // 新しく追加したフィールドの初期化
        yearlyEvaluation: savedStats.yearlyEvaluation || null,
        yearlyStats: savedStats.yearlyStats || null,
        previousYearStats: savedStats.previousYearStats || null,
        monthlyAccumulation: savedStats.monthlyAccumulation || {
          year: savedStats.date?.year || 2024,
          monthlyTaxRevenue: new Array(12).fill(0),
          monthlyMaintenanceCost: new Array(12).fill(0),
          monthlyPopulation: new Array(12).fill(0),
          monthlySatisfaction: new Array(12).fill(50)
        }
      };
      
      set({
        stats: validatedStats,
        levelUpMessage: savedState.levelUpMessage || null
      });
      
      console.log('ゲーム状態をロードしました');
    }
  },

  resetToInitial: () => {
    set({
      stats: INITIAL_STATS,
      levelUpMessage: null
    });
  }
}));

// 自動登録
saveLoadRegistry.register('game', useGameStore.getState());
