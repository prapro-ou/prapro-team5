import type { SaveData, SaveResult, LoadResult, ValidationResult } from '../types/save';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import type { TerrainType } from '../types/terrain';
import type { Reward } from '../components/RewardPanel';
import type { InfrastructureStatus } from '../stores/InfrastructureStore';
import { SAVE_DATA_VERSION } from '../types/save';

// ローカルストレージのキー
const SAVE_DATA_KEY = 'city-sim-save-data';
const SAVE_METADATA_KEY = 'city-sim-save-metadata';

// ゲーム状態をセーブデータに変換
export function createSaveData(
	gameStats: GameStats,
	facilities: Facility[],
	terrainMap: Map<string, TerrainType>,
	infrastructureStatus: InfrastructureStatus,
	rewards: Reward[],
	gameSettings: {
		isPaused: boolean;
		gameSpeed: number;
		soundEnabled: boolean;
		bgmVolume: number;
		sfxVolume: number;
	},
	cityName: string = 'My City'
): SaveData {
	// 地形マップを配列形式に変換
	const terrainArray: Array<{ x: number; y: number; terrain: TerrainType }> = [];
	terrainMap.forEach((terrain, key) => {
		const [x, y] = key.split(',').map(Number);
		terrainArray.push({ x, y, terrain });
	});

	return {
		version: SAVE_DATA_VERSION,
		timestamp: Date.now(),
		cityName,
		gameStats,
		levelUpMessage: null,
		usedWorkforce: 0,
		facilities,
		terrainMap: terrainArray,
		infrastructureStatus,
		rewards,
		gameSettings,
		metadata: {
			totalPlayTime: 0, // 後で実装
			lastSaveTime: Date.now(),
			saveCount: 1
		}
	};
}

// ゲームデータをローカルストレージに保存
export function saveToLocalStorage(saveData: SaveData): SaveResult {
  try {
    // セーブデータを保存
    localStorage.setItem(SAVE_DATA_KEY, JSON.stringify(saveData));
    
    // メタデータを更新
    const metadata = {
      lastSaveTime: Date.now(),
      saveCount: (saveData.metadata.saveCount || 0) + 1,
      cityName: saveData.cityName,
      timestamp: saveData.timestamp
    };
    localStorage.setItem(SAVE_METADATA_KEY, JSON.stringify(metadata));
    
    return {
      success: true,
      message: `ゲームが保存されました: ${saveData.cityName}`,
      timestamp: Date.now()
    };
  } 
	catch (error) {
    return {
      success: false,
      message: 'セーブに失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
