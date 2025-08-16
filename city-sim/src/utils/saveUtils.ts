import type { SaveData, SaveResult, LoadResult, ValidationResult } from '../types/save';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import type { TerrainType } from '../types/terrain';
import type { Reward } from '../components/RewardPanel';
import type { InfrastructureStatus } from '../stores/InfrastructureStore';
import { SAVE_DATA_VERSION } from '../types/save';

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
