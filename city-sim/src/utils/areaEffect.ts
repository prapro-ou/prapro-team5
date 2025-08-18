import type { Facility, FacilityType } from '../types/facility';
import { useFacilityStore } from '../stores/FacilityStore';

// 任意の施設について、effectRadius が定義されていれば
// 住宅の占有タイルのいずれかが半径内かを判定
function isResidentialWithinFacilityRadius(residential: Facility, facility: Facility): boolean {
	if (facility.effectRadius === undefined) return false;
	const fx = facility.position.x;
	const fy = facility.position.y;
	const r = facility.effectRadius;
	for (const tile of residential.occupiedTiles) {
		const dx = tile.x - fx;
		const dy = tile.y - fy;
		if (Math.sqrt(dx * dx + dy * dy) <= r) return true;
	}
	return false;
}

/**
 * 指定した住宅が、指定の施設種の「影響範囲内」にいくつ存在するかをカウントして返す。
 * 引数は住宅と施設種の2つのみ。施設リストは内部でFacilityStoreから取得する。
 */
export function countNearbyByType(residential: Facility, facilityType: FacilityType): number {
	const facilities = useFacilityStore.getState().facilities;
	let count = 0;

		for (const f of facilities) {
		    if (f.id === residential.id) continue;
		    if (f.type !== facilityType) continue;

			// effectRadius が定義されている施設はそれを優先して半径内判定
			if (isResidentialWithinFacilityRadius(residential, f)) {
				count++;
				continue;
			}
	}
	return count;
}

// 利用側がインデックスとタイプの対応を把握できるよう、固定順の配列を提供
export const FACILITY_TYPES_IN_ORDER: FacilityType[] = [
	'commercial',
	'industrial',
	'city_hall',
	'park',
	'electric_plant',
	'water_plant',
];

// すべてのタイプに適用し、結果を同順序の配列で返す
export function countNearbyAllTypes(residential: Facility): number[] {
	return FACILITY_TYPES_IN_ORDER.map((t) => countNearbyByType(residential, t));
}
