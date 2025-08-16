import { create } from 'zustand';
import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';
import { generateNaturalTerrainMap } from '../utils/terrainGenerator';
import { saveLoadRegistry } from './SaveLoadRegistry';

interface TerrainStore {
  // 状態
  terrainMap: Map<string, TerrainType>;
  
  // アクション
  generateTerrain: (gridSize: GridSize) => void;
  setTerrainAt: (x: number, y: number, terrain: TerrainType) => void;
  getTerrainAt: (x: number, y: number) => TerrainType;
  resetTerrain: (gridSize: GridSize) => void;
}

export const useTerrainStore = create<TerrainStore>((set, get) => ({
  terrainMap: new Map(),

  // 地形生成
  generateTerrain: (gridSize: GridSize) => {
    const terrainMap = generateNaturalTerrainMap(gridSize);
    set({ terrainMap });
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
}));

// 自動登録
saveLoadRegistry.register('terrain', useTerrainStore.getState());
