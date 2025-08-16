import { create } from 'zustand';
import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';

interface TerrainStore {
  // 状態
  terrainMap: Map<string, TerrainType>;
  
  // アクション
  generateTerrain: (gridSize: GridSize) => void;
  setTerrainAt: (x: number, y: number, terrain: TerrainType) => void;
  getTerrainAt: (x: number, y: number) => TerrainType;
  resetTerrain: (gridSize: GridSize) => void;
}
