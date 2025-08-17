import { create } from 'zustand';
import { FACILITY_DATA } from '../types/facility';
import type { Facility } from '../types/facility';
import type { ProductDemand } from '../types/facility';

// 製品の在庫状態
export interface ProductInventory {
  raw_material: number;         // 原材料
  intermediate_product: number; // 中間製品
  final_product: number;        // 最終製品
  service: number;              // サービス
}

// 製品ストアの状態
interface ProductStore {
  inventory: ProductInventory;
  
  // 製品の需要・供給を計算
  calculateProductDemand: (facilities: Facility[]) => ProductDemand;
  calculateProductProduction: (facilities: Facility[]) => ProductDemand;
  
  // 製品効率を計算（需要/供給比率）
  calculateProductEfficiency: (demand: ProductDemand, production: ProductDemand) => number;
  
  // 製品の在庫を更新
  updateInventory: (production: ProductDemand, consumption: ProductDemand) => void;
  
  // 製品の在庫をリセット
  resetInventory: () => void;
}

// 初期在庫
const INITIAL_INVENTORY: ProductInventory = {
  raw_material: 100,      // 初期原材料
  intermediate_product: 0,
  final_product: 0,
  service: 0
};

export const useProductStore = create<ProductStore>((set, get) => ({
  inventory: INITIAL_INVENTORY,
  
  // 製品需要の合計を計算
  calculateProductDemand: (facilities: Facility[]): ProductDemand => {
    const totalDemand: ProductDemand = [0, 0, 0, 0];
    
    facilities.forEach(facility => {
      const facilityData = FACILITY_DATA[facility.type];
      if (facilityData.productDemand) {
        for (let i = 0; i < 4; i++) {
          totalDemand[i] += facilityData.productDemand[i];
        }
      }
    });
    
    return totalDemand;
  },
  
  // 製品生産の合計を計算
  calculateProductProduction: (facilities: Facility[]): ProductDemand => {
    const totalProduction: ProductDemand = [0, 0, 0, 0];
    
    facilities.forEach(facility => {
      const facilityData = FACILITY_DATA[facility.type];
      if (facilityData.productProduction) {
        for (let i = 0; i < 4; i++) {
          totalProduction[i] += facilityData.productProduction[i];
        }
      }
    });
    
    return totalProduction;
  },
  
  // 製品効率を計算（需要/供給比率）
  calculateProductEfficiency: (demand: ProductDemand, production: ProductDemand): number => {
    let totalEfficiency = 0;
    let validProducts = 0;
    
    for (let i = 0; i < 4; i++) {
      if (demand[i] > 0) {
        const ratio = production[i] / demand[i];
        const efficiency = Math.min(1.0, ratio); // 100%を超えない
        totalEfficiency += efficiency;
        validProducts++;
      }
    }
    
    return validProducts > 0 ? totalEfficiency / validProducts : 1.0;
  },
  
  // 製品の在庫を更新
  updateInventory: (production: ProductDemand, consumption: ProductDemand) => {
    set(state => ({
      inventory: {
        raw_material: Math.max(0, state.inventory.raw_material + production[0] - consumption[0]),
        intermediate_product: Math.max(0, state.inventory.intermediate_product + production[1] - consumption[1]),
        final_product: Math.max(0, state.inventory.final_product + production[2] - consumption[2]),
        service: Math.max(0, state.inventory.service + production[3] - consumption[3])
      }
    }));
  },
  
  // 製品の在庫をリセット
  resetInventory: () => {
    set({ inventory: INITIAL_INVENTORY });
  }
}));
