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

// 勢力のマスターデータ
export const FACTION_DATA: Record<FactionType, FactionInfo> = {
  central_government: {
    type: 'central_government',
    name: '中央政府',
    description: '都市の行政と政策を評価する中央政府。税収の安定性、インフラ整備、都市の発展度を重視する。',
    priorities: {
      taxStability: 30,      // 税収の安定性（30%）
      infrastructure: 25,     // インフラ整備（25%）
      development: 25,        // 都市の発展度（25%）
      fiscalBalance: 20,      // 財政バランス（20%）
      satisfaction: 0,        // 満足度（0%）
      parksAndGreenery: 0,    // 公園・緑地（0%）
      populationGrowth: 0,    // 人口増加（0%）
      commercialActivity: 0,  // 商業活動（0%）
      industrialActivity: 0,  // 工業活動（0%）
      workforceEfficiency: 0, // 労働力効率（0%）
      infrastructureSurplus: 0, // インフラ余剰（0%）
    }
  },
  citizens: {
    type: 'citizens',
    name: '市民',
    description: '都市に住む一般市民。満足度、公園・緑地の充実度、インフラの安定供給を重視する。',
    priorities: {
      taxStability: 0,        // 税収の安定性（0%）
      infrastructure: 20,      // インフラ整備（20%）
      development: 0,          // 都市の発展度（0%）
      fiscalBalance: 0,        // 財政バランス（0%）
      satisfaction: 40,        // 満足度（40%）
      parksAndGreenery: 25,    // 公園・緑地（25%）
      populationGrowth: 15,    // 人口増加（15%）
      commercialActivity: 0,   // 商業活動（0%）
      industrialActivity: 0,   // 工業活動（0%）
      workforceEfficiency: 0,  // 労働力効率（0%）
      infrastructureSurplus: 0, // インフラ余剰（0%）
    }
  },
  chamber_of_commerce: {
    type: 'chamber_of_commerce',
    name: '商工会',
    description: '地域の商業・工業の利益を代表する団体。商業・工業施設の稼働率、経済成長率、労働力効率を重視する。',
    priorities: {
      taxStability: 0,        // 税収の安定性（0%）
      infrastructure: 0,       // インフラ整備（0%）
      development: 0,          // 都市の発展度（0%）
      fiscalBalance: 0,        // 財政バランス（0%）
      satisfaction: 0,         // 満足度（0%）
      parksAndGreenery: 0,     // 公園・緑地（0%）
      populationGrowth: 0,     // 人口増加（0%）
      commercialActivity: 35,  // 商業活動（35%）
      industrialActivity: 0,   // 工業活動（0%）
      workforceEfficiency: 20, // 労働力効率（20%）
      infrastructureSurplus: 15, // インフラ余剰（15%）
    }
  }
};
