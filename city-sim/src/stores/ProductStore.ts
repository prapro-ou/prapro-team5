import { create } from 'zustand';
import { getFacilityRegistry } from '../utils/facilityLoader';
import type { Facility } from '../types/facility';
import type { ProductDemand } from '../types/facility';

// 製品ストアの状態
interface ProductStore {
  // 製品の需要・供給を計算
  calculateProductDemand: (facilities: Facility[]) => ProductDemand;
  calculateProductProduction: (facilities: Facility[]) => ProductDemand;
  
  // 製品効率を計算（需要/供給比率）
  calculateProductEfficiency: (demand: ProductDemand, production: ProductDemand) => number;
  
  // 製品の需給状況を取得
  getProductSupplyDemandStatus: (facilities: Facility[]) => {
    demand: ProductDemand;
    production: ProductDemand;
    efficiency: number;
  };
}

export const useProductStore = create<ProductStore>((_set, get) => ({
  // 製品需要の合計を計算
  calculateProductDemand: (facilities: Facility[]): ProductDemand => {
    const totalDemand: ProductDemand = [0, 0, 0, 0];
    
    facilities.forEach(facility => {
      const facilityData = getFacilityRegistry()[facility.type];
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
      const facilityData = getFacilityRegistry()[facility.type];
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
  
  // 製品の需給状況を取得（統合関数）
  getProductSupplyDemandStatus: (facilities: Facility[]) => {
    const demand = get().calculateProductDemand(facilities);
    const production = get().calculateProductProduction(facilities);
    const efficiency = get().calculateProductEfficiency(demand, production);
    
    return { demand, production, efficiency };
  }
}));
