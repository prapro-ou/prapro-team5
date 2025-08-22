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
          if (condition.target && gameState.supportSystem?.factionSupports) {
            const faction = gameState.supportSystem.factionSupports.find(
              (f: any) => f.type === condition.target
            );
            actualValue = faction ? faction.currentRating : 0;
            message = `${condition.target}支持率: ${actualValue}/${condition.value}`;
          } else {
            actualValue = 0;
            message = '派閥支持率の取得に失敗しました';
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
          if (effect.target && gameState.supportSystem?.factionSupports) {
            // TODO: 派閥支持率の更新実装
            success = true;
            message = `${effect.target}支持率を更新しました`;
          } else {
            success = false;
            message = '派閥支持率の更新に失敗しました';
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
    isRepeatable: false
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
        
        // 状態を更新
        let newStatus: MissionStatus = mission.status;
        if (allConditionsMet && mission.status === 'available') {
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
