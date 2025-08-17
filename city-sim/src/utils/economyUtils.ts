import { FACILITY_DATA } from "../types/facility";
import type { Facility } from "../types/facility";

// 労働力が必要な施設かどうかの判定
export const needsWorkforce = (facility: Facility): boolean => {
    return FACILITY_DATA[facility.type].workforceRequired !== undefined;
  };
  
// 労働力が必要な施設のみをフィルタリング
export const getWorkforceFacilities = (facilities: Facility[]): Facility[] => {
	return facilities.filter(needsWorkforce);
};
