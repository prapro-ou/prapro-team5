import { create } from 'zustand';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import { useFacilityStore } from './FacilityStore';
import { FACILITY_DATA } from '../types/facility';

// --- 月次処理の型定義 ---
type MonthlyTask = (get: () => GameStore, set: (partial: Partial<GameStore>) => void) => void;

interface GameStore {
  stats: GameStats;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  advanceTime: () => void;
  addPopulation: (count: number) => void;
  recalculateSatisfaction: (facilities: Facility[]) => void;
  monthlyTasks: MonthlyTask[];
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
    const taxRevenue = Math.floor((stats.population * 10) * taxMultiplier);
    
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

// --- ストアの作成 ---

const INITIAL_STATS: GameStats = {
    level: 1, 
    money: 10000,
    population: 0,
    satisfaction: 50,
    date: { year: 2024, month: 1, week: 1 }
}

export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  monthlyTasks: [
    calculateTaxRevenue,
    // 将来、維持費などの新しい月次タスクをここに追加する
  ],

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
  
  // 人口を増やす処理
  addPopulation: (amount) => set((state) => ({ stats: { ...state.stats, population: state.stats.population + amount }})),


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
