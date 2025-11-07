import type { CityParameters } from './cityParameter';

// 派閥の種類
export type FactionType =
  | 'central_government'
  | 'citizens'
  | 'chamber_of_commerce'
  | 'conglomerate'
  | 'environmental_group'
  | 'labor_union';

// 派閥の基本情報
export interface FactionInfo {
  type: FactionType;
  name: string;
  description: string;
  // 各派閥が重視する要素の重み付け（合計100%）
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

// 派閥のマスターデータ
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
  },
  conglomerate: {
    type: 'conglomerate',
    name: '財閥',
    description: '大規模資本を擁する財閥グループ。産業基盤と投資環境を重視し、法人税の削減と企業活動の活性化を求める。',
    priorities: {
      taxStability: 5,        // 税収の安定性（5%）
      infrastructure: 0,       // インフラ整備（0%）
      development: 20,         // 都市の発展度（20%）
      fiscalBalance: 15,       // 財政バランス（15%）
      satisfaction: 0,         // 満足度（0%）
      parksAndGreenery: 0,     // 公園・緑地（0%）
      populationGrowth: 0,     // 人口増加（0%）
      commercialActivity: 25,  // 商業活動（25%）
      industrialActivity: 20,  // 工業活動（20%）
      workforceEfficiency: 10, // 労働力効率（10%）
      infrastructureSurplus: 0, // インフラ余剰（0%）
    }
  },
  environmental_group: {
    type: 'environmental_group',
    name: '環境団体',
    description: '環境保全と持続可能な都市運営を求める団体。緑地の拡充とインフラの余裕、住民満足度の向上を重視する。',
    priorities: {
      taxStability: 0,
      infrastructure: 15,
      development: 0,
      fiscalBalance: 0,
      satisfaction: 15,
      parksAndGreenery: 40,
      populationGrowth: 5,
      commercialActivity: 0,
      industrialActivity: 0,
      workforceEfficiency: 0,
      infrastructureSurplus: 25,
    }
  },
  labor_union: {
    type: 'labor_union',
    name: '労働組合',
    description: '労働者の権利と雇用安定を守る組織。職場環境と雇用率、住民満足度の改善を求める。',
    priorities: {
      taxStability: 0,
      infrastructure: 0,
      development: 0,
      fiscalBalance: 0,
      satisfaction: 20,
      parksAndGreenery: 0,
      populationGrowth: 10,
      commercialActivity: 10,
      industrialActivity: 20,
      workforceEfficiency: 30,
      infrastructureSurplus: 10,
    }
  }
};

// 各派閥の現在の支持率
export interface FactionSupport {
  type: FactionType;
  currentRating: number;        // 現在の支持率（0-100）
  previousRating: number;       // 前月の支持率（0-100）
  change: number;               // 変化量（-100 ～ +100）
}

// 支持率の履歴データ（月次）
export interface MonthlySupportHistory {
  year: number;
  month: number;
  factionSupports: FactionSupport[];
}

// 支持率の履歴データ（年次）
export interface YearlySupportHistory {
  year: number;
  averageRatings: Record<FactionType, number>;  // 年間平均支持率
  yearEndRatings: Record<FactionType, number>;  // 年末時点の支持率
  totalChanges: Record<FactionType, number>;    // 年間の総変化量
}

// 支持率システム全体の状態
export interface SupportSystemState {
  factionSupports: FactionSupport[];
  monthlyHistory: MonthlySupportHistory[];
  yearlyHistory: YearlySupportHistory[];
  lastCalculationDate: {
    year: number;
    month: number;
  };
}

// 支持率計算に使用する都市の状態データ
export interface CityStateForSupport {
  satisfaction: number;           // 満足度（0-100）
  population: number;             // 人口
  populationGrowth: number;       // 人口増加率
  taxRevenue: number;             // 税収
  taxRevenueGrowth: number;       // 税収成長率
  infrastructureEfficiency: number; // インフラ効率（0-1）
  infrastructureSurplus: number;   // インフラ余剰
  commercialFacilityCount: number; // 商業施設数
  industrialFacilityCount: number; // 工業施設数
  parkCount: number;               // 公園数
  totalFacilityCount: number;      // 総施設数
  fiscalBalance: number;           // 財政バランス（収入-支出）
  workforceEfficiency: number;     // 労働力効率（0-1）
  cityParameters?: CityParameters; // 都市パラメータ
}

// 支持率の計算結果
export interface SupportCalculationResult {
  factionType: FactionType;
  calculatedRating: number;        // 計算された支持率
  factors: {                       // 各要素の寄与度
    taxStability: number;
    infrastructure: number;
    development: number;
    fiscalBalance: number;
    satisfaction: number;
    parksAndGreenery: number;
    populationGrowth: number;
    commercialActivity: number;
    industrialActivity: number;
    workforceEfficiency: number;
    infrastructureSurplus: number;
  };
  totalScore: number;              // 総合スコア
}

// 支持率レベル
export type SupportLevel = 'very_low' | 'low' | 'neutral' | 'high' | 'very_high';

// 支持率レベルに応じた効果の定義
export interface SupportLevelEffect {
  level: SupportLevel;
  title: string;                   // 効果名
  minRating: number;               // 最小支持率
  maxRating: number;               // 最大支持率
  effects: {
    // 税収関連
    taxMultiplier?: number;        // 税収倍率
    
    // 人口関連
    populationGrowthMultiplier?: number; // 人口増加倍率
    populationOutflowRate?: number;      // 人口流出率（%）
    
    // 満足度関連
    satisfactionBonus?: number;          // 満足度ボーナス
    satisfactionPenalty?: number;        // 満足度ペナルティ
    
    // 施設関連
    facilityEfficiencyMultiplier?: number; // 施設効率倍率
    constructionCostMultiplier?: number;   // 建設コスト倍率
    
    // インフラ関連
    infrastructureEfficiencyBonus?: number; // インフラ効率ボーナス
    
    // 補助金関連
    subsidyMultiplier?: number;           // 補助金倍率
    
    // その他
    workforceEfficiencyBonus?: number;    // 労働力効率ボーナス
    maintenanceCostMultiplier?: number;   // 維持費倍率
  };
}

export interface CombinedSupportEffects {
  taxMultiplier: number;
  subsidyMultiplier: number;
  constructionCostMultiplier: number;
  maintenanceCostMultiplier: number;
  populationGrowthMultiplier: number;
  populationOutflowRate: number;
  facilityEfficiencyMultiplier: number;
  infrastructureEfficiencyBonus: number;
  workforceEfficiencyBonus: number;
  satisfactionDelta: number;
}

// 各派閥の支持率レベル効果定義（要調整）
export const SUPPORT_LEVEL_EFFECTS: Record<FactionType, SupportLevelEffect[]> = {
  central_government: [
    {
      level: 'very_low',
      title: '緊縮監査',
      minRating: 0,
      maxRating: 19,
      effects: {
        taxMultiplier: 0.7,           // 税収30%減少
        subsidyMultiplier: 0.5,       // 補助金50%減少
        constructionCostMultiplier: 1.3, // 建設コスト30%増加
      }
    },
    {
      level: 'low',
      title: '財政再建プログラム',
      minRating: 20,
      maxRating: 39,
      effects: {
        taxMultiplier: 0.85,          // 税収15%減少
        subsidyMultiplier: 0.8,       // 補助金20%減少
        constructionCostMultiplier: 1.15, // 建設コスト15%増加
      }
    },
    {
      level: 'neutral',
      title: '標準評価',
      minRating: 40,
      maxRating: 59,
      effects: {
        // 標準効果（変更なし）
      }
    },
    {
      level: 'high',
      title: '重点支援枠',
      minRating: 60,
      maxRating: 79,
      effects: {
        taxMultiplier: 1.1,           // 税収10%増加
        subsidyMultiplier: 1.2,       // 補助金20%増加
        constructionCostMultiplier: 0.9, // 建設コスト10%減少
      }
    },
    {
      level: 'very_high',
      title: '特別連携枠',
      minRating: 80,
      maxRating: 100,
      effects: {
        taxMultiplier: 1.2,           // 税収20%増加
        subsidyMultiplier: 1.5,       // 補助金50%増加
        constructionCostMultiplier: 0.8, // 建設コスト20%減少
        infrastructureEfficiencyBonus: 0.1, // インフラ効率10%向上
      }
    }
  ],
  citizens: [
    {
      level: 'very_low',
      title: 'ボイコット',
      minRating: 0,
      maxRating: 19,
      effects: {
        populationOutflowRate: 0.2,        // 人口20%流出
        satisfactionPenalty: -20,          // 満足度20減少
        facilityEfficiencyMultiplier: 0.8, // 施設効率20%減少
      }
    },
    {
      level: 'low',
      title: '生活不安',
      minRating: 20,
      maxRating: 39,
      effects: {
        populationOutflowRate: 0.1,        // 人口10%流出
        satisfactionPenalty: -10,          // 満足度10減少
        facilityEfficiencyMultiplier: 0.9, // 施設効率10%減少
      }
    },
    {
      level: 'neutral',
      title: '現状維持',
      minRating: 40,
      maxRating: 59,
      effects: {
        // 標準効果（変更なし）
      }
    },
    {
      level: 'high',
      title: '地域活性化',
      minRating: 60,
      maxRating: 79,
      effects: {
        populationGrowthMultiplier: 1.2, // 人口増加20%増加
        satisfactionBonus: 10,        // 満足度10増加
        facilityEfficiencyMultiplier: 1.05, // 施設効率5%向上
      }
    },
    {
      level: 'very_high',
      title: '市民協働モデル',
      minRating: 80,
      maxRating: 100,
      effects: {
        populationGrowthMultiplier: 1.5,   // 人口増加50%増加
        satisfactionBonus: 20,             // 満足度20増加
        facilityEfficiencyMultiplier: 1.1, // 施設効率10%向上
        maintenanceCostMultiplier: 0.9,    // 維持費10%減少
      }
    }
  ],
  chamber_of_commerce: [
    {
      level: 'very_low',
      title: '取引停止',
      minRating: 0,
      maxRating: 19,
      effects: {
        taxMultiplier: 0.8,           // 税収20%減少
        facilityEfficiencyMultiplier: 0.7, // 施設効率30%減少
        workforceEfficiencyBonus: -0.2, // 労働力効率20%減少
      }
    },
    {
      level: 'low',
      title: '業界不信',
      minRating: 20,
      maxRating: 39,
      effects: {
        taxMultiplier: 0.9,           // 税収10%減少
        facilityEfficiencyMultiplier: 0.85, // 施設効率15%減少
        workforceEfficiencyBonus: -0.1, // 労働力効率10%減少
      }
    },
    {
      level: 'neutral',
      title: '通常取引',
      minRating: 40,
      maxRating: 59,
      effects: {
        // 標準効果（変更なし）
      }
    },
    {
      level: 'high',
      title: '商工協調',
      minRating: 60,
      maxRating: 79,
      effects: {
        taxMultiplier: 1.15,          // 税収15%増加
        facilityEfficiencyMultiplier: 1.1, // 施設効率10%向上
        workforceEfficiencyBonus: 0.1, // 労働力効率10%向上
      }
    },
    {
      level: 'very_high',
      title: '戦略的連携',
      minRating: 80,
      maxRating: 100,
      effects: {
        taxMultiplier: 1.3,           // 税収30%増加
        facilityEfficiencyMultiplier: 1.2, // 施設効率20%向上
        workforceEfficiencyBonus: 0.2, // 労働力効率20%向上
        maintenanceCostMultiplier: 0.85, // 維持費15%減少
      }
    }
  ],
  conglomerate: [
    {
      level: 'very_low',
      title: '資本逃避',
      minRating: 0,
      maxRating: 19,
      effects: {
        taxMultiplier: 0.85,              // 税収15%減少
        facilityEfficiencyMultiplier: 0.85, // 施設効率15%減少
        maintenanceCostMultiplier: 1.1,   // 維持費10%増加
      }
    },
    {
      level: 'low',
      title: '投資停滞',
      minRating: 20,
      maxRating: 39,
      effects: {
        taxMultiplier: 0.95,              // 税収5%減少
        facilityEfficiencyMultiplier: 0.95, // 施設効率5%減少
      }
    },
    {
      level: 'neutral',
      title: '通常運用',
      minRating: 40,
      maxRating: 59,
      effects: {
        // 標準効果（変更なし）
      }
    },
    {
      level: 'high',
      title: '基本的支援',
      minRating: 60,
      maxRating: 79,
      effects: {
        taxMultiplier: 1.15,              // 税収15%増加
        facilityEfficiencyMultiplier: 1.1, // 施設効率10%向上
        constructionCostMultiplier: 0.95, // 建設コスト5%減少
        workforceEfficiencyBonus: 0.05,   // 労働力効率5%向上
      }
    },
    {
      level: 'very_high',
      title: '積極的投資',
      minRating: 80,
      maxRating: 100,
      effects: {
        taxMultiplier: 1.3,               // 税収30%増加
        facilityEfficiencyMultiplier: 1.2, // 施設効率20%向上
        constructionCostMultiplier: 0.9,  // 建設コスト10%減少
        maintenanceCostMultiplier: 0.9,   // 維持費10%減少
        workforceEfficiencyBonus: 0.1,    // 労働力効率10%向上
        populationGrowthMultiplier: 1.1,  // 人口増加10%増加
      }
    }
  ],
  environmental_group: [
    {
      level: 'very_low',
      title: '環境危機',
      minRating: 0,
      maxRating: 19,
      effects: {
        populationGrowthMultiplier: 0.9,  // 人口増加10%減少
        satisfactionPenalty: -15,         // 満足度15減少
        facilityEfficiencyMultiplier: 0.9, // 施設効率10%減少
        maintenanceCostMultiplier: 1.1,   // 維持費10%増加
      }
    },
    {
      level: 'low',
      title: '抗議運動',
      minRating: 20,
      maxRating: 39,
      effects: {
        populationGrowthMultiplier: 0.95, // 人口増加5%減少
        satisfactionPenalty: -8,          // 満足度8減少
        maintenanceCostMultiplier: 1.05,  // 維持費5%増加
      }
    },
    {
      level: 'neutral',
      title: '現状静観',
      minRating: 40,
      maxRating: 59,
      effects: {
        // 標準効果（変更なし）
      }
    },
    {
      level: 'high',
      title: '環境協働',
      minRating: 60,
      maxRating: 79,
      effects: {
        satisfactionBonus: 10,             // 満足度10増加
        maintenanceCostMultiplier: 0.95,   // 維持費5%減少
        facilityEfficiencyMultiplier: 1.05, // 施設効率5%向上
      }
    },
    {
      level: 'very_high',
      title: 'グリーン都市モデル',
      minRating: 80,
      maxRating: 100,
      effects: {
        satisfactionBonus: 18,             // 満足度18増加
        maintenanceCostMultiplier: 0.9,    // 維持費10%減少
        facilityEfficiencyMultiplier: 1.1, // 施設効率10%向上
        populationGrowthMultiplier: 1.05,  // 人口増加5%増加
        infrastructureEfficiencyBonus: 0.05, // インフラ効率5%向上
      }
    }
  ],
  labor_union: [
    {
      level: 'very_low',
      title: 'ストライキ連発',
      minRating: 0,
      maxRating: 19,
      effects: {
        facilityEfficiencyMultiplier: 0.8,  // 施設効率20%減少
        workforceEfficiencyBonus: -0.2,     // 労働力効率20%減少
        populationOutflowRate: 0.08,        // 人口8%流出
      }
    },
    {
      level: 'low',
      title: '労使対立',
      minRating: 20,
      maxRating: 39,
      effects: {
        facilityEfficiencyMultiplier: 0.9,  // 施設効率10%減少
        workforceEfficiencyBonus: -0.1,     // 労働力効率10%減少
        populationOutflowRate: 0.04,        // 人口4%流出
      }
    },
    {
      level: 'neutral',
      title: '労使協議',
      minRating: 40,
      maxRating: 59,
      effects: {
        // 標準効果（変更なし）
      }
    },
    {
      level: 'high',
      title: '労使協調',
      minRating: 60,
      maxRating: 79,
      effects: {
        facilityEfficiencyMultiplier: 1.05, // 施設効率5%向上
        workforceEfficiencyBonus: 0.05,     // 労働力効率5%向上
        satisfactionBonus: 8,               // 満足度8増加
      }
    },
    {
      level: 'very_high',
      title: '模範的労使関係',
      minRating: 80,
      maxRating: 100,
      effects: {
        facilityEfficiencyMultiplier: 1.1,  // 施設効率10%向上
        workforceEfficiencyBonus: 0.1,      // 労働力効率10%向上
        satisfactionBonus: 15,              // 満足度15増加
        populationGrowthMultiplier: 1.08,   // 人口増加8%増加
        maintenanceCostMultiplier: 0.95,    // 維持費5%減少
      }
    }
  ]
};
