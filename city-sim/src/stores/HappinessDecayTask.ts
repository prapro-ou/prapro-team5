import { useFacilityStore } from './FacilityStore';
import { useGameStore } from './GameStore';
import type { FacilityType, Facility } from '../types/facility';

// 幸福度減少の設定
const CHECK_INTERVAL = 1000 * 10; // 10秒ごと
const DECAY_AMOUNT = 5; // 幸福度減少量
const REQUIRED_FACILITIES: FacilityType[] = ['police'];

// 住宅の幸福度を減少させる処理
function decayHappinessIfNoFacilityNearby() {
  const facilityStore = useFacilityStore.getState();
  const gameStore = useGameStore.getState();
  // 住宅施設一覧取得
  const houses: Facility[] = facilityStore.facilities.filter(f => f.type === 'residential');
  const facilities = facilityStore.facilities;
  let penalty = 0;
  houses.forEach(house => {
    const { position } = house;
    // 公園・警察署などのeffectRadius内に住宅が入っているか判定
    const isCovered = facilities.some(facility => {
      if (!REQUIRED_FACILITIES.includes(facility.type)) return false;
      const radius = facility.effectRadius ?? 0;
      const dx = facility.position.x - position.x;
      const dy = facility.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    if (!isCovered) {
      penalty += DECAY_AMOUNT;
      console.log(`警察署の効果範囲外: 住宅(${position.x},${position.y}) 幸福度-${DECAY_AMOUNT}`);
    }
  });
  // ペナルティをstats.happinessPenaltyに累積
  gameStore.stats.happinessPenalty = (gameStore.stats.happinessPenalty ?? 0) + penalty;
  console.log(`ペナルティ累積: ${gameStore.stats.happinessPenalty}（住宅数: ${houses.length}、警察署数: ${facilities.filter(f => f.type === 'police').length}）`);
}

// 定期的に幸福度減少処理を実行
let intervalId: number | null = null;
export function startHappinessDecayTask() {
  console.log('startHappinessDecayTask called');
  if (intervalId) return;
  intervalId = window.setInterval(decayHappinessIfNoFacilityNearby, CHECK_INTERVAL);
}
export function stopHappinessDecayTask() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// --- 依存関数例（FacilityStoreにisFacilityInRadiusが必要） ---
// facilityStore.isFacilityInRadius(type, x, y, radius): boolean
