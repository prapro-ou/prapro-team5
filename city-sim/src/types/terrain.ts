// 地形タイプの定義
export type TerrainType = 
  | "grass"        // 平地（芝生）
  | "water"        // 水辺
  | "forest"       // 森
  | "desert"       // 砂漠
  | "mountain"     // 山
  | "beach"        // 砂浜
  | "swamp"        // 沼地
  | "rocky"        // 岩場

// 地形の基本情報
export interface TerrainInfo {
  type: TerrainType;
  name: string;
  description: string;
  imgPath: string;
  buildable: boolean;           // 建設可能かどうか
  satisfactionModifier: number; // 満足度修正値（仮）
}

// 地形データ
export const TERRAIN_DATA: Record<TerrainType, TerrainInfo> = {
    grass: {
      type: 'grass',
      name: '平地',
      description: '標準的な平地',
      imgPath: 'images/terrain/grass.png',
      buildable: true,
      satisfactionModifier: 0,
    },
    water: {
      type: 'water',
      name: '水辺',
      description: '水辺',
      imgPath: 'images/terrain/water.png',
      buildable: false,
      satisfactionModifier: 5,
    },
    forest: {
      type: 'forest',
      name: '森',
      description: '森林地帯',
      imgPath: 'images/terrain/forest.png',
      buildable: true,
      satisfactionModifier: 3,
    },
    desert: {
      type: 'desert',
      name: '砂漠',
      description: '砂漠',
      imgPath: 'images/terrain/desert.png',
      buildable: true,
      satisfactionModifier: -2,
    },
    mountain: {
      type: 'mountain',
      name: '山',
      description: '山地',
      imgPath: 'images/terrain/mountain.png',
      buildable: false,
      satisfactionModifier: 1,
    },
    beach: {
      type: 'beach',
      name: '砂浜',
      description: '砂浜',
      imgPath: 'images/terrain/beach.png',
      buildable: true,
      satisfactionModifier: 4,
    },
    swamp: {
      type: 'swamp',
      name: '沼地',
      description: '沼',
      imgPath: 'images/terrain/swamp.png',
      buildable: true,
      satisfactionModifier: -3,
    },
    rocky: {
      type: 'rocky',
      name: '岩場',
      description: '岩場',
      imgPath: 'images/terrain/rocky.png',
      buildable: true,
      satisfactionModifier: -1,
    },
  };
  