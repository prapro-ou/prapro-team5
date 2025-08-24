import { useFacilityStore } from './FacilityStore';
import { useGameStore } from './GameStore';
import type { Facility } from '../types/facility';

// 幸福度減少の設定
const CHECK_INTERVAL = 1000 * 10; // 10秒ごと
const DECAY_AMOUNT = 3; // 幸福度減少量

// 住宅の幸福度を減少させる処理
function decayHappinessIfNoFacilityNearby() {
  const facilityStore = useFacilityStore.getState();
  const gameStore = useGameStore.getState();
  // 住宅施設一覧取得
  const houses: Facility[] = facilityStore.facilities.filter(f => f.type === 'residential');
  const facilities = facilityStore.facilities;
  let policePenalty = 0;
  let hospitalPenalty = 0;
  let parkPenalty = 0;
  houses.forEach(house => {
    const { position } = house;
    // 警察署のeffectRadius内に住宅が入っているか判定
    const isPoliceCovered = facilities.some(facility => {
      if (facility.type !== 'police') return false;
      const radius = facility.effectRadius ?? 0;
      const dx = facility.position.x - position.x;
      const dy = facility.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    if (!isPoliceCovered) {
      policePenalty += DECAY_AMOUNT;
      console.log(`警察署の効果範囲外: 住宅(${position.x},${position.y}) 幸福度-${DECAY_AMOUNT}`);
    }
    // 病院のeffectRadius内に住宅が入っているか判定
    const isHospitalCovered = facilities.some(facility => {
      if (facility.type !== 'hospital') return false;
      const radius = facility.effectRadius ?? 0;
      const dx = facility.position.x - position.x;
      const dy = facility.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    if (!isHospitalCovered) {
      hospitalPenalty += DECAY_AMOUNT;
      console.log(`病院の効果範囲外: 住宅(${position.x},${position.y}) 幸福度-${DECAY_AMOUNT}`);
    }
    // 公園のeffectRadius内に住宅が入っているか判定（活動中の公園のみ）
    const isParkCovered = facilities.some(facility => {
      if (facility.type !== 'park' || !facility.isActive) return false;
      const radius = facility.effectRadius ?? 0;
      const dx = facility.position.x - position.x;
      const dy = facility.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    if (!isParkCovered) {
      parkPenalty += 1; // 住宅1件ごとに-1
      console.log(`公園の効果範囲外: 住宅(${position.x},${position.y}) 満足度-1`);
    }
  });
  // ペナルティをstats.happinessPenaltyに累積
  gameStore.stats.happinessPenalty = (gameStore.stats.happinessPenalty ?? 0) + policePenalty + hospitalPenalty;
  // 公園ペナルティは直接満足度から減算
  gameStore.stats.satisfaction = Math.max(0, (gameStore.stats.satisfaction ?? 0) - parkPenalty);
  console.log(`警察署ペナルティ累積: ${policePenalty} 病院ペナルティ累積: ${hospitalPenalty}（住宅数: ${houses.length}、警察署数: ${facilities.filter(f => f.type === 'police').length}、病院数: ${facilities.filter(f => f.type === 'hospital').length}）`);
  console.log(`公園ペナルティ累積: -${parkPenalty}（住宅数: ${houses.length}、公園数: ${facilities.filter(f => f.type === 'park').length}）`);
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
