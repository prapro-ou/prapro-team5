import type { Facility } from '../types/facility';
import type { Position } from '../types/grid';

/**
 * 指定した住宅施設が公園の効果範囲内にあるか判定する
 * @param residential 住宅施設
 * @param parks 公園施設一覧
 * @returns 範囲内ならtrue, そうでなければfalse
 */
export function isResidentialInParkRange(residential: Facility, parks: Facility[]): boolean {
  for (const park of parks) {
    if (park.effectRadius === undefined) continue;
    // 公園の中心座標
    const px = park.position.x;
    const py = park.position.y;
    // 住宅の各タイルが公園の範囲内か判定
    for (const tile of residential.occupiedTiles) {
      const dx = tile.x - px;
      const dy = tile.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= park.effectRadius) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 住宅施設の配列と公園施設の配列から「公園効果範囲外の住宅」を抽出
 * @param residentials 住宅施設一覧
 * @param parks 公園施設一覧
 * @returns 範囲外の住宅施設配列
 */
export function getResidentialsWithoutPark(residentials: Facility[], parks: Facility[]): Facility[] {
  return residentials.filter(res => !isResidentialInParkRange(res, parks));
}
