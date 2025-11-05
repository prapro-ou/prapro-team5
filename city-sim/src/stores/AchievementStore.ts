import { create } from 'zustand';
import type { AchievementStore } from '../types/achievement';
import { useGameStore } from './GameStore';
import { useFacilityStore } from './FacilityStore';
import { useSupportStore } from './SupportStore';
import { useInfrastructureStore } from './InfrastructureStore';
import { useProductStore } from './ProductStore';
import type { ProductType } from '../types/facility';
import { calculateTotalTaxRevenue, getCurrentWorkforceAllocations, calculateMonthlyBalance } from './EconomyStore';
import { loadAchievementsFromJSON, getDefaultAchievements } from '../utils/achievementLoader';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { playCoinSound } from '../components/SoundSettings';

// 条件チェックエンジン
class ConditionEngine {
  static evaluateCondition(condition: any, gameState: any, facilities: any[]): { result: boolean; actualValue: number; message: string } {
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
            } 
            catch (error) {
              actualValue = 0;
              message = `派閥支持率の取得エラー: ${error}`;
            }
          } 
          else {
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
              } 
              else if (condition.target === 'electricity') {
                actualValue = status.electricity.balance;
                message = `電力バランス: ${actualValue}/${condition.value}`;
              } 
              else {
                actualValue = 0;
                message = `不明なインフラタイプ: ${condition.target}`;
              }
            } 
            catch (error) {
              actualValue = 0;
              message = `インフラバランスの取得エラー: ${error}`;
            }
          } 
          else {
            actualValue = 0;
            message = 'インフラバランスの取得には対象の指定が必要です';
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
              } 
              else if (condition.target === 'electricity') {
                actualValue = status.electricity.supply;
                message = `電力供給: ${actualValue}/${condition.value}`;
              } 
              else {
                actualValue = 0;
                message = `不明なインフラタイプ: ${condition.target}`;
              }
            } catch (error) {
              actualValue = 0;
              message = `インフラ供給の取得エラー: ${error}`;
            }
          } else {
            actualValue = 0;
            message = 'インフラ供給の取得には対象の指定が必要です';
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
              } 
              else if (condition.target === 'electricity') {
                actualValue = status.electricity.demand;
                message = `電力需要: ${actualValue}/${condition.value}`;
              } 
              else {
                actualValue = 0;
                message = `不明なインフラタイプ: ${condition.target}`;
              }
            } 
            catch (error) {
              actualValue = 0;
              message = `インフラ需要の取得エラー: ${error}`;
            }
          } 
          else {
            actualValue = 0;
            message = 'インフラ需要の取得には対象の指定が必要です';
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
              } 
              else if (condition.target === 'electricity') {
                supply = status.electricity.supply;
                demand = status.electricity.demand;
              }
              
              actualValue = demand > 0 ? Math.round((supply / demand) * 100) : 100;
              message = `${condition.target}供給率: ${actualValue}%/${condition.value}%`;
            } 
            catch (error) {
              actualValue = 0;
              message = `インフラ供給率の取得エラー: ${error}`;
            }
          } 
          else {
            actualValue = 0;
            message = 'インフラ供給率の取得には対象の指定が必要です';
          }
          break;
          
        case 'tax_revenue':
          try {
            actualValue = calculateTotalTaxRevenue(gameState, facilities);
            message = `税収: ${actualValue}/${condition.value}`;
          } 
          catch (error) {
            actualValue = 0;
            message = `税収の取得エラー: ${error}`;
          }
          break;
          
        case 'monthly_income':
          try {
            const monthlyBalance = calculateMonthlyBalance(gameState, facilities);
            actualValue = monthlyBalance.income;
            message = `月次収入: ${actualValue}/${condition.value}`;
          } 
          catch (error) {
            actualValue = 0;
            message = `月次収入の取得エラー: ${error}`;
          }
          break;
          
        case 'monthly_expense':
          try {
            const monthlyBalance = calculateMonthlyBalance(gameState, facilities);
            actualValue = monthlyBalance.expense;
            message = `月次支出: ${actualValue}/${condition.value}`;
          } 
          catch (error) {
            actualValue = 0;
            message = `月次支出の取得エラー: ${error}`;
          }
          break;
          
        case 'product_demand':
          if (condition.target !== undefined && typeof condition.target === 'string') {
            try {
              const productStore = useProductStore.getState();
              const demand = productStore.calculateProductDemand(facilities);
              const productType = condition.target as ProductType;
              const productNames: Record<ProductType, string> = {
                raw_material: '原材料',
                intermediate_product: '中間製品',
                final_product: '最終製品',
                service: 'サービス'
              };
              if (productType in demand && productNames[productType]) {
                actualValue = demand[productType];
                message = `${productNames[productType]}需要: ${actualValue}/${condition.value}`;
              } 
              else {
                actualValue = 0;
                message = `無効な製品タイプ: ${condition.target}`;
              }
            } 
            catch (error) {
              actualValue = 0;
              message = `製品需要の取得エラー: ${error}`;
            }
          } 
          else {
            actualValue = 0;
            message = '製品需要の取得には製品タイプ（raw_material, intermediate_product, final_product, service）の指定が必要です';
          }
          break;
          
        case 'product_production':
          if (condition.target !== undefined && typeof condition.target === 'string') {
            try {
              const productStore = useProductStore.getState();
              const production = productStore.calculateProductProduction(facilities);
              const productType = condition.target as ProductType;
              const productNames: Record<ProductType, string> = {
                raw_material: '原材料',
                intermediate_product: '中間製品',
                final_product: '最終製品',
                service: 'サービス'
              };
              if (productType in production && productNames[productType]) {
                actualValue = production[productType];
                message = `${productNames[productType]}生産: ${actualValue}/${condition.value}`;
              } 
              else {
                actualValue = 0;
                message = `無効な製品タイプ: ${condition.target}`;
              }
            } 
            catch (error) {
              actualValue = 0;
              message = `製品生産の取得エラー: ${error}`;
            }
          } 
          else {
            actualValue = 0;
            message = '製品生産の取得には製品タイプ（raw_material, intermediate_product, final_product, service）の指定が必要です';
          }
          break;
          
        case 'product_efficiency':
          try {
            const productStore = useProductStore.getState();
            const status = productStore.getProductSupplyDemandStatus(facilities);
            actualValue = Math.round(status.efficiency * 100); // パーセント表示
            message = `製品効率: ${actualValue}%/${condition.value}%`;
          } 
          catch (error) {
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
            } 
            else {
              actualValue = 0;
              message = '労働力配分がありません';
            }
          } 
          catch (error) {
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
        result,
        actualValue,
        message
      };
      
    } 
    catch (error) {
      console.error(`条件チェックエラー (${condition.type}):`, error);
      return {
        result: false,
        actualValue: 0,
        message: `エラー: ${error}`
      };
    }
  }

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
}

// ミッションシステムから流用する効果適用エンジン
class EffectEngine {
  static applyEffect(effect: any, gameState: any): { success: boolean; message: string; previousValue: number; newValue: number } {
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
            } 
            catch (error) {
              success = false;
              message = `派閥支持率の更新エラー: ${error}`;
            }
          }
          else {
            success = false;
            message = '派閥支持率の更新には対象派閥の指定が必要です';
          }
          break;
          
        case 'facility_unlock':
          if (effect.target) {
            try {
              const facilityStore = useFacilityStore.getState();
              facilityStore.unlockFacility(effect.target as any);
              success = true;
              message = `施設「${effect.target}」がアンロックされました`;
            } 
            catch (error) {
              success = false;
              message = `施設アンロックエラー: ${error}`;
            }
          } 
          else {
            success = false;
            message = '施設アンロックには対象施設の指定が必要です';
          }
          break;
          
        case 'bonus_multiplier':
          // TODO: ボーナス倍率の実装
          success = false;
          message = `ボーナス倍率「${effect.target}」は未実装`;
          break;
          
        default:
          success = false;
          message = `未対応の効果タイプ: ${effect.type}`;
          break;
      }
      
      return {
        success,
        message,
        previousValue,
        newValue
      };
      
    } 
    catch (error) {
      console.error(`効果適用エラー (${effect.type}):`, error);
      return {
        success: false,
        message: `エラー: ${error}`,
        previousValue: 0,
        newValue: 0
      };
    }
  }
}

// 実績ストアの作成
export const useAchievementStore = create<AchievementStore>((set, get) => ({
  // 初期状態
  achievements: [],
  
  // 実績受け取り
  claimAchievement: (id: string) => {
    const achievement = get().achievements.find(a => a.id === id);
    if (achievement && achievement.achieved && !achievement.claimed) {
      const gameState = useGameStore.getState().stats;
      
      // 各効果を適用
      achievement.effects.forEach(effect => {
        const result = EffectEngine.applyEffect(effect, gameState);
        if (result.success) {
          console.log(`実績効果適用成功: ${result.message}`);
        } 
        else {
          console.warn(`実績効果適用失敗: ${result.message}`);
        }
      });
      
      // 受け取り済みにマーク
      set(state => ({
        achievements: state.achievements.map(a =>
          a.id === id ? { ...a, claimed: true, claimedDate: gameState.date } : a
        )
      }));
      
      // 受け取り音を再生
      playCoinSound();
    }
  },

  // 実績達成判定
  updateAchievements: () => {
    const gameState = useGameStore.getState().stats;
    const facilities = useFacilityStore.getState().facilities;
    
    set(state => ({
      achievements: state.achievements.map(achievement => {
        if (achievement.achieved) return achievement;
        
        // 各条件をチェック
        const conditionResults = achievement.conditions.map(condition => 
          ConditionEngine.evaluateCondition(condition, gameState, facilities)
        );
        
        // 全ての条件が満たされているかチェック
        const allConditionsMet = conditionResults.every(result => result.result);
        
        if (allConditionsMet && !achievement.achieved) {
          console.log(`実績「${achievement.name}」を達成しました！`);
          return { 
            ...achievement, 
            achieved: true, 
            achievedDate: gameState.date 
          };
        }
        
        return achievement;
      })
    }));
  },

  // 受け取り可能な実績があるかチェック
  hasClaimableAchievements: () => {
    return get().achievements.some(a => a.achieved && !a.claimed);
  },

  // セーブ・ロード機能
  saveState: () => {
    const state = get();
    return {
      achievements: state.achievements
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.achievements) {
      set({ achievements: savedState.achievements });
    }
  },

  resetToInitial: () => {
    set({ achievements: [] });
  },

  // JSON読み込み機能
  loadAchievementsFromFile: async (filePath?: string) => {
    try {
      const result = await loadAchievementsFromJSON(filePath);
      
      if (result.success) {
        console.log(`JSONから${result.achievements.length}個の実績を読み込みました`);
        set({ achievements: result.achievements });
      } 
      else {
        console.error('実績読み込みエラー:', result.error);
        console.log('デフォルト実績を使用します');
        const defaultAchievements = getDefaultAchievements();
        set({ achievements: defaultAchievements });
      }
    } 
    catch (error) {
      console.error('実績読み込み中に予期しないエラーが発生しました:', error);
      const defaultAchievements = getDefaultAchievements();
      set({ achievements: defaultAchievements });
    }
  }
}));

// 自動登録
saveLoadRegistry.register('achievement', useAchievementStore.getState());
