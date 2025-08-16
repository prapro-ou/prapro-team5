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

export const useTerrainStore = create<TerrainStore>((set, get) => ({
  terrainMap: new Map(),

  // 地形生成
  generateTerrain: (gridSize: GridSize) => {
    const terrainMap = new Map<string, TerrainType>();
    
    for (let x = 0; x < gridSize.width; x++) {
      for (let y = 0; y < gridSize.height; y++) {
        // デフォルトは平地
        let terrain: TerrainType = 'grass';
        
        // 境界付近は水辺
        if (x < 5 || x >= gridSize.width - 5 || y < 5 || y >= gridSize.height - 5) {
          terrain = 'water';
        }
        // 水辺の隣は砂浜
        else if (x < 8 || x >= gridSize.width - 8 || y < 8 || y >= gridSize.height - 8) {
          terrain = 'beach';
        }
        // 中心付近は森
        else if (x > gridSize.width * 0.3 && x < gridSize.width * 0.7 && 
                 y > gridSize.height * 0.3 && y < gridSize.height * 0.7) {
          terrain = 'forest';
        }
        // ランダムで砂漠、岩場、山を配置
        else if (Math.random() < 0.1) {
          const randomTerrains: TerrainType[] = ['desert', 'rocky', 'mountain'];
          terrain = randomTerrains[Math.floor(Math.random() * randomTerrains.length)];
        }
        
        terrainMap.set(`${x},${y}`, terrain);
      }
    }
    
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
