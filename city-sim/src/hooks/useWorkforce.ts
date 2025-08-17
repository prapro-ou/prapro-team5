import { useState, useCallback } from 'react';
import { FACILITY_DATA } from '../types/facility';
import type { Facility } from '../types/facility';

// 労働力配分の結果を表すインターフェース
export interface WorkforceAllocation {
	facility: Facility;
	assignedWorkforce: number;
	efficiency: number;
}

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

// 魅力度順に労働力を配分
export const allocateWorkforce = (
	facilities: Facility[],
	availableWorkforce: number
): WorkforceAllocation[] => {
	const sortedFacilities = sortFacilitiesByAttractiveness(facilities);
	const allocations: WorkforceAllocation[] = [];
	let remainingWorkforce = availableWorkforce;

	sortedFacilities.forEach(facility => {
		const workforceData = FACILITY_DATA[facility.type].workforceRequired;
		if (!workforceData) return;

		const { min, max } = workforceData;
		let assigned = 0;

		if (remainingWorkforce >= min) {
			// 必要労働力を確保
			assigned = Math.min(remainingWorkforce, max);
			remainingWorkforce -= assigned;
		}

		const efficiency = calculateWorkforceEfficiency(assigned, facility);

		allocations.push({
			facility,
			assignedWorkforce: assigned,
			efficiency
		});
	});

	return allocations;
};

export const useWorkforce = () => {
	const [allocations, setAllocations] = useState<WorkforceAllocation[]>([]);

	// 配分の計算
	const calculateAllocations = useCallback((facilities: Facility[], availableWorkforce: number) => {
		const newAllocations = allocateWorkforce(facilities, availableWorkforce);
		setAllocations(newAllocations);
		return newAllocations;
	}, []);

	// 配分の更新
	const updateAllocations = useCallback((newAllocations: WorkforceAllocation[]) => {
		setAllocations(newAllocations);
	}, []);

	return { allocations, calculateAllocations, updateAllocations };
};
