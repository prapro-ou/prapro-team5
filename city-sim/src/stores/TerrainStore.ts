import { create } from 'zustand';
import type { TerrainType, TerrainGenerationConfig } from '../types/terrain';
import type { GridSize } from '../types/grid';
import { TerrainGenerator, generateSimpleTerrainMap } from '../utils/terrainGenerator';
import { DEFAULT_TERRAIN_CONFIG } from '../types/terrain';

interface TerrainStore {
  // 状態
  terrainMap: Map<string, TerrainType>;
  generator: TerrainGenerator;
  
  // アクション
  generateTerrain: (gridSize: GridSize) => void;
  setTerrainAt: (x: number, y: number, terrain: TerrainType) => void;
  getTerrainAt: (x: number, y: number) => TerrainType;
  updateGenerationConfig: (config: Partial<TerrainGenerationConfig>) => void;
  getGenerationConfig: () => TerrainGenerationConfig;
  resetTerrain: (gridSize: GridSize) => void;
}

export const useTerrainStore = create<TerrainStore>((set, get) => ({
  terrainMap: new Map(),
  generator: new TerrainGenerator(DEFAULT_TERRAIN_CONFIG),

  // 地形を生成
  generateTerrain: (gridSize: GridSize) => {
    const terrainMap = generateSimpleTerrainMap(gridSize);
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

  // 地形生成設定を更新
  updateGenerationConfig: (config: Partial<TerrainGenerationConfig>) => {
    const { generator } = get();
    generator.updateConfig(config);
    set({ generator });
  },

  // 地形生成設定を取得
  getGenerationConfig: () => {
    const { generator } = get();
    return generator.getConfig();
  },

  // 地形をリセット
  resetTerrain: (gridSize: GridSize) => {
    const { generator } = get();
    const terrainMap = generator.generateTerrainMap(gridSize);
    set({ terrainMap });
  },
})); 