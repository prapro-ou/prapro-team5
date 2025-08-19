import { create } from 'zustand';
import type { Position } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { FACILITY_DATA } from '../types/facility';
import { useTerrainStore } from './TerrainStore';
import { getBuildability } from '../utils/terrainGenerator';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { isFacilityConnectedToValidRoadNetwork, clearConnectionCache } from '../utils/roadConnectivity';

interface FacilityStore {
  facilities: Facility[];
  selectedFacilityType: FacilityType | null;

  // アクション
  setSelectedFacilityType: (type: FacilityType | null) => void;
  addFacility: (facility: Facility) => void;
  removeFacility: (id: string) => void;
  clearFacilities: () => void;

  // ヘルパー
  getFacilityAt: (position: Position) => Facility | null;
  checkCanPlace: (position: Position, facilityType: FacilityType, gridSize: { width: number; height: number }) => boolean;
  createFacility: (position: Position, type: FacilityType) => Facility;
  
  // 道路接続状態管理
  updateRoadConnectivity: (gridSize: { width: number; height: number }) => void;
  clearRoadConnectivityCache: () => void;
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

export const useFacilityStore = create<FacilityStore>((set, get) => ({
  facilities: [],
  selectedFacilityType: null,

  setSelectedFacilityType: (type) => {
    set({ selectedFacilityType: type });
  },

  addFacility: (facility) => {
    set(state => ({
      facilities: [...state.facilities, facility]
    }));
    // 施設が追加されたらキャッシュをクリア
    clearConnectionCache();
  },

  removeFacility: (facilityId) => {
    set(state => ({
      facilities: state.facilities.filter(f => f.id !== facilityId)
    }));
    // 施設が削除されたらキャッシュをクリア
    clearConnectionCache();
  },
  
  clearFacilities: () => {
    set({ facilities: [] });
  },  

  getFacilityAt: (position) => {
    const { facilities } = get();
    return facilities.find(facility =>
      facility.occupiedTiles.some(tile =>
        tile.x === position.x && tile.y === position.y
      )
    ) || null;
  },
  
  checkCanPlace: (position, facilityType, gridSize) => {
    const { facilities } = get();
    const { getTerrainAt } = useTerrainStore.getState();
    
    // もし建設しようとしているのが市役所なら、既に存在しないかチェック
    if (facilityType === 'city_hall') {
      const hasCityHall = facilities.some(f => f.type === 'city_hall');
      if (hasCityHall) {
        console.warn("市役所はすでに建設されています．");
        return false;
      }
    }
    
    const facilityData = FACILITY_DATA[facilityType];
    const radius = Math.floor(facilityData.size / 2);
    
    // 範囲外チェック
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = position.x + dx;
        const y = position.y + dy;
        
        if (x < 0 || x >= gridSize.width || y < 0 || y >= gridSize.height) {
          return false;
        }
      }
    }
    
    // 地形チェック
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = position.x + dx;
        const y = position.y + dy;
        const terrain = getTerrainAt(x, y);
        
        if (!getBuildability(terrain)) {
          console.warn(`地形 ${terrain} には建設できません`);
          return false;
        }
      }
    }
    
    // 他の施設との重複チェック
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = position.x + dx;
        const y = position.y + dy;
        
        const existingFacility = get().getFacilityAt({ x, y });
        if (existingFacility) {
          return false;
        }
      }
    }
    
    return true;
  },

  createFacility: (position, type) => {
    const facilityData = FACILITY_DATA[type];
    const radius = Math.floor(facilityData.size / 2);
    const occupiedTiles: Position[] = [];
    
    // 占有するタイルを計算
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        occupiedTiles.push({
          x: position.x + dx,
          y: position.y + dy
        });
      }
    }
    
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      position,
      occupiedTiles,
      variantIndex: 0,
      effectRadius: facilityData.effectRadius,
      isConnected: false // 初期状態では接続されていない
    };
  },

  // 道路接続状態管理
  updateRoadConnectivity: (gridSize) => {
    const { facilities } = get();
    const updatedFacilities = facilities.map(facility => ({
      ...facility,
      isConnected: isFacilityConnectedToValidRoadNetwork(facility, facilities, gridSize)
    }));
    
    set({ facilities: updatedFacilities });
  },

  clearRoadConnectivityCache: () => {
    clearConnectionCache();
  },

  // セーブ・ロード機能
  saveState: () => {
    const state = get();
    return {
      facilities: state.facilities,
      selectedFacilityType: state.selectedFacilityType
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.facilities) {
      set({
        facilities: savedState.facilities,
        selectedFacilityType: savedState.selectedFacilityType || null
      });
    }
  },

  resetToInitial: () => {
    set({
      facilities: [],
      selectedFacilityType: null
    });
  }
}));

// 自動登録
saveLoadRegistry.register('facility', useFacilityStore.getState());