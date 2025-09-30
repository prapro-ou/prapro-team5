// シンプルな高さ視覚表現

import type { HeightLevel } from '../types/heightTerrain';

// 高さレベル別の色定義
export const HEIGHT_COLORS: Record<HeightLevel, number> = {
  0: 0x2196F3, // 青（水）
  1: 0x4CAF50, // 緑（平地）
  2: 0x8BC34A, // 黄緑（低い丘）
  3: 0xFF9800, // オレンジ（高い丘）
  4: 0x795548  // 茶色（山）
};

// 高さレベルから色を取得
export const getHeightColor = (height: HeightLevel): number => {
  return HEIGHT_COLORS[height];
};

// 高さに応じた影のオフセット
export const getShadowOffset = (height: HeightLevel): number => {
  return height * 2; // 高さ1につき2ピクセル
};

// 高さに応じた境界線の太さ
export const getBorderWidth = (height: HeightLevel): number => {
  return Math.max(1, height);
};
