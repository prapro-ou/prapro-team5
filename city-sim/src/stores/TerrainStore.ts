import { create } from 'zustand';
import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';
import type { HeightTerrainTile, HeightLevel, CornerHeights } from '../types/heightTerrain';
import { generateNaturalTerrainMap } from '../utils/terrainGenerator';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { isSlope, canBuildFacility } from '../utils/heightTerrainUtils';

interface TerrainStore {
  // 状態
  terrainMap: Map<string, TerrainType>;
  generatedRoads: Array<{x: number, y: number, variantIndex: number}>;
  
  // 高さ地形システム
  heightTerrainMap: Map<string, HeightTerrainTile>;
  enableHeightSystem: boolean;
  
  // アクション
  generateTerrain: (gridSize: GridSize) => Array<{x: number, y: number, variantIndex: number}>;
  setTerrainAt: (x: number, y: number, terrain: TerrainType) => void;
  getTerrainAt: (x: number, y: number) => TerrainType;
  resetTerrain: (gridSize: GridSize) => void;
  
  // 高さ地形システムのアクション
  generateHeightTerrain: (gridSize: GridSize) => void;
  getHeightTerrainAt: (x: number, y: number) => HeightTerrainTile | null;
  canBuildAt: (x: number, y: number, facilityType: string) => boolean;
  toggleHeightSystem: () => void;
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: (gridSize: GridSize) => void;
}

export const useTerrainStore = create<TerrainStore>((set, get) => ({
  terrainMap: new Map(),
  generatedRoads: [],
  
  // 高さ地形システム
  heightTerrainMap: new Map(),
  enableHeightSystem: false,

  // 地形生成
  generateTerrain: (gridSize: GridSize) => {
    const result = generateNaturalTerrainMap(gridSize);
    set({ 
      terrainMap: result.terrainMap,
      generatedRoads: result.generatedRoads
    });
    return result.generatedRoads;
  },

  // 特定の位置の地形を設定
  setTerrainAt: (x: number, y: number, terrain: TerrainType) => {
    const { terrainMap } = get();
    const newTerrainMap = new Map(terrainMap);
    newTerrainMap.set(`${x},${y}`, terrain);
    set({ terrainMap: newTerrainMap });
  },

  // 特定の位置の地形を取得
  getTerrainAt: (x: number, y: number) => {
    const { terrainMap } = get();
    return terrainMap.get(`${x},${y}`) || 'grass';
  },

  // 地形をリセット
  resetTerrain: (gridSize: GridSize) => {
    const { generateTerrain } = get();
    generateTerrain(gridSize);
  },

  resetToInitial: (gridSize: GridSize) => {
    const { generateTerrain } = get();
    generateTerrain(gridSize);
  },

  saveState: () => {
    const { terrainMap, generatedRoads } = get();
    const terrainArray: Array<{ x: number; y: number; terrain: TerrainType }> = [];
    terrainMap.forEach((terrain, key) => {
      const [x, y] = key.split(',').map(Number);
      terrainArray.push({ x, y, terrain });
    });
    
    return { terrainArray, generatedRoads };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.terrainArray && Array.isArray(savedState.terrainArray)) {
      const newTerrainMap = new Map<string, TerrainType>();
      
      savedState.terrainArray.forEach((item: { x: number; y: number; terrain: TerrainType }) => {
        newTerrainMap.set(`${item.x},${item.y}`, item.terrain);
      });
      
      const generatedRoads = savedState.generatedRoads || [];
      set({ terrainMap: newTerrainMap, generatedRoads });
    }
  },

  // 高さ地形システムのメソッド
  generateHeightTerrain: (gridSize: GridSize) => {
    const { terrainMap } = get();
    const heightTerrainMap = new Map<string, HeightTerrainTile>();
    
    // まず高さマップを生成
    const heightMap = new Map<string, HeightLevel>();
    for (let x = 0; x < gridSize.width; x++) {
      for (let y = 0; y < gridSize.height; y++) {
        const height = Math.floor(Math.random() * 3) + 1 as HeightLevel; // 1-3の範囲
        heightMap.set(`${x},${y}`, height);
      }
    }
    
    // 各タイルの四隅の高さを生成
    for (let x = 0; x < gridSize.width; x++) {
      for (let y = 0; y < gridSize.height; y++) {
        const terrain = terrainMap.get(`${x},${y}`) || 'grass';
        const baseHeight = heightMap.get(`${x},${y}`) || 1;
        
        // 四隅の高さを生成
        const cornerHeights: CornerHeights = [
          baseHeight, // 左上
          heightMap.get(`${x + 1},${y}`) || baseHeight, // 右上
          heightMap.get(`${x + 1},${y + 1}`) || baseHeight, // 右下
          heightMap.get(`${x},${y + 1}`) || baseHeight // 左下
        ];
        
        // 斜面判定
        const slope = isSlope(cornerHeights);
        
        // 建設可能性判定
        const isBuildable = true;
        
        const heightTile: HeightTerrainTile = {
          terrain,
          height: baseHeight,
          cornerHeights,
          isSlope: slope,
          isBuildable
        };
        
        heightTerrainMap.set(`${x},${y}`, heightTile);
      }
    }
    
    set({ heightTerrainMap });
  },

  getHeightTerrainAt: (x: number, y: number) => {
    const { heightTerrainMap } = get();
    return heightTerrainMap.get(`${x},${y}`) || null;
  },

  canBuildAt: (x: number, y: number, facilityType: string) => {
    const { heightTerrainMap } = get();
    const tile = heightTerrainMap.get(`${x},${y}`);
    
    if (!tile) return false;
    
    return canBuildFacility(tile, facilityType);
  },

  toggleHeightSystem: () => {
    const { enableHeightSystem } = get();
    set({ enableHeightSystem: !enableHeightSystem });
  }
}));

// 自動登録
saveLoadRegistry.register('terrain', useTerrainStore.getState());
