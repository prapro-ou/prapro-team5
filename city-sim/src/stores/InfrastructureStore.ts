import { create } from 'zustand';
import type { Facility } from '../types/facility';
import { FACILITY_DATA } from '../types/facility';
import { saveLoadRegistry } from './SaveLoadRegistry';

export interface InfrastructureStatus {
  water: { demand: number; supply: number; balance: number };
  electricity: { demand: number; supply: number; balance: number };
}

interface InfrastructureStore {
  status: InfrastructureStatus;
  
  // アクション
  calculateInfrastructure: (facilities: Facility[]) => void;
  getInfrastructureStatus: () => InfrastructureStatus;
  getInfrastructureShortage: () => { water: number; electricity: number };
  getInfrastructureSurplus: () => { water: number; electricity: number };
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

export const useInfrastructureStore = create<InfrastructureStore>((set, get) => ({
  status: {
    water: { demand: 0, supply: 0, balance: 0 },
    electricity: { demand: 0, supply: 0, balance: 0 }
  },

  calculateInfrastructure: (facilities: Facility[]) => {
    let totalWaterDemand = 0;
    let totalElectricityDemand = 0;
    let totalWaterSupply = 0;
    let totalElectricitySupply = 0;

    // 活動中の施設のみを対象とする
    const activeFacilities = facilities.filter(facility => facility.isActive);

    activeFacilities.forEach(facility => {
      const info = FACILITY_DATA[facility.type];
      
      // 需要の計算
      if (info.infrastructureDemand) {
        totalWaterDemand += info.infrastructureDemand.water;
        totalElectricityDemand += info.infrastructureDemand.electricity;
      }
      
      // 供給の計算
      if (info.infrastructureSupply) {
        totalWaterSupply += info.infrastructureSupply.water;
        totalElectricitySupply += info.infrastructureSupply.electricity;
      }
    });

    const newStatus: InfrastructureStatus = {
      water: {
        demand: totalWaterDemand,
        supply: totalWaterSupply,
        balance: totalWaterSupply - totalWaterDemand
      },
      electricity: {
        demand: totalElectricityDemand,
        supply: totalElectricitySupply,
        balance: totalElectricitySupply - totalElectricityDemand
      }
    };

    set({ status: newStatus });
  },

  getInfrastructureStatus: () => {
    return get().status;
  },

  getInfrastructureShortage: () => {
    const status = get().status;
    return {
      water: Math.max(0, -status.water.balance),
      electricity: Math.max(0, -status.electricity.balance)
    };
  },

  getInfrastructureSurplus: () => {
    const status = get().status;
    return {
      water: Math.max(0, status.water.balance),
      electricity: Math.max(0, status.electricity.balance)
    };
  },

  saveState: () => {
    const state = get();
    return {
      status: state.status
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.status) {
      set({ status: savedState.status });
    }
  },

  resetToInitial: () => {
    set({
      status: {
        water: { demand: 0, supply: 0, balance: 0 },
        electricity: { demand: 0, supply: 0, balance: 0 }
      }
    });
  }
}));

saveLoadRegistry.register('infrastructure', useInfrastructureStore.getState());
