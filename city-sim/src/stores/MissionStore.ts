import { create } from 'zustand';
import type { 
  Mission, 
  Condition, 
  Effect, 
  ConditionCheckResult, 
  EffectApplyResult,
  MissionStatus
} from '../types/mission';
import { useGameStore } from './GameStore';
import { useFacilityStore } from './FacilityStore';
import { useSupportStore } from './SupportStore';
import { useInfrastructureStore } from './InfrastructureStore';
import { useProductStore } from './ProductStore';
import { calculateTotalTaxRevenue, getCurrentWorkforceAllocations, calculateMonthlyBalance } from './EconomyStore';
import { saveLoadRegistry } from './SaveLoadRegistry';

// ミッションストアのインターフェース
interface MissionStore {
  // 状態管理
  missions: Mission[];
  activeMissions: Mission[];
  completedMissions: Mission[];
  
  // 基本操作
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  removeMission: (id: string) => void;
  
  // ミッション受注
  acceptMission: (id: string) => void;
  
  // 条件チェック
  checkMissionConditions: () => void;
  updateMissionProgress: (id: string) => void;
  
  // 効果適用
  applyMissionEffects: (mission: Mission) => void;
  completeMission: (id: string) => void;
  
  // ミッション生成
  generateSampleMissions: () => void;
  
  // セーブ・ロード
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

// 条件チェックエンジン
class ConditionEngine {
  /**
   * 単一の条件を評価
   */
  static evaluateCondition(condition: Condition, gameState: any, facilities: any[]): ConditionCheckResult {
    let actualValue = 0;
    let message = '';
    
    try {
      switch (condition.type) {
        case 'population':
          actualValue = gameState.population;
          message = `人口: ${actualValue}/${condition.value}`;
          break;
          
        case 'money':
          actualValue = gameState.money;
          message = `所持金: ${actualValue}/${condition.value}`;
          break;
          
        case 'satisfaction':
          actualValue = gameState.satisfaction;
          message = `満足度: ${actualValue}/${condition.value}`;
          break;
          
        case 'level':
          actualValue = gameState.level;
          message = `レベル: ${actualValue}/${condition.value}`;
          break;
          
        case 'facility_count':
          actualValue = facilities.length;
          message = `施設数: ${actualValue}/${condition.value}`;
          break;
          
        case 'facility_type_count':
          if (condition.target) {
            actualValue = facilities.filter(f => f.type === condition.target).length;
            message = `${condition.target}施設数: ${actualValue}/${condition.value}`;
          } else {
            actualValue = 0;
            message = '対象施設タイプが指定されていません';
          }
          break;
          
        case 'time_elapsed':
          actualValue = gameState.date.totalWeeks;
          message = `経過週数: ${actualValue}/${condition.value}`;
          break;
          
        case 'monthly_balance':
          actualValue = gameState.monthlyBalance.balance;
          message = `月次収支: ${actualValue}/${condition.value}`;
          break;
          
        case 'support_rating':
          if (condition.target) {
            try {
              const supportStore = useSupportStore.getState();
              const factionSupport = supportStore.getFactionSupport(condition.target as any);
              actualValue = factionSupport ? factionSupport.currentRating : 0;
              message = `${condition.target}支持率: ${actualValue}/${condition.value}`;
            } catch (error) {
              actualValue = 0;
              message = `派閥支持率の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = '派閥支持率の取得には対象派閥の指定が必要です';
          }
          break;
          
        case 'infrastructure_balance':
          if (condition.target) {
            try {
              const infraStore = useInfrastructureStore.getState();
              const status = infraStore.getInfrastructureStatus();
              if (condition.target === 'water') {
                actualValue = status.water.balance;
                message = `水道バランス: ${actualValue}/${condition.value}`;
              } else if (condition.target === 'electricity') {
                actualValue = status.electricity.balance;
                message = `電力バランス: ${actualValue}/${condition.value}`;
              } else {
                actualValue = 0;
                message = `不明なインフラタイプ: ${condition.target}`;
              }
            } catch (error) {
              actualValue = 0;
              message = `インフラバランスの取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = 'インフラバランスの取得には対象（water/electricity）の指定が必要です';
          }
          break;
          
        case 'infrastructure_supply':
          if (condition.target) {
            try {
              const infraStore = useInfrastructureStore.getState();
              const status = infraStore.getInfrastructureStatus();
              if (condition.target === 'water') {
                actualValue = status.water.supply;
                message = `水道供給: ${actualValue}/${condition.value}`;
              } else if (condition.target === 'electricity') {
                actualValue = status.electricity.supply;
                message = `電力供給: ${actualValue}/${condition.value}`;
              } else {
                actualValue = 0;
                message = `不明なインフラタイプ: ${condition.target}`;
              }
            } catch (error) {
              actualValue = 0;
              message = `インフラ供給の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = 'インフラ供給の取得には対象（water/electricity）の指定が必要です';
          }
          break;
          
        case 'infrastructure_demand':
          if (condition.target) {
            try {
              const infraStore = useInfrastructureStore.getState();
              const status = infraStore.getInfrastructureStatus();
              if (condition.target === 'water') {
                actualValue = status.water.demand;
                message = `水道需要: ${actualValue}/${condition.value}`;
              } else if (condition.target === 'electricity') {
                actualValue = status.electricity.demand;
                message = `電力需要: ${actualValue}/${condition.value}`;
              } else {
                actualValue = 0;
                message = `不明なインフラタイプ: ${condition.target}`;
              }
            } catch (error) {
              actualValue = 0;
              message = `インフラ需要の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = 'インフラ需要の取得には対象（water/electricity）の指定が必要です';
          }
          break;
          
        case 'infrastructure_ratio':
          if (condition.target) {
            try {
              const infraStore = useInfrastructureStore.getState();
              const status = infraStore.getInfrastructureStatus();
              let supply = 0;
              let demand = 0;
              
              if (condition.target === 'water') {
                supply = status.water.supply;
                demand = status.water.demand;
              } else if (condition.target === 'electricity') {
                supply = status.electricity.supply;
                demand = status.electricity.demand;
              }
              
              // 供給率を計算（需要が0の場合は100%とする）
              actualValue = demand > 0 ? Math.round((supply / demand) * 100) : 100;
              message = `${condition.target}供給率: ${actualValue}%/${condition.value}%`;
            } catch (error) {
              actualValue = 0;
              message = `インフラ供給率の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = 'インフラ供給率の取得には対象（water/electricity）の指定が必要です';
          }
          break;
          
        case 'tax_revenue':
          try {
            actualValue = calculateTotalTaxRevenue(gameState, facilities);
            message = `税収: ${actualValue}/${condition.value}`;
          } catch (error) {
            actualValue = 0;
            message = `税収の取得エラー: ${error}`;
          }
          break;
          
        case 'monthly_income':
          try {
            const monthlyBalance = calculateMonthlyBalance(gameState, facilities);
            actualValue = monthlyBalance.income;
            message = `月次収入: ${actualValue}/${condition.value}`;
          } catch (error) {
            actualValue = 0;
            message = `月次収入の取得エラー: ${error}`;
          }
          break;
          
        case 'monthly_expense':
          try {
            const monthlyBalance = calculateMonthlyBalance(gameState, facilities);
            actualValue = monthlyBalance.expense;
            message = `月次支出: ${actualValue}/${condition.value}`;
          } catch (error) {
            actualValue = 0;
            message = `月次支出の取得エラー: ${error}`;
          }
          break;
          
        case 'product_demand':
          if (condition.target !== undefined && typeof condition.target === 'string') {
            try {
              const productStore = useProductStore.getState();
              const demand = productStore.calculateProductDemand(facilities);
              const productIndex = parseInt(condition.target);
              if (productIndex >= 0 && productIndex < 4) {
                actualValue = demand[productIndex];
                const productNames = ['原材料', '中間製品', '最終製品', 'サービス'];
                message = `${productNames[productIndex]}需要: ${actualValue}/${condition.value}`;
              } else {
                actualValue = 0;
                message = `無効な製品インデックス: ${condition.target}`;
              }
            } catch (error) {
              actualValue = 0;
              message = `製品需要の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = '製品需要の取得には製品インデックス（0:原材料, 1:中間製品, 2:最終製品, 3:サービス）の指定が必要です';
          }
          break;
          
        case 'product_production':
          if (condition.target !== undefined && typeof condition.target === 'string') {
            try {
              const productStore = useProductStore.getState();
              const production = productStore.calculateProductProduction(facilities);
              const productIndex = parseInt(condition.target);
              if (productIndex >= 0 && productIndex < 4) {
                actualValue = production[productIndex];
                const productNames = ['原材料', '中間製品', '最終製品', 'サービス'];
                message = `${productNames[productIndex]}生産: ${actualValue}/${condition.value}`;
              } else {
                actualValue = 0;
                message = `無効な製品インデックス: ${condition.target}`;
              }
            } catch (error) {
              actualValue = 0;
              message = `製品生産の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = '製品生産の取得には製品インデックス（0:原材料, 1:中間製品, 2:最終製品, 3:サービス）の指定が必要です';
          }
          break;
          
        case 'product_efficiency':
          try {
            const productStore = useProductStore.getState();
            const status = productStore.getProductSupplyDemandStatus(facilities);
            actualValue = Math.round(status.efficiency * 100); // パーセント表示
            message = `製品効率: ${actualValue}%/${condition.value}%`;
          } catch (error) {
            actualValue = 0;
            message = `製品効率の取得エラー: ${error}`;
          }
          break;
          
        case 'workforce_efficiency':
          try {
            const workforceAllocations = getCurrentWorkforceAllocations(gameState);
            if (workforceAllocations.length > 0) {
              const averageEfficiency = workforceAllocations.reduce((sum, allocation) => 
                sum + allocation.efficiency, 0) / workforceAllocations.length;
              actualValue = Math.round(averageEfficiency * 100); // パーセント表示
              message = `労働力効率: ${actualValue}%/${condition.value}%`;
            } else {
              actualValue = 0;
              message = '労働力配分がありません';
            }
          } catch (error) {
            actualValue = 0;
            message = `労働力効率の取得エラー: ${error}`;
          }
          break;
          
        default:
          actualValue = 0;
          message = `未対応の条件タイプ: ${condition.type}`;
          break;
      }
      
      // 条件の評価
      const result = this.compareValues(actualValue, condition.op, condition.value);
      
      return {
        condition,
        result,
        actualValue,
        message
      };
      
    } catch (error) {
      console.error(`条件チェックエラー (${condition.type}):`, error);
      return {
        condition,
        result: false,
        actualValue: 0,
        message: `エラー: ${error}`
      };
    }
  }
  
  /**
   * 値の比較
   */
  private static compareValues(actual: number, op: string, expected: number): boolean {
    switch (op) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '==': return actual === expected;
      case '!=': return actual !== expected;
      default: return false;
    }
  }
  
  /**
   * 複合条件の評価（将来の拡張用）
   */
  static evaluateCompoundCondition(condition: any, _gameState: any, _facilities: any[]): ConditionCheckResult {
    // TODO: 複合条件の実装
    return {
      condition,
      result: false,
      actualValue: 0,
      message: '複合条件は未実装です'
    };
  }
}

// 効果適用エンジン
class EffectEngine {
  /**
   * 効果を適用
   */
  static applyEffect(effect: Effect, gameState: any): EffectApplyResult {
    let success = false;
    let message = '';
    let previousValue = 0;
    let newValue = 0;
    
    try {
      switch (effect.type) {
        case 'money':
          previousValue = gameState.money;
          newValue = previousValue + effect.value;
          useGameStore.getState().addMoney(effect.value);
          success = true;
          message = `資金: ${previousValue} → ${newValue}`;
          break;
          
        case 'population':
          previousValue = gameState.population;
          newValue = previousValue + effect.value;
          useGameStore.getState().addPopulation(effect.value);
          success = true;
          message = `人口: ${previousValue} → ${newValue}`;
          break;
          
        case 'satisfaction':
          previousValue = gameState.satisfaction;
          newValue = Math.max(0, Math.min(100, previousValue + effect.value));
          // 満足度の更新はGameStoreのrecalculateSatisfactionで行う
          success = true;
          message = `満足度: ${previousValue} → ${newValue}`;
          break;
          
        case 'faction_support':
          if (effect.target) {
            try {
              const supportStore = useSupportStore.getState();
              const currentSupport = supportStore.getFactionSupport(effect.target as any);
              
              if (currentSupport) {
                previousValue = currentSupport.currentRating;
                newValue = Math.max(0, Math.min(100, previousValue + effect.value));
                
                // 派閥支持率を更新
                supportStore.updateFactionSupport(effect.target as any, newValue);
                
                success = true;
                message = `${effect.target}支持率: ${previousValue} → ${newValue} (${effect.value >= 0 ? '+' : ''}${effect.value})`;
              }
              else {
                success = false;
                message = `派閥「${effect.target}」が見つかりません`;
              }
            } catch (error) {
              success = false;
              message = `派閥支持率の更新エラー: ${error}`;
            }
          }
          else {
            success = false;
            message = '派閥支持率の更新には対象派閥の指定が必要です';
          }
          break;
          
        default:
          success = false;
          message = `未対応の効果タイプ: ${effect.type}`;
          break;
      }
      
      return {
        effect,
        success,
        message,
        previousValue,
        newValue
      };
      
    } catch (error) {
      console.error(`効果適用エラー (${effect.type}):`, error);
      return {
        effect,
        success: false,
        message: `エラー: ${error}`,
        previousValue: 0,
        newValue: 0
      };
    }
  }
}

// サンプルミッションデータ
const sampleMissions: Mission[] = [
  {
    id: 'mission_population_100',
    name: '人口100人達成',
    description: '人口を100人にしましょう',
    type: 'mission',
    category: 'development',
    priority: 1,
    conditions: [
      { type: 'population', op: '>=', value: 100 }
    ],
    effects: [
      { type: 'money', value: 5000 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: true,  // 自動受注
    isRepeatable: false
  },
  {
    id: 'mission_residential_5',
    name: '住宅5つ建設',
    description: '住宅施設を5つ建設しましょう',
    type: 'mission',
    category: 'development',
    priority: 2,
    conditions: [
      { type: 'facility_type_count', op: '>=', value: 5, target: 'residential' }
    ],
    effects: [
      { type: 'population', value: 200 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: true,  // 自動受注
    isRepeatable: false
  },
  {
    id: 'mission_money_5000',
    name: '資金5000円達成',
    description: '所持金を5000円にしましょう',
    type: 'mission',
    category: 'economic',
    priority: 3,
    conditions: [
      { type: 'money', op: '>=', value: 5000 }
    ],
    effects: [
      { type: 'satisfaction', value: 10 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_citizen_support',
    name: '市民の支持を得よう',
    description: '市民の支持率を60%以上にしましょう',
    type: 'mission',
    category: 'social',
    priority: 4,
    conditions: [
      { type: 'support_rating', op: '>=', value: 60, target: 'citizens' }
    ],
    effects: [
      { type: 'money', value: 3000 },
      { type: 'faction_support', target: 'citizens', value: 5 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_government_favor',
    name: '政府からの依頼',
    description: '商業施設を3つ建設して、経済を活性化することを求められています',
    type: 'mission',
    category: 'infrastructure',
    priority: 5,
    conditions: [
      { type: 'facility_type_count', op: '>=', value: 3, target: 'commercial' }
    ],
    effects: [
      { type: 'faction_support', target: 'central_government', value: 15 },
      { type: 'money', value: 5000 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_water_infrastructure',
    name: '水道インフラ整備',
    description: '水道供給を10以上確保して、安定した水の供給を実現しましょう',
    type: 'mission',
    category: 'infrastructure',
    priority: 6,
    conditions: [
      { type: 'infrastructure_supply', op: '>=', value: 10, target: 'water' }
    ],
    effects: [
      { type: 'money', value: 4000 },
      { type: 'satisfaction', value: 5 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_power_grid',
    name: '電力網の安定化',
    description: '電力供給率を120%以上にして、電力の安定供給を実現しましょう',
    type: 'mission',
    category: 'infrastructure',
    priority: 7,
    conditions: [
      { type: 'infrastructure_ratio', op: '>=', value: 120, target: 'electricity' }
    ],
    effects: [
      { type: 'money', value: 6000 },
      { type: 'faction_support', target: 'central_government', value: 10 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_infrastructure_balance',
    name: 'インフラバランス達成',
    description: '水道と電力の両方で安定した供給を確保しましょう',
    type: 'mission',
    category: 'infrastructure',
    priority: 8,
    conditions: [
      { type: 'infrastructure_balance', op: '>=', value: 5, target: 'water' },
      { type: 'infrastructure_balance', op: '>=', value: 5, target: 'electricity' }
    ],
    effects: [
      { type: 'money', value: 8000 },
      { type: 'satisfaction', value: 15 },
      { type: 'faction_support', target: 'citizens', value: 10 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: true
  },
  {
    id: 'mission_tax_revenue_boost',
    name: '税収1000円達成',
    description: '月次税収を1000円以上にして、財政を安定させましょう',
    type: 'mission',
    category: 'economic',
    priority: 9,
    conditions: [
      { type: 'tax_revenue', op: '>=', value: 1000 }
    ],
    effects: [
      { type: 'money', value: 5000 },
      { type: 'faction_support', target: 'central_government', value: 8 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_balanced_budget',
    name: '収支の黒字化',
    description: '月次収入を月次支出より多くして、財政を安定させましょう',
    type: 'mission',
    category: 'economic',
    priority: 10,
    conditions: [
      { type: 'monthly_income', op: '>', value: 500 },
      { type: 'monthly_expense', op: '<', value: 400 }
    ],
    effects: [
      { type: 'money', value: 3000 },
      { type: 'satisfaction', value: 10 },
      { type: 'faction_support', target: 'citizens', value: 8 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_workforce_optimization',
    name: '労働力の最適化',
    description: '労働力効率を75%以上にして、経済を活性化しましょう',
    type: 'mission',
    category: 'economic',
    priority: 11,
    conditions: [
      { type: 'workforce_efficiency', op: '>=', value: 75 }
    ],
    effects: [
      { type: 'money', value: 5000 },
      { type: 'satisfaction', value: 15 },
      { type: 'faction_support', target: 'chamber_of_commerce', value: 10 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: true
  },
  {
    id: 'mission_cost_control',
    name: 'コスト管理の達成',
    description: '月次支出を300以下に抑えて、効率的な運営を実現しましょう',
    type: 'mission',
    category: 'economic',
    priority: 12,
    conditions: [
      { type: 'monthly_expense', op: '<=', value: 300 }
    ],
    effects: [
      { type: 'money', value: 4000 },
      { type: 'faction_support', target: 'central_government', value: 12 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_raw_material_production',
    name: '原材料の確保',
    description: '原材料の生産を10以上にして、産業の基盤を整えましょう',
    type: 'mission',
    category: 'economic',
    priority: 13,
    conditions: [
      { type: 'product_production', op: '>=', value: 10, target: '0' }  // 原材料（インデックス0）
    ],
    effects: [
      { type: 'money', value: 3000 },
      { type: 'satisfaction', value: 5 },
      { type: 'faction_support', target: 'citizens', value: 8 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_final_product_chain',
    name: '製品供給チェーンの確立',
    description: '最終製品の生産を15以上にして、住民の需要を満たしましょう',
    type: 'mission',
    category: 'economic',
    priority: 14,
    conditions: [
      { type: 'product_production', op: '>=', value: 15, target: '2' }  // 最終製品（インデックス2）
    ],
    effects: [
      { type: 'money', value: 6000 },
      { type: 'satisfaction', value: 15 },
      { type: 'faction_support', target: 'chamber_of_commerce', value: 12 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: false
  },
  {
    id: 'mission_service_economy',
    name: 'サービス経済の発展',
    description: 'サービス生産を25以上にして、現代的な経済を構築しましょう',
    type: 'mission',
    category: 'economic',
    priority: 15,
    conditions: [
      { type: 'product_production', op: '>=', value: 25, target: '3' }  // サービス（インデックス3）
    ],
    effects: [
      { type: 'money', value: 8000 },
      { type: 'satisfaction', value: 20 },
      { type: 'faction_support', target: 'chamber_of_commerce', value: 15 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: true
  },
  {
    id: 'mission_production_efficiency',
    name: '生産効率の最適化',
    description: '製品効率を90%以上にして、需給バランスを取りましょう',
    type: 'mission',
    category: 'economic',
    priority: 16,
    conditions: [
      { type: 'product_efficiency', op: '>=', value: 90 }
    ],
    effects: [
      { type: 'money', value: 10000 },
      { type: 'satisfaction', value: 25 },
      { type: 'faction_support', target: 'chamber_of_commerce', value: 20 }
    ],
    status: 'available',
    progress: 0,
    autoAccept: false,  // 手動受注
    isRepeatable: true
  }
];

// ミッションストアの作成
export const useMissionStore = create<MissionStore>((set, get) => ({
  // 初期状態
  missions: [],
  activeMissions: [],
  completedMissions: [],
  
  // ミッション追加
  addMission: (mission: Mission) => {
    set(state => ({
      missions: [...state.missions, mission],
      activeMissions: [...state.activeMissions, mission]
    }));
  },
  
  // ミッション更新
  updateMission: (id: string, updates: Partial<Mission>) => {
    set(state => ({
      missions: state.missions.map(m => 
        m.id === id ? { ...m, ...updates } : m
      ),
      activeMissions: state.activeMissions.map(m => 
        m.id === id ? { ...m, ...updates } : m
      )
    }));
  },
  
  // ミッション削除
  removeMission: (id: string) => {
    set(state => ({
      missions: state.missions.filter(m => m.id !== id),
      activeMissions: state.activeMissions.filter(m => m.id !== id),
      completedMissions: state.completedMissions.filter(m => m.id !== id)
    }));
  },
  
  // ミッション受注
  acceptMission: (id: string) => {
    set(state => {
      const mission = state.missions.find(m => m.id === id);
      if (!mission || mission.status !== 'available') {
        console.warn(`ミッション「${id}」は受注できません。状態: ${mission?.status}`);
        return state;
      }
      
      const updatedMissions = state.missions.map(m =>
        m.id === id ? { ...m, status: 'in_progress' as MissionStatus } : m
      );
      
      return {
        missions: updatedMissions,
        activeMissions: [...state.activeMissions, { ...mission, status: 'in_progress' as MissionStatus }],
        completedMissions: state.completedMissions
      };
    });
  },
  
  // 条件チェック
  checkMissionConditions: () => {
    const gameState = useGameStore.getState().stats;
    const facilities = useFacilityStore.getState().facilities;
    
    set(state => {
      const updatedMissions = state.missions.map(mission => {
        if (mission.status === 'completed') return mission;
        
        // 各条件をチェック
        const conditionResults = mission.conditions?.map(condition => 
          ConditionEngine.evaluateCondition(condition, gameState, facilities)
        ) || [];
        
        // 全ての条件が満たされているかチェック
        const allConditionsMet = conditionResults.every(result => result.result);
        
        // 進捗を計算（条件の達成率）
        const progress = conditionResults.length > 0 
          ? Math.round((conditionResults.filter(r => r.result).length / conditionResults.length) * 100)
          : 0;
        
        // 状態を更新（自動受注のみ自動でin_progressに変更）
        let newStatus: MissionStatus = mission.status;
        if (allConditionsMet && mission.status === 'available' && mission.autoAccept) {
          newStatus = 'in_progress';
        }
        
        return {
          ...mission,
          status: newStatus,
          progress
        };
      });
      
      return {
        missions: updatedMissions,
        activeMissions: updatedMissions.filter(m => m.status === 'in_progress'),
        completedMissions: updatedMissions.filter(m => m.status === 'completed')
      };
    });
  },
  
  // 進捗更新
  updateMissionProgress: (_id: string) => {
    get().checkMissionConditions();
  },
  
  // 効果適用
  applyMissionEffects: (mission: Mission) => {
    if (mission.status !== 'completed') return;
    
    const gameState = useGameStore.getState().stats;
    
    // 各効果を適用
    mission.effects?.forEach(effect => {
      const result = EffectEngine.applyEffect(effect, gameState);
      if (result.success) {
        console.log(`効果適用成功: ${result.message}`);
      } else {
        console.warn(`効果適用失敗: ${result.message}`);
      }
    });
  },
  
  // ミッション完了
  completeMission: (id: string) => {
    set(state => {
      const mission = state.missions.find(m => m.id === id);
      if (!mission) return state;
      
      // 効果を適用
      get().applyMissionEffects(mission);
      
      // 状態を更新
      const updatedMissions = state.missions.map(m => 
        m.id === id ? { ...m, status: 'completed' as MissionStatus } : m
      );
      
      return {
        missions: updatedMissions,
        activeMissions: state.activeMissions.filter(m => m.id !== id),
        completedMissions: [...state.completedMissions, { ...mission, status: 'completed' as MissionStatus }]
      };
    });
  },
  
  // サンプルミッション生成
  generateSampleMissions: () => {
    set({ missions: sampleMissions, activeMissions: sampleMissions });
  },
  
  // セーブ・ロード
  saveState: () => {
    const state = get();
    return {
      missions: state.missions,
      activeMissions: state.activeMissions,
      completedMissions: state.completedMissions
    };
  },
  
  loadState: (savedState: any) => {
    if (savedState) {
      set({
        missions: savedState.missions || [],
        activeMissions: savedState.activeMissions || [],
        completedMissions: savedState.completedMissions || []
      });
    }
  },
  
  resetToInitial: () => {
    set({
      missions: [],
      activeMissions: [],
      completedMissions: []
    });
  }
}));

// 自動登録
saveLoadRegistry.register('mission', useMissionStore.getState());
