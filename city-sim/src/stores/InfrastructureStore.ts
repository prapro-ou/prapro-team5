import { create } from 'zustand';
import type { Facility } from '../types/facility';
import { FACILITY_DATA } from '../types/facility';

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
}

