// 描画に関する定数を定義
export const DRAWING_CONSTANTS = {
  // タイル関連
  TILE_BORDER_COLOR: '#666',
  TILE_BORDER_WIDTH: 1,
  
  // 選択状態
  SELECTED_BORDER_COLOR: '#FFD700',
  SELECTED_BORDER_WIDTH: 3,
  
  // ドラッグ範囲
  DRAG_ALPHA: 0.7,
  DRAG_COLOR: '#FFD700',
  DRAG_STROKE_COLOR: '#FFA500',
  DRAG_STROKE_WIDTH: 2,
  
  // 効果範囲
  EFFECT_ALPHA: 0.4,
  DEFAULT_EFFECT_COLOR: '#90EE90',
  PARK_EFFECT_COLOR: '#90EE90',
  
  // デフォルト色
  DEFAULT_TILE_COLOR: '#9CA3AF'
} as const;

// 画像パスの定数
export const IMAGE_PATHS = {
  RESIDENTIAL: 'images/buildings/residential.png',
  COMMERCIAL: 'images/buildings/commercial.png',
  INDUSTRIAL: 'images/buildings/industrial.png',
  ROAD_CROSS: 'images/buildings/road_cross.png',
  ROAD_RIGHT: 'images/buildings/road_right.png',
  ROAD_T_R: 'images/buildings/road_t_r.png',
  ROAD_T: 'images/buildings/road_t.png',
  ROAD_TURN_R: 'images/buildings/road_turn_r.png',
  ROAD_TURN: 'images/buildings/road_turn.png',
  CITY_HALL: 'images/buildings/city_hall.png',
  PARK: 'images/buildings/park.png'
} as const;
