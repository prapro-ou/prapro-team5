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

// 各施設の資産価値を計算
export function calculateFacilityAssetValue(facility: Facility, satisfaction: number): number {
  const facilityData = FACILITY_DATA[facility.type];
  const baseAssetValue = facilityData.baseAssetValue;
  
  if (!baseAssetValue) return 0; // 資産価値が設定されていない施設は0
  
  // 住宅なら満足度倍率、工業・商業なら固定値
  if (facility.type === 'residential') {
    // 満足度による倍率: 0.5-1.5の範囲
    const satisfactionMultiplier = Math.max(0.5, Math.min(1.5, satisfaction / 50));
    return Math.floor(baseAssetValue * satisfactionMultiplier);
  }
  else {
    // 工業・商業は固定値
    return baseAssetValue;
  }
}

// 総資産を計算
export function calculateTotalAssets(facilities: Facility[], satisfaction: number): number {
  return facilities.reduce((total, facility) => {
    return total + calculateFacilityAssetValue(facility, satisfaction);
  }, 0);
}

// 平均資産を計算
export function calculateAverageAssets(facilities: Facility[], satisfaction: number): number {
  const totalAssets = calculateTotalAssets(facilities, satisfaction);
  return facilities.length > 0 ? Math.floor(totalAssets / facilities.length) : 0;
}

// 各施設の利益を計算
export function calculateFacilityProfit(facility: Facility, efficiency: number): number {
  const facilityData = FACILITY_DATA[facility.type];
  const workforceData = facilityData.workforceRequired;
  
  if (!workforceData || !workforceData.baseRevenue) return 0; // 収益が設定されていない施設は0
  
  // 収益 = 基本収益 × 稼働効率
  const revenue = workforceData.baseRevenue * efficiency;
  
  // 利益 = 収益 - 維持費
  const profit = revenue - facilityData.maintenanceCost;
  
  return Math.max(0, profit); // 利益は最低0
}

// 総利益を計算
export function calculateTotalProfit(facilities: Facility[], stats: GameStats): number {
  return facilities.reduce((total, facility) => {
    // 労働力配分から効率を取得
    const allocation = getFacilityWorkforceAllocation(facility.id, stats);
    const efficiency = allocation ? allocation.efficiency : 0;
    
    return total + calculateFacilityProfit(facility, efficiency);
  }, 0);
}

// 平均利益を計算
export function calculateAverageProfit(facilities: Facility[], stats: GameStats): number {
  const totalProfit = calculateTotalProfit(facilities, stats);
  const businessFacilities = facilities.filter(f => 
    f.type === 'commercial' || f.type === 'industrial'
  );
  
  return businessFacilities.length > 0 ? Math.floor(totalProfit / businessFacilities.length) : 0;
}
