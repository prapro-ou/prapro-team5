import { create } from 'zustand';
import type { GameStats } from '../types/game';

interface GameStore {
  // ゲーム統計
  stats: GameStats;

}
