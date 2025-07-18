import { create } from 'zustand';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility'; // Facility型をインポート（パスは適宜修正）
import { FACILITY_DATA } from '../types/facility'; // 施設データのインポート（パスは適宜修正）
import { useFacilityStore } from './FacilityStore';
interface GameStore {
  // ゲーム統計
  stats: GameStats;

  // アクション
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  advanceTime: () => void; // 時間を進めるアクションを追加
  addPopulation: (count: number) => void; // 追加
  recalculateSatisfaction: (facilities: Facility[]) => void;
}

const INITIAL_STATS: GameStats = {
    level: 1, 
    money: 10000,
    population: 0,
    satisfaction: 50,
    date: { year: 2024, month: 1, week: 1 }
}

export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,

  addMoney: (amount) => set((state) => ({
    stats: {
      ...state.stats,
      money: state.stats.money + amount
    }
  })),

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

  // 時間を1週間進める関数にロジックを変更
  advanceTime: () => {
    set((state) => {
      const newDate = { ...state.stats.date };
      let newMoney = state.stats.money;
      newDate.week += 1;

      // 4週目を超えたら月を進める
      if (newDate.week > 4) {
        newDate.week = 1;
        newDate.month += 1;
        
        // --- ここから税収ロジック ---
        // FacilityStoreから現在の施設リストを取得
        const facilities = useFacilityStore.getState().facilities;
        // 市役所が存在するかチェック
        const hasCityHall = facilities.some(f => f.type === 'city_hall');

        if (hasCityHall) {
          // 税率を満足度に応じて変動させる (満足度50%を基準の1.0倍とする)
          const taxMultiplier = state.stats.satisfaction / 50;
          // 税収計算：(人口 * 基本税額) * 満足度補正
          const taxRevenue = Math.floor((state.stats.population * 10) * taxMultiplier);
          
          if (taxRevenue > 0) {
            newMoney += taxRevenue;
            console.log(`Tax Revenue: +$${taxRevenue} (Satisfaction Bonus: ${taxMultiplier.toFixed(2)}x)`);
          }
        }
        // --- 税収ロジックここまで ---
        // 12月を超えたら年を繰り上げる
        if (newDate.month > 12) {
          newDate.month = 1;
          newDate.year += 1;
        }
      }

      return {
        stats: {
          ...state.stats,
          date: newDate,
          money: newMoney,
        },
      };
    });
  },
  // 人口を増やすアクションの定義
  addPopulation: (amount: number) => set((state) => ({
    stats: {
      ...state.stats,
      population: state.stats.population + amount
    }
  })),

// 満足度を再計算するアクション
  recalculateSatisfaction: (facilities) => { // 引数で施設リストを受け取る
    let totalSatisfaction = 50; // 基本満足度

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
  }
}));
