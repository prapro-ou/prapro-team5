import { create } from 'zustand';
import type { Position } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { getFacilityRegistry, loadFacilitiesFromJSON } from '../utils/facilityLoader';

// 起動時にJSONを読み込み（レジストリは内部でマージ・更新）
void loadFacilitiesFromJSON('data/facilities.json');
import { useTerrainStore } from './TerrainStore';
import { getBuildability } from '../utils/terrainGenerator';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { isFacilityConnectedToValidRoadNetwork, clearConnectionCache } from '../utils/roadConnectivity';
import { FacilityUnlockManager } from '../utils/facilityUnlockManager';
import { playDeleatSound } from '../components/SoundSettings';
import { useCityParameterMapStore } from './CityParameterMapStore';

interface FacilityStore {
  facilities: Facility[];
  selectedFacilityType: FacilityType | null;
  unlockedFacilities: Set<FacilityType>;

  // アクション
  setSelectedFacilityType: (type: FacilityType | null) => void;
  addFacility: (facility: Facility) => void;
  removeFacility: (id: string) => void;
  clearFacilities: () => void;
  
  // アンロック機能
  unlockFacility: (facilityType: FacilityType) => void;
  isFacilityUnlocked: (facilityType: FacilityType) => boolean;

  // ヘルパー
  getFacilityAt: (position: Position) => Facility | null;
  checkCanPlace: (position: Position, facilityType: FacilityType, gridSize: { width: number; height: number }) => boolean;
  createFacility: (position: Position, type: FacilityType) => Facility;
  isFacilityInRadius: (type: FacilityType, x: number, y: number, radius: number) => boolean;

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
  unlockedFacilities: FacilityUnlockManager.getInitialUnlockedFacilities(), // 自動初期化

  setSelectedFacilityType: (type) => {
    set({ selectedFacilityType: type });
  },

  addFacility: (facility) => {
    set(state => ({
      facilities: [...state.facilities, facility]
    }));
    // 施設が追加されたらキャッシュをクリア
    clearConnectionCache();
    // 影響マップへ加算
    useCityParameterMapStore.getState().applyFacility(facility.id, 'add');
  },

  removeFacility: (facilityId) => {
    // 影響マップから減算
    useCityParameterMapStore.getState().applyFacility(facilityId, 'sub');
    set(state => ({
      facilities: state.facilities.filter(f => f.id !== facilityId)
    }));
    // 施設が削除されたらキャッシュをクリア
    clearConnectionCache();
    playDeleatSound && playDeleatSound(); // 削除SE
  },
  
  clearFacilities: () => {
    set({ facilities: [] });
  },
  
  // アンロック機能
  unlockFacility: (facilityType: FacilityType) => {
    set(state => {
      const newUnlocked = new Set(state.unlockedFacilities);
      newUnlocked.add(facilityType);
      return { unlockedFacilities: newUnlocked };
    });
    console.log(`施設「${facilityType}」がアンロックされました`);
  },
  
  isFacilityUnlocked: (facilityType: FacilityType) => {
    return get().unlockedFacilities.has(facilityType);
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
    const { getTerrainAt, canBuildAt } = useTerrainStore.getState();
    
    // もし建設しようとしているのが市役所なら、既に存在しないかチェック
    if (facilityType === 'city_hall') {
      const hasCityHall = facilities.some(f => f.type === 'city_hall');
      if (hasCityHall) {
        console.warn("市役所はすでに建設されています．");
        return false;
      }
    }
    
    const facilityData = getFacilityRegistry()[facilityType];
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
        
        // 斜面チェック
        if (!canBuildAt(x, y, facilityType)) {
          console.warn(`斜面には建設できません`);
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
    const facilityData = getFacilityRegistry()[type];
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
      isConnected: false, // 初期状態では接続されていない
      isActive: false     // 初期状態では停止中
    };
  },

  isFacilityInRadius: (type: FacilityType, x: number, y: number, radius: number): boolean => {
    const { facilities } = get();
    return facilities.some(facility => {
      if (facility.type !== type) return false;
      const fx = facility.position.x;
      const fy = facility.position.y;
      const dist = Math.sqrt((fx - x) ** 2 + (fy - y) ** 2);
      return dist <= radius;
    });
  },

  // 道路接続状態管理
  updateRoadConnectivity: (gridSize) => {
    const { facilities } = get();
    const updatedFacilities = facilities.map(facility => {
      const isConnected = isFacilityConnectedToValidRoadNetwork(facility, facilities, gridSize);
      
      // 道路接続状態に基づいて施設の活動状態を決定
      // 道路施設は常に活動中、その他の施設は接続状態に依存
      const isActive = facility.type === 'road' || isConnected;
      
      return {
        ...facility,
        isConnected,
        isActive
      };
    });
    
    // 影響マップに反映
    for (let i = 0; i < facilities.length; i++) {
      const prev = facilities[i];
      const next = updatedFacilities[i];
      if (!prev || !next || prev.id !== next.id) continue;
      if (prev.isActive !== next.isActive) {
        useCityParameterMapStore.getState().applyFacility(next.id, next.isActive ? 'add' : 'sub');
      }
    }

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
      selectedFacilityType: state.selectedFacilityType,
      unlockedFacilities: Array.from(state.unlockedFacilities) // Setは保存できないので配列に変換
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.facilities) {
      // 古いセーブデータにはisActiveプロパティがない可能性があるため、デフォルト値を設定
      const facilitiesWithDefaults = savedState.facilities.map((facility: any) => ({
        ...facility,
        isActive: facility.isActive !== undefined ? facility.isActive : facility.isConnected
      }));
      
      set({
        facilities: facilitiesWithDefaults,
        selectedFacilityType: savedState.selectedFacilityType || null,
              unlockedFacilities: savedState.unlockedFacilities 
        ? new Set(savedState.unlockedFacilities) 
        : FacilityUnlockManager.getInitialUnlockedFacilities()
      });
    }
  },

  resetToInitial: () => {
    set({
      facilities: [],
      selectedFacilityType: null,
      unlockedFacilities: FacilityUnlockManager.getInitialUnlockedFacilities()
    });
  }
}));

// 自動登録
saveLoadRegistry.register('facility', useFacilityStore.getState());