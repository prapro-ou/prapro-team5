import { create } from 'zustand';
import type { Facility } from '../types/facility';
import { FACILITY_DATA } from '../types/facility';

export interface InfrastructureStatus {
  water: { demand: number; supply: number; balance: number };
  electricity: { demand: number; supply: number; balance: number };
}
