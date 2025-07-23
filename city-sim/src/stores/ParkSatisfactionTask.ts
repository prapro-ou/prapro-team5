import type { MonthlyTask } from './GameStore';
import { useFacilityStore } from './FacilityStore';
import { getResidentialsWithoutPark } from '../utils/parkEffect';

/**
 * 公園範囲外の住宅に満足度ペナルティを与える月次タスク
 */
export const applyParkSatisfactionPenalty: MonthlyTask = (get, set) => {
  const facilities = useFacilityStore.getState().facilities;
  const residentials = facilities.filter(f => f.type === 'residential');
  const parks = facilities.filter(f => f.type === 'park');
  const outOfRangeResidentials = getResidentialsWithoutPark(residentials, parks);

  if (outOfRangeResidentials.length === 0) return;

  // ペナルティ値（例: 住宅1件ごとに-2）
  const penalty = outOfRangeResidentials.length * 2;
  const currentSatisfaction = get().stats.satisfaction;
  set({
    stats: {
      ...get().stats,
      satisfaction: Math.max(0, currentSatisfaction - penalty)
    }
  });
};
