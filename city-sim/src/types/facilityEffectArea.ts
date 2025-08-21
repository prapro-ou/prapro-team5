// 施設の効果範囲を定義する型・インターフェース

export type EffectShape = 'circle' | 'square' | 'custom';

export interface FacilityEffectArea {
  /** 効果範囲の中心座標（グリッド上） */
  center: { x: number; y: number };
  /** 効果範囲の半径（circle）、またはサイズ（square） */
  radius: number;
  /** 効果範囲の形状 */
  shape: EffectShape;
  /** カスタム範囲の場合の座標リスト（任意） */
  customArea?: { x: number; y: number }[];
}

// 施設データにFacilityEffectAreaを持たせることで、範囲効果を実装可能
