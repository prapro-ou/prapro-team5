import type { TerrainType } from '../types/terrain';
import { TERRAIN_DATA } from '../types/terrain';

// 地形の建設適性をチェック（マスターデータから取得）
export function getBuildability(terrain: TerrainType): boolean {
  return TERRAIN_DATA[terrain]?.buildable || false;
}

// 地形の満足度修正値を取得（マスターデータから取得）
export function getTerrainSatisfactionModifier(terrain: TerrainType): number {
  return TERRAIN_DATA[terrain]?.satisfactionModifier || 0;
}
