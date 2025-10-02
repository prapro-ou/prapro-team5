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
  
  // 境界線の設定
  BORDER: {
    COLOR: 0x333333,             // 境界線の色
    WIDTH_FLAT: 1,               // 平地の境界線の太さ
    WIDTH_SLOPE: 1,               // 斜面の境界線の太さ
  },
} as const;
