// シンプルな高さ視覚表現

import type { HeightLevel } from '../types/terrainWithHeight';
import type { TerrainType } from '../types/terrain';
import { HEIGHT_DRAWING_CONSTANTS } from '../constants/terrainDrawingConstants';

export const HEIGHT_COLORS: Record<HeightLevel, number> = {
  0: 0x2196F3,  // 水（青）
  1: 0xD3C6A6,  // 陸地（茶色）
  2: 0xD3C6A6,  // 陸地（茶色）
  3: 0xD3C6A6,  // 陸地（茶色）
  4: 0xD3C6A6   // 陸地（茶色）
};

// 地形タイプに応じた色を取得
export const getTerrainColor = (terrainType: TerrainType | undefined): number => {
  if (terrainType === 'water') {
    return 0x2196F3;  // 青（水面）
  }
  if (terrainType === 'beach') {
    return 0xF5DEB3;  // 小麦色（砂浜）
  }
  return 0x9DC183;  // 茶色（陸地）
};

export const getHeightColor = (height: HeightLevel): number => {
  return HEIGHT_COLORS[height];
};

export const getBorderWidth = (height: HeightLevel): number => {
  return Math.max(HEIGHT_DRAWING_CONSTANTS.BORDER.WIDTH_FLAT, height);
};
