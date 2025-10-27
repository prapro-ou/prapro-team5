// 高さ地形システムの型定義

// 高度
export type HeightLevel = 0 | 1 | 2 | 3 | 4;

// 四隅の高度（左上、右上、右下、左下の順）
export type CornerHeights = [HeightLevel, HeightLevel, HeightLevel, HeightLevel];

// 地形タイル
export interface HeightTerrainTile {
  terrain: string;
  
  // 新しく追加する高度情報
  height: HeightLevel;
  cornerHeights: CornerHeights;
  
  isSlope: boolean;        // 斜面かどうか
  isBuildable: boolean;    // 建設可能かどうか
}

// 斜面情報
export interface SlopeInfo {
  isSlope: boolean;
  slopeDirection: 'none' | 'north' | 'south' | 'east' | 'west' | 'diagonal';
  heightDifference: number;
}

// 高さ地形の定数
export const HEIGHT_CONSTANTS = {
  // 高度別の説明
  HEIGHT_DESCRIPTIONS: {
    0: '海面下/水',
    1: '平地',
    2: '低い丘',
    3: '高い丘',
    4: '山'
  }
} as const;
