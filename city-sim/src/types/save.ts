import type { GameStats } from './game';
import type { Facility } from './facility';
import type { TerrainType } from './terrain';
import type { Achievement } from './achievement';
import type { InfrastructureStatus } from '../stores/InfrastructureStore';

// 保存データのバージョン管理
export const SAVE_DATA_VERSION = '1.0.0';

// 保存データの基本構造
export interface SaveData {
  version: string;
  timestamp: number;
  cityName: string;
  
  // ゲーム進行データ
  gameStats: GameStats;
  levelUpMessage: string | null;
  
  // 施設データ
  facilities: Facility[];
  
  // 地形データ
  terrainMap: Array<{ x: number; y: number; terrain: TerrainType }>;
  
  // インフラ状況
  infrastructureStatus: InfrastructureStatus;
  
  // 実績データ
  achievements: Achievement[];
  
  // ゲーム設定
  gameSettings: {
    isPaused: boolean;
    gameSpeed: number;
    soundEnabled: boolean;
    bgmVolume: number;
    sfxVolume: number;
  };
  
  // メタデータ
  metadata: {
    totalPlayTime: number; // 総プレイ時間（ミリ秒）
    lastSaveTime: number;  // 最後の保存時刻
    saveCount: number;     // 保存回数
  };
}

// 保存操作の結果
export interface SaveResult {
  success: boolean;
  message: string;
  timestamp?: number;
  error?: string;
}

// 読み込み操作の結果
export interface LoadResult {
  success: boolean;
  message: string;
  data?: SaveData;
  error?: string;
}

// 自動保存の設定
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // ミリ秒
  maxSlots: number; // 最大自動保存スロット数
}

// 保存データの検証結果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
