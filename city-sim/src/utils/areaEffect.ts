import type { Facility, FacilityType } from '../types/facility';
import { getFacilityRegistry } from '../utils/facilityLoader';

// 任意の施設について、effectRadius が定義されていれば
// 住宅の占有タイルのいずれかが半径内かを判定
function isResidentialWithinFacilityRadius(residential: Facility, facility: Facility): boolean {
	if (facility.effectRadius === undefined) return false;
	const fx = facility.position.x;
	const fy = facility.position.y;
	const r = facility.effectRadius;

	// 住宅のAABBを中心とサイズから構築（sizeは奇数、デフォルト3）
	const size = (getFacilityRegistry()[residential.type]?.size ?? 3);
	const half = Math.floor(size / 2);
	const rx = residential.position.x;
	const ry = residential.position.y;

	// 円（施設中心, 半径r）と矩形（住宅AABB）の距離の二乗で判定
	const dx = Math.max(Math.abs(fx - rx) - half, 0);
	const dy = Math.max(Math.abs(fy - ry) - half, 0);
	return dx * dx + dy * dy <= r * r;
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

// フェーズ1用: タイプ別配列を事前構築して流用するためのヘルパー
export type FacilityTypeLists = {
	commercial: Facility[];
	industrial: Facility[];
	city_hall: Facility[];
	park: Facility[];
	electric_plant: Facility[];
	water_plant: Facility[];
};

export function buildFacilityTypeLists(facilities: Facility[]): FacilityTypeLists {
	return {
		commercial: facilities.filter(f => f.type === 'commercial'),
		industrial: facilities.filter(f => f.type === 'industrial'),
		city_hall: facilities.filter(f => f.type === 'city_hall'),
		park: facilities.filter(f => f.type === 'park'),
		electric_plant: facilities.filter(f => f.type === 'electric_plant'),
		water_plant: facilities.filter(f => f.type === 'water_plant'),
	};
}

export function countNearbyAllTypesWithLists(residential: Facility, lists: FacilityTypeLists): number[] {
	const inRange = (arr: Facility[]) => arr.reduce((acc, f) => acc + (f.id !== residential.id && isResidentialWithinFacilityRadius(residential, f) ? 1 : 0), 0);
	return [
		inRange(lists.commercial),
		inRange(lists.industrial),
		inRange(lists.city_hall),
		inRange(lists.park),
		inRange(lists.electric_plant),
		inRange(lists.water_plant),
	];
}

// --- フェーズ2: 空間ハッシュ（簡易インデックス） ---

export type SpatialIndex = {
	cellSize: number;
	byType: Record<string, Map<string, Facility[]>>; // type -> (cellKey -> facilities)
	maxRadiusByType: Record<string, number>; // type -> 最大効果半径
};

function cellKeyFromCoord(x: number, y: number, cellSize: number): string {
	const cx = Math.floor(x / cellSize);
	const cy = Math.floor(y / cellSize);
	return `${cx}:${cy}`;
}

export function buildSpatialIndex(facilities: Facility[], cellSize: number = 8): SpatialIndex {
	const byType: Record<string, Map<string, Facility[]>> = {};
	const maxRadiusByType: Record<string, number> = {};

	for (const t of FACILITY_TYPES_IN_ORDER) {
		byType[t] = new Map<string, Facility[]>();
		maxRadiusByType[t] = 0;
	}

	for (const f of facilities) {
		if (!FACILITY_TYPES_IN_ORDER.includes(f.type)) continue;
		const map = byType[f.type]!;
		const key = cellKeyFromCoord(f.position.x, f.position.y, cellSize);
		const arr = map.get(key) ?? [];
		arr.push(f);
		map.set(key, arr);
		const r = f.effectRadius ?? 0;
		if (r > (maxRadiusByType[f.type] ?? 0)) maxRadiusByType[f.type] = r;
	}

	return { cellSize, byType, maxRadiusByType };
}

function collectCandidates(index: SpatialIndex, type: string, x: number, y: number, searchRadius: number): Facility[] {
	const { cellSize, byType } = index;
	const map = byType[type];
	if (!map) return [];

	const minCx = Math.floor((x - searchRadius) / cellSize);
	const maxCx = Math.floor((x + searchRadius) / cellSize);
	const minCy = Math.floor((y - searchRadius) / cellSize);
	const maxCy = Math.floor((y + searchRadius) / cellSize);

	const out: Facility[] = [];
	for (let cx = minCx; cx <= maxCx; cx++) {
		for (let cy = minCy; cy <= maxCy; cy++) {
			const key = `${cx}:${cy}`;
			const arr = map.get(key);
			if (arr && arr.length) out.push(...arr);
		}
	}
	return out;
}

export function countNearbyAllTypesWithIndex(residential: Facility, index: SpatialIndex): number[] {
    const size = (getFacilityRegistry()[residential.type]?.size ?? 3);
	const half = Math.floor(size / 2);
	const rx = residential.position.x;
	const ry = residential.position.y;

	const counts: number[] = [];
	for (const t of FACILITY_TYPES_IN_ORDER) {
		const maxR = index.maxRadiusByType[t] ?? 0;
		if (maxR <= 0) { counts.push(0); continue; }
		const candidates = collectCandidates(index, t, rx, ry, maxR + half);
		let c = 0;
		for (const f of candidates) {
			if (f.id === residential.id) continue;
			if (isResidentialWithinFacilityRadius(residential, f)) c++;
		}
		counts.push(c);
	}
	return counts;
}
