import { create } from 'zustand';
import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';
import type { HeightTerrainTile } from '../types/terrainWithHeight';
import { generateNaturalTerrainMap, generateHeightTerrainMapFromTerrain, generateRoadsWithHeight } from '../utils/terrainGenerator';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { canBuildFacility } from '../utils/terrainUtils';

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
  enableHeightSystem: true,

  // 地形生成（高さマップも自動生成、道路も生成）
  generateTerrain: (gridSize: GridSize) => {
    let result;
    let heightTerrainMap;
    let generatedRoads: Array<{x: number, y: number, variantIndex: number}>;
    
    // マップ生成と再生成処理（最大100回試行）
    let attempts = 0;
    do {
      result = generateNaturalTerrainMap(gridSize);
      heightTerrainMap = generateHeightTerrainMapFromTerrain(gridSize, result.terrainMap);
      generatedRoads = generateRoadsWithHeight(
        gridSize,
        result.selectedDirections,
        result.terrainMap,
        heightTerrainMap
      );
      attempts++;
    } while (generatedRoads.length < 20 && attempts < 100); // 最低20道路が必要
    
    set({ 
      terrainMap: result.terrainMap,
      generatedRoads,
      heightTerrainMap
    });
    
    console.log(`マップ生成完了 (試行回数: ${attempts}, 道路数: ${generatedRoads.length})`);
    
    return generatedRoads;
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
      
      // マップのサイズを推定（terrainMapの最大x, y座標から）
      let maxX = 0;
      let maxY = 0;
      newTerrainMap.forEach((_, key) => {
        const [x, y] = key.split(',').map(Number);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
      const gridSize: GridSize = { width: maxX + 1, height: maxY + 1 };
      
      // 高さマップを再生成（既存の地形マップから）
      const heightTerrainMap = generateHeightTerrainMapFromTerrain(gridSize, newTerrainMap);
      
      set({ 
        terrainMap: newTerrainMap, 
        generatedRoads,
        heightTerrainMap: new Map() // 一旦クリア
      });
      
      // 高さマップを設定
      set({ heightTerrainMap });
    }
  },

  // 高さ地形システムのメソッド
  generateHeightTerrain: (gridSize: GridSize) => {
    console.log('地形生成開始', gridSize);
    const { terrainMap } = get();
    const heightTerrainMap = generateHeightTerrainMapFromTerrain(gridSize, terrainMap);
    set({ heightTerrainMap });
    console.log('地形生成完了', heightTerrainMap.size, 'タイル');
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
