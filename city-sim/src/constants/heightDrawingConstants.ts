// 高さ地形の描画定数
export const HEIGHT_DRAWING_CONSTANTS = {
  // 高さレベル別のオフセット
  HEIGHT_OFFSETS: {
    0: 0,
    1: 2, 
    2: 10,
    3: 18,
    4: 26,
  },
  SHADOW_OFFSET_PER_LEVEL: 1,    // 高さ1につき1ピクセルの影オフセット
  MIN_SHADOW_OFFSET: 1,          // 最小影オフセット
} as const;
