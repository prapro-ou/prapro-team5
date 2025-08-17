import { FACILITY_DATA } from '../types/facility';
import type { Facility } from '../types/facility';
import type { GameStats } from '../types/game';
import { allocateWorkforce, type WorkforceAllocation } from '../hooks/useWorkforce';

// 労働力配分の状態管理
let currentAllocations: WorkforceAllocation[] = [];

// 労働力配分を更新
export function updateWorkforceAllocations(facilities: Facility[], availableWorkforce: number): WorkforceAllocation[] {
  currentAllocations = allocateWorkforce(facilities, availableWorkforce);
  return currentAllocations;
}

// 現在の労働力配分を取得
export function getCurrentWorkforceAllocations(): WorkforceAllocation[] {
  return currentAllocations;
}

// 特定の施設の労働力配分を取得
export function getFacilityWorkforceAllocation(facilityId: string): WorkforceAllocation | undefined {
  return currentAllocations.find(allocation => allocation.facility.id === facilityId);
}

/**
 * 工業施設による製品生産量を計算する
 * @param stats - 現在のゲーム統計
 * @param facilities - 現在の施設リスト
 * @returns 生産された製品の量
 */
export function calculateProduction(stats: GameStats, facilities: Facility[]): number {
  // 労働力配分を更新
  updateWorkforceAllocations(facilities, stats.workforce);
  
  const industrials = facilities.filter(f => f.type === 'industrial');
  let totalProduced = 0;

  industrials.forEach(facility => {
    const allocation = getFacilityWorkforceAllocation(facility.id);
    if (!allocation) return; // 労働力配分がない場合はスキップ
    
    const workforceData = FACILITY_DATA[facility.type].workforceRequired;
    if (!workforceData) return; // 労働力不要な施設はスキップ
    
    const production = (workforceData.baseProduction || 0) * allocation.efficiency;
    totalProduced += production;
  });
  
  return totalProduced;
}

/**
 * 商業施設による製品消費量と，それによって生まれる収益を計算する
 * @param stats - 現在のゲーム統計
 * @param facilities - 現在の施設リスト
 * @returns 消費された製品の量と発生した収益
 */
export function calculateConsumptionAndRevenue(stats: GameStats, facilities: Facility[]): { consumed: number, revenue: number } {
  const commercials = facilities.filter(f => f.type === 'commercial');
  let availableGoods = stats.goods;
  let totalConsumed = 0;
  let totalRevenue = 0;

  commercials.forEach(facility => {
    const allocation = getFacilityWorkforceAllocation(facility.id);
    if (!allocation) return; // 労働力配分がない場合はスキップ
    
    const workforceData = FACILITY_DATA[facility.type].workforceRequired;
    if (!workforceData) return; // 労働力不要な施設はスキップ
    
    const baseConsumption = workforceData.baseConsumption || 0;
    const baseRevenue = workforceData.baseRevenue || 0;
    
    const consumption = baseConsumption * allocation.efficiency;
    if (availableGoods >= consumption) {
      availableGoods -= consumption;
      totalConsumed += consumption;
      totalRevenue += baseRevenue * allocation.efficiency;
    }
  });
  
  return { consumed: totalConsumed, revenue: totalRevenue };
}
