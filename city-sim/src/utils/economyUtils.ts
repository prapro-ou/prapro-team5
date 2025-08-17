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

// 魅力度順に施設をソート
export const sortFacilitiesByAttractiveness = (facilities: Facility[]): Facility[] => {
	return facilities
		.filter(needsWorkforce) // 労働力が必要な施設のみ
		.sort((a, b) => {
			const attractivenessA = FACILITY_DATA[a.type].attractiveness || 0;
			const attractivenessB = FACILITY_DATA[b.type].attractiveness || 0;
			return attractivenessB - attractivenessA; // 高い順
		});
};

// 施設の労働力効率を計算
export const calculateWorkforceEfficiency = (
  assignedWorkforce: number,
  facility: Facility
): number => {
  const workforceData = FACILITY_DATA[facility.type].workforceRequired;
  if (!workforceData) return 1.0; // 労働力不要な施設は100%効率
  
  const { min, max } = workforceData;
  if (assignedWorkforce < min) return 0;        // 停止
  if (assignedWorkforce >= max) return 1.0;     // 100%稼働
  return assignedWorkforce / max;               // 比例稼働
};
