import { create } from 'zustand';
import type { GameStats } from '../types/game';

interface GameStore {
  // ゲーム統計
  stats: GameStats;

}

const INITIAL_STATS: GameStats = {
    level: 1, 
    money: 10000,
    population: 0,
    satisfaction: 50,
    date: { year: 2024, month: 1 }
}
