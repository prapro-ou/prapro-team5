import { create } from 'zustand';
import type { Facility, FacilityType } from '../types/facility'
import { FACILITY_DATA } from '../types/facility'
import type { Position } from '../types/grid';

interface FacilityStore {
  facilities: Facility[];
  selectedFacilityType: FacilityType | null;

  // アクション
  setSelectedFacilityType: (type: FacilityType | null) => void;
  addFacility: (position: Position, type: FacilityType) => void;
}
