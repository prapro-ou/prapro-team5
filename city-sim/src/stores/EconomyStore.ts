import { FACILITY_DATA } from '../types/facility';
import type { Facility } from '../types/facility';
import type { GameStats } from '../types/game';

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
    const info = FACILITY_DATA[facility.type];
    const req = info.requiredWorkforce || 0;
    const prod = info.produceGoods || 0;
    if (availableWorkforce >= req) {
      availableWorkforce -= req;
      totalProduced += prod;
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
  let totalConsumed = 0;
  let totalRevenue = 0;

  commercials.forEach(facility => {
    const info = FACILITY_DATA[facility.type];
    const cons = info.consumeGoods || 0;
    if (availableGoods >= cons) {
      availableGoods -= cons;
      totalConsumed += cons;
      // 税収は消費量に応じて変動（ここでは仮に消費量 x 50）
      totalRevenue += cons * 50;
    }
  });
  return { consumed: totalConsumed, revenue: totalRevenue };
}
