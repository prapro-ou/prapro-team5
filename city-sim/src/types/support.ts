// 勢力の種類
export type FactionType = 'central_government' | 'citizens' | 'chamber_of_commerce';

// 勢力の基本情報
export interface FactionInfo {
  type: FactionType;
  name: string;
  description: string;
  // 各勢力が重視する要素の重み付け（合計100%）
  priorities: {
    taxStability: number;        // 税収の安定性
    infrastructure: number;      // インフラ整備
    development: number;         // 都市の発展度
    fiscalBalance: number;       // 財政バランス
    satisfaction: number;        // 満足度
    parksAndGreenery: number;    // 公園・緑地
    populationGrowth: number;    // 人口増加
    commercialActivity: number;  // 商業活動
    industrialActivity: number;  // 工業活動
    workforceEfficiency: number; // 労働力効率
    infrastructureSurplus: number; // インフラ余剰
  };
}
