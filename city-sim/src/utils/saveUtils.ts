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

// ゲームデータをローカルストレージから読み込み
export function loadFromLocalStorage(): LoadResult {
  try {
    const saveDataString = localStorage.getItem(SAVE_DATA_KEY);
    if (!saveDataString) {
      return {
        success: false,
        message: 'セーブデータが見つかりません',
        error: 'No save data found'
      };
    }

    const saveData: SaveData = JSON.parse(saveDataString);
    
    // データの検証
    const validation = validateSaveData(saveData);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'セーブデータが破損しています',
        error: validation.errors.join(', ')
      };
    }

    return {
      success: true,
      message: `ゲームを読み込みました: ${saveData.cityName}`,
      data: saveData
    };
  } 
	catch (error) {
    return {
      success: false,
      message: 'セーブデータの読み込みに失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// セーブデータの検証
export function validateSaveData(saveData: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須フィールドのチェック
  if (!saveData.version) {
    errors.push('バージョン情報がありません');
  }
  
  if (!saveData.gameStats) {
    errors.push('ゲーム統計データがありません');
  }
  
  if (!saveData.facilities) {
    errors.push('施設データがありません');
  }
  
  if (!saveData.terrainMap) {
    errors.push('地形データがありません');
  }

  // バージョン互換性のチェック
  if (saveData.version !== SAVE_DATA_VERSION) {
    warnings.push(`セーブデータのバージョンが異なります: ${saveData.version} (現在: ${SAVE_DATA_VERSION})`);
  }

  // データの整合性チェック
  if (saveData.gameStats && typeof saveData.gameStats.money !== 'number') {
    errors.push('資金データが不正です');
  }

  if (saveData.facilities && !Array.isArray(saveData.facilities)) {
    errors.push('施設データの形式が不正です');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// セーブデータをエクスポート
export function exportSaveData(saveData: SaveData): void {
  try {
    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `city-sim-${saveData.cityName}-${new Date(saveData.timestamp).toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  }
	catch (error) {
    console.error('セーブデータのエクスポートに失敗しました:', error);
  }
}
