import { FACILITY_DATA } from '../types/facility';
import type { Facility } from '../types/facility';
import type { GameStats } from '../types/game';
import { calculateWorkforceEfficiency } from '../utils/economyUtils';

/**
 * 工業施設による製品生産量を計算する
 * @param stats - 現在のゲーム統計
 * @param facilities - 現在の施設リスト
 * @returns 生産された製品の量
 */
export function calculateProduction(stats: GameStats, facilities: Facility[]): number {
  const industrials = facilities.filter(f => f.type === 'industrial');
  let availableWorkforce = stats.workforce;
  let totalProduced = 0;

  industrials.forEach(facility => {
    const workforceData = FACILITY_DATA[facility.type].workforceRequired;
    if (!workforceData) return; // 労働力不要な施設はスキップ
    
    const efficiency = calculateWorkforceEfficiency(availableWorkforce, facility);
    const production = (workforceData.baseProduction || 0) * efficiency;
    
    if (efficiency > 0) {
      totalProduced += production;
      // 労働力を消費（効率に応じて）
      const consumed = Math.min(availableWorkforce, workforceData.max);
      availableWorkforce -= consumed;
    }
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
  let availableWorkforce = stats.workforce;
  let totalConsumed = 0;
  let totalRevenue = 0;

  commercials.forEach(facility => {
    const workforceData = FACILITY_DATA[facility.type].workforceRequired;
    if (!workforceData) return; // 労働力不要な施設はスキップ
    
    const efficiency = calculateWorkforceEfficiency(availableWorkforce, facility);
    const baseConsumption = workforceData.baseConsumption || 0;
    const baseRevenue = workforceData.baseRevenue || 0;
    
    if (efficiency > 0) {
      const consumption = baseConsumption * efficiency;
      if (availableGoods >= consumption) {
        availableGoods -= consumption;
        totalConsumed += consumption;
        totalRevenue += baseRevenue * efficiency;
        
        // 労働力を消費（効率に応じて）
        const consumed = Math.min(availableWorkforce, workforceData.max);
        availableWorkforce -= consumed;
      }
    }
  });
  return { consumed: totalConsumed, revenue: totalRevenue };
}
