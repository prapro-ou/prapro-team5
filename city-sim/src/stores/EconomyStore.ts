import { FACILITY_DATA } from '../types/facility';
import type { Facility } from '../types/facility';
import type { GameStats } from '../types/game';
import { allocateWorkforce, type WorkforceAllocation } from '../hooks/useWorkforce';

// 労働力配分を更新
export function updateWorkforceAllocations(
  facilities: Facility[], 
  availableWorkforce: number
): { facilityId: string; facilityType: string; position: { x: number; y: number }; assignedWorkforce: number; efficiency: number }[] {
  const allocations = allocateWorkforce(facilities, availableWorkforce);
  
  // 配分結果を返す
  return allocations.map(allocation => ({
    facilityId: allocation.facility.id,
    facilityType: allocation.facility.type,
    position: allocation.facility.position,
    assignedWorkforce: allocation.assignedWorkforce,
    efficiency: allocation.efficiency
  }));
}

// 現在の労働力配分を取得
export function getCurrentWorkforceAllocations(stats: GameStats): WorkforceAllocation[] {
  return stats.workforceAllocations.map(allocation => {
    // 保存された施設情報を使用
    return {
      facility: {
        id: allocation.facilityId,
        type: allocation.facilityType as any, // 型安全性のため
        position: allocation.position,
        occupiedTiles: [], // 簡易的な実装
        variantIndex: 0
      } as Facility,
      assignedWorkforce: allocation.assignedWorkforce,
      efficiency: allocation.efficiency
    };
  });
}

// 特定の施設の労働力配分を取得
export function getFacilityWorkforceAllocation(
  facilityId: string, 
  stats: GameStats
): { assignedWorkforce: number; efficiency: number } | undefined {
  const allocation = stats.workforceAllocations.find(a => a.facilityId === facilityId);
  if (!allocation) return undefined;
  
  return {
    assignedWorkforce: allocation.assignedWorkforce,
    efficiency: allocation.efficiency
  };
}

// 月次タスク用の労働力配分を実行
export function executeMonthlyWorkforceAllocation(
  facilities: Facility[], 
  availableWorkforce: number
): { facilityId: string; facilityType: string; position: { x: number; y: number }; assignedWorkforce: number; efficiency: number }[] {
  return updateWorkforceAllocations(facilities, availableWorkforce);
}

/**
 * 工業施設による製品生産量を計算する
 * @param stats - 現在のゲーム統計
 * @param facilities - 現在の施設リスト
 * @returns 生産された製品の量
 */
export function calculateProduction(_stats: GameStats, facilities: Facility[]): number {
  const industrials = facilities.filter(f => f.type === 'industrial');
  let totalProduced = 0;

  industrials.forEach(facility => {
    const allocation = getFacilityWorkforceAllocation(facility.id, _stats);
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
    const allocation = getFacilityWorkforceAllocation(facility.id, stats);
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
