// 高さ地形の描画定数
export const HEIGHT_DRAWING_CONSTANTS = {
  HEIGHT_OFFSET_PER_LEVEL: 8,    // 高さ1につき4ピクセル上に移動
  SHADOW_OFFSET_PER_LEVEL: 1,    // 高さ1につき1ピクセルの影オフセット
  MIN_SHADOW_OFFSET: 1,          // 最小影オフセット
} as const;
