import { create } from 'zustand';
import type { GameStats } from '../types/game';

interface GameStore {
  // ゲーム統計
  stats: GameStats;

  // アクション
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  advanceTime: () => void; // 時間を進めるアクションを追加
  addPopulation: (count: number) => void; // 追加
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
      newDate.week += 1;

      // 4週目を超えたら月を進める
      if (newDate.week > 4) {
        newDate.week = 1;
        newDate.month += 1;
        
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
}));
