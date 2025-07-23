import { create } from 'zustand';
import type { Facility, FacilityType } from '../types/facility'
import { FACILITY_DATA } from '../types/facility'
import type { Position } from '../types/grid';
import { useGameStore } from './GameStore';

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
    useGameStore.getState().recalculateUsedWorkforce(); // 追加
  },

  removeFacility: (facilityId) => {
    set(state => ({
      facilities: state.facilities.filter(f => f.id !== facilityId)
    }));
    useGameStore.getState().recalculateUsedWorkforce(); // 追加
  },
  
  clearFacilities: () => {
    set({ facilities: [] });
    useGameStore.getState().recalculateUsedWorkforce(); // 追加
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
    // --- ここから追加 ---
    // もし建設しようとしているのが市役所なら、既に存在しないかチェック
    if (facilityType === 'city_hall') {
      const hasCityHall = facilities.some(f => f.type === 'city_hall');
      if (hasCityHall) {
        console.warn("市役所はすでに建設されています．");
        return false; // 既に存在する場合は建設不可
      }
    }
    // --- 追加ここまで ---
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
    
    // 既存施設との重複チェック
    const occupiedTiles: Position[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        occupiedTiles.push({ x: position.x + dx, y: position.y + dy });
      }
    }
    
    const hasConflict = facilities.some(facility =>
      facility.occupiedTiles.some(occupied =>
        occupiedTiles.some(newTile =>
          newTile.x === occupied.x && newTile.y === occupied.y
        )
      )
    );
    
    return !hasConflict;
  },
  
  createFacility: (position, type) => {
    const facilityData = FACILITY_DATA[type];
    const radius = Math.floor(facilityData.size / 2);
    const occupiedTiles: Position[] = [];
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        occupiedTiles.push({ x: position.x + dx, y: position.y + dy });
      }
    }

    let variantIndex = 0;
    // 現在は画像が一枚しかないので、variantIndexは0固定
    // if (facilityData.imgPaths && facilityData.imgPaths.length > 1) {
    //   variantIndex = Math.floor(Math.random() * facilityData.imgPaths.length);
    // }
    
    return {
      id: `${type}_${position.x}_${position.y}_${Date.now()}`,
      type,
      position,
      occupiedTiles,
      variantIndex,
    };
  }
}));