import { useFacilityStore } from './FacilityStore';
import { useGameStore } from './GameStore';
import type { FacilityType, Facility } from '../types/facility';

// 幸福度減少の設定
const CHECK_INTERVAL = 1000 * 10; // 10秒ごと
const DECAY_AMOUNT = 1; // 幸福度減少量
const REQUIRED_FACILITIES: FacilityType[] = ['park', 'police'];

// 住宅の幸福度を減少させる処理
function decayHappinessIfNoFacilityNearby() {
  const facilityStore = useFacilityStore.getState();
  const gameStore = useGameStore.getState();
  // 住宅施設一覧取得
  const houses: Facility[] = facilityStore.facilities.filter(f => f.type === 'residential');
  const facilities = facilityStore.facilities;
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
      // 幸福度減少（GameStoreにdecreaseHappinessAtが必要。なければ直接stats.satisfactionを減らす）
      const current = gameStore.stats.satisfaction;
      gameStore.stats.satisfaction = Math.max(0, current - DECAY_AMOUNT);
    }
  });
}

// 定期的に幸福度減少処理を実行
let intervalId: number | null = null;
export function startHappinessDecayTask() {
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
