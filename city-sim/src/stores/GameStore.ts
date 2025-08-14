import { create } from 'zustand';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import { useFacilityStore } from './FacilityStore';
import { FACILITY_DATA } from '../types/facility';
import { useFeedStore } from './FeedStore';
import { getResidentialsWithoutPark } from '../utils/parkEffect';
import { calculateProduction, calculateConsumptionAndRevenue } from './EconomyStore';
import { applyParkSatisfactionPenalty } from './ParkSatisfactionTask';
import { useInfrastructureStore } from './InfrastructureStore';
import { playLevelUpSound } from '../components/SoundSettings';
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
  usedWorkforce: number; // 追加
  recalculateUsedWorkforce: () => void; // 追加
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
    const taxMultiplier = stats.satisfaction / 50;
    const taxRevenue = Math.floor((stats.population * 5) * taxMultiplier);
    
    if (taxRevenue > 0) {
      const currentMoney = get().stats.money;
      set({
        stats: {
          ...stats,
          money: currentMoney + taxRevenue
        }
      });
      console.log(`Tax Revenue: +$${taxRevenue} (Satisfaction Bonus: ${taxMultiplier.toFixed(2)}x)`);
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
    date: { year: 2024, month: 1, week: 1, totalWeeks: 1 }
}

export const citizenFeedTask: MonthlyTask = (get, set) => {
  const stats = get().stats;
  const facilities = useFacilityStore.getState().facilities;
  const feedStore = useFeedStore.getState();
  const now = Date.now();

  // 資源不足
  if (stats.goods <= 10) {
    feedStore.addFeed({
      text: "お店に品物が全然ないよ！工業地帯を増やして生産して！🏭",
      icon: "shop",
      timestamp: now
    });
  }

  // 労働力不足
  const totalRequiredWorkforce = facilities.reduce((sum, f) => {
    const data = FACILITY_DATA[f.type];
    return sum + (data?.requiredWorkforce || 0);
  }, 0);
  if (stats.workforce < totalRequiredWorkforce - 10) {
    feedStore.addFeed({
      text: "働き口がない…商業地や工業地帯を建ててほしいな…💼",
      icon: "work",
      timestamp: now
    });
  }

  // 公園サービス範囲外住宅
  const residentials = facilities.filter(f => f.type === 'residential');
  const parks = facilities.filter(f => f.type === 'park');
  const outOfRangeResidentials = getResidentialsWithoutPark(residentials, parks);
  if (outOfRangeResidentials.length > 0) {
    feedStore.addFeed({
      text: "近くに公園がなくて、子どもを遊ばせる場所がないよ！🌳",
      icon: "park",
      timestamp: now
    });
  }

  // 満足度
  if (stats.satisfaction < 30) {
    feedStore.addFeed({
      text: "この街、なんだか退屈だ…何か楽しいことはないのかな？😞",
      icon: "sad",
      timestamp: now
    });
  } else if (stats.satisfaction > 80) {
    feedStore.addFeed({
      text: "この街は本当に住みやすい！市長に感謝！😄",
      icon: "happy",
      timestamp: now
    });
  }
};

export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  monthlyTasks: [
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
  usedWorkforce: 0, // 初期値0
  recalculateUsedWorkforce: () => {
    const facilities = useFacilityStore.getState().facilities;
    const workforce = facilities.reduce((total, facility) => {
      const data = FACILITY_DATA[facility.type];
      return total + (data?.requiredWorkforce || 0);
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
  
  // 人口を増やす処理（レベルアップ判定呼び出し＆労働力自動計算）
  addPopulation: (amount) => {
    set((state) => {
      const newPopulation = state.stats.population + amount;
      // 労働力は人口の50%とする（今後調整可）
      const newWorkforce = Math.floor(newPopulation * 0.5);
      const newStats = {
        ...state.stats,
        population: newPopulation,
        workforce: newWorkforce
      };
      return { stats: newStats };
    });
    // setの直後にgetで最新statsを取得し、レベルアップ判定
    const updatedStats = { ...get().stats, population: get().stats.population, workforce: get().stats.workforce };
    checkLevelUp(updatedStats, set);
  },


  // 満足度を再計算する処理
  recalculateSatisfaction: (facilities) => {
    let totalSatisfaction = 50;
    facilities.forEach(facility => {
      const facilityData = FACILITY_DATA[facility.type];
      if (facilityData && facilityData.satisfaction) {
        totalSatisfaction += facilityData.satisfaction;
      }
    });
    const newSatisfaction = Math.max(0, Math.min(100, totalSatisfaction));
    set(state => ({
      stats: {
        ...state.stats,
        satisfaction: newSatisfaction
      }
    }));
  },

  // 時間を進める処理
  advanceTime: () => {
    const currentDate = get().stats.date;
    const newDate = { ...currentDate };
    
    newDate.week += 1;
    newDate.totalWeeks += 1; // 絶対週数を増加

    if (newDate.week > 4) {
      newDate.week = 1;
      newDate.month += 1;
      
      if (newDate.month > 12) {
        newDate.month = 1;
        newDate.year += 1;
      }
      
      get().monthlyTasks.forEach(task => task(get, set));
    }

    set(state => ({
      stats: {
        ...state.stats,
        date: newDate
      }
    }));
  },
}));
