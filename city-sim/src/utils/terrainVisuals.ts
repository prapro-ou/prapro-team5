// シンプルな高さ視覚表現

import type { HeightLevel } from '../types/terrainWithHeight';
import { HEIGHT_DRAWING_CONSTANTS } from '../constants/terrainDrawingConstants';

export const HEIGHT_COLORS: Record<HeightLevel, number> = {
  0: 0x2196F3,
  1: 0x4CAF50,
  2: 0x8BC34A,
  3: 0xFF9800,
  4: 0x795548
};

export const getHeightColor = (height: HeightLevel): number => {
  return HEIGHT_COLORS[height];
};

export const getBorderWidth = (height: HeightLevel): number => {
  return Math.max(HEIGHT_DRAWING_CONSTANTS.BORDER.WIDTH_FLAT, height);
};
