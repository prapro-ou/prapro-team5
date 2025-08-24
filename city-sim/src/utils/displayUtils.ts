import { FACTION_DATA, type FactionType } from '../types/support';

// 派閥名
export function getFactionDisplayName(factionType: string): string {
  const faction = FACTION_DATA[factionType as FactionType];
  return faction ? faction.name : factionType;
}

// 製品
export function getProductDisplayName(productIndex: string | number): string {
  const index = typeof productIndex === 'string' ? parseInt(productIndex) : productIndex;
  const productNames = ['原材料', '中間製品', '最終製品', 'サービス'];
  return productNames[index] || `製品${index}`;
}

// インフラタイプ
export function getInfrastructureDisplayName(infraType: string): string {
  const infraNames: Record<string, string> = {
    'water': '水道',
    'electricity': '電力'
  };
  return infraNames[infraType] || infraType;
}
