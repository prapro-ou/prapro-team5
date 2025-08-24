import { create } from 'zustand';
import type { 
  Character, 
  CharacterDisplayState, 
  ExpressionType, 
  LayerType, 
  LayerState 
} from '../types/character';
import { 
  SAMPLE_CHARACTERS, 
  DEFAULT_LAYER_STATES, 
  DEFAULT_EXPRESSION 
} from '../constants/characterConstants';

// アドバイスの種類
export type AdviceType = 
  | 'economy'        // 経済関連
  | 'infrastructure' // インフラ関連
  | 'population'     // 人口関連
  | 'satisfaction'   // 満足度関連
  | 'mission'        // ミッション関連
  | 'general';       // 一般的なアドバイス

// アドバイスの優先度
export type AdvicePriority = 'low' | 'medium' | 'high' | 'urgent';

// アドバイス情報
export interface Advice {
  id: string;
  type: AdviceType;
  priority: AdvicePriority;
  title: string;
  message: string;
  suggestion?: string;        // 具体的な提案
  timestamp: number;          // 生成時刻
  isRead: boolean;            // 既読フラグ
  isDismissed: boolean;       // 却下フラグ
}

// 秘書ストアのインターフェース
interface SecretaryStore {
  // キャラクター管理
  selectedCharacter: Character;
  characterDisplayState: CharacterDisplayState;
  
  // アドバイス管理
  advices: Advice[];
  unreadAdviceCount: number;
  lastAdviceGenerationWeek: number;
  
  // UI状態
  isSecretaryPanelOpen: boolean;
  isAdvicePanelOpen: boolean;
  
  // キャラクター操作
  changeExpression: (expression: ExpressionType) => void;
  toggleLayer: (layerType: LayerType) => void;
  changeCharacter: (characterId: string) => void;
  
  // アドバイス操作
  addAdvice: (advice: Omit<Advice, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>) => void;
  markAdviceAsRead: (adviceId: string) => void;
  dismissAdvice: (adviceId: string) => void;
  clearAllAdvices: () => void;
  
  // UI操作
  openSecretaryPanel: () => void;
  closeSecretaryPanel: () => void;
  openAdvicePanel: () => void;
  closeAdvicePanel: () => void;
  
  // アドバイス生成
  generateAdvices: (gameState?: any, economyState?: any, infrastructureState?: any) => void;
  generatePeriodicAdvices: (gameState: any, economyState: any, infrastructureState: any) => void;
  
  // セーブ・ロード
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

// アドバイス生成ロジック
const generateAdvice = (
  type: AdviceType, 
  priority: AdvicePriority, 
  title: string, 
  message: string, 
  suggestion?: string
): Advice => ({
  id: `advice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  priority,
  title,
  message,
  suggestion,
  timestamp: Date.now(),
  isRead: false,
  isDismissed: false
});

// 動的アドバイス生成ロジック
const generateDynamicAdvices = (gameState: any, _economyState: any, infrastructureState: any): Advice[] => {
  const advices: Advice[] = [];
  
  // 経済状況の分析
  if (gameState.stats.monthlyBalance.balance < 0) {
    advices.push(generateAdvice(
      'economy',
      'high',
      '財政危機の警告',
      '月次収支が赤字になっています。',
      '税率の見直しや施設の維持費削減を検討してください。'
    ));
  }
  
  if (gameState.stats.money < 10000) {
    advices.push(generateAdvice(
      'economy',
      'urgent',
      '資金不足の危機',
      '資金が10,000を下回っています。',
      '緊急の収入源確保や支出削減が必要です。'
    ));
  }
  
  // 人口・満足度の分析
  if (gameState.stats.population < 100) {
    advices.push(generateAdvice(
      'population',
      'medium',
      '人口増加の提案',
      '人口が少ない状態です。',
      '住宅施設の建設や市民の満足度向上を検討してください。'
    ));
  }
  
  // インフラ状況の分析
  if (infrastructureState) {
    const waterShortage = infrastructureState.getInfrastructureShortage?.()?.water || 0;
    const electricityShortage = infrastructureState.getInfrastructureShortage?.()?.electricity || 0;
    
    if (waterShortage > 0) {
      advices.push(generateAdvice(
        'infrastructure',
        'high',
        '上水道不足の警告',
        '上水道の供給が需要を下回っています。',
        '上水道施設の増設や節水対策を検討してください。'
      ));
    }
    
    if (electricityShortage > 0) {
      advices.push(generateAdvice(
        'infrastructure',
        'high',
        '電力不足の警告',
        '電力の供給が需要を下回っています。',
        '発電所の増設や節電対策を検討してください。'
      ));
    }
  }
  
  // 労働状況の分析
  const workforce = gameState.stats.workforceAllocations || [];
  const totalWorkforce = workforce.reduce((sum: number, w: any) => sum + w.assignedWorkforce, 0);
  const potentialWorkforce = Math.floor(gameState.stats.population * 0.6);
  
  if (totalWorkforce < potentialWorkforce * 0.8) {
    advices.push(generateAdvice(
      'economy',
      'medium',
      '雇用機会の創出',
      '多くの市民が求職中です。',
      '商業・工業施設の建設で雇用を創出してください。'
    ));
  }
  
  // ゲーム進行に応じたチュートリアルアドバイス
  const totalWeeks = gameState.stats.date.totalWeeks;
  
  if (totalWeeks === 1) {
    advices.push(generateAdvice(
      'general',
      'low',
      '最初の一歩',
      '都市建設の第一歩を踏み出しました！',
      'まずは道路と住宅から始めて、小さな街を作ってみましょう。'
    ));
  }
  
  if (totalWeeks === 4) {
    advices.push(generateAdvice(
      'general',
      'low',
      '一ヶ月経過',
      '都市建設を始めて1ヶ月が経ちました。',
      '統計画面で現在の状況を確認し、次のステップを計画しましょう。'
    ));
  }
  
  if (totalWeeks === 8) {
    advices.push(generateAdvice(
      'general',
      'low',
      '2ヶ月の節目',
      '都市建設を始めて2ヶ月が経ちました。',
      'インフラの整備状況を見直し、より効率的な都市計画を検討してください。'
    ));
  }
  
  // 初回建設時のアドバイス
  if (gameState.stats.facilities && gameState.stats.facilities.length === 1) {
    advices.push(generateAdvice(
      'general',
      'low',
      '初回建設完了',
      '最初の施設の建設が完了しました！',
      '施設は道路に接続されていることを確認し、必要に応じて道路を延長してください。'
    ));
  }
  
  // ミッション関連
  if (gameState.stats.date.month === 11 && gameState.stats.date.week === 1) {
    advices.push(generateAdvice(
      'mission',
      'high',
      '年末評価の準備',
      '来月は年末評価です。',
      '都市の総合的な状況を確認し、評価に備えてください。'
    ));
  }
  
  return advices;
};

// デフォルトのアドバイス
const generateDefaultAdvices = (): Advice[] => [
  generateAdvice(
    'general',
    'medium',
    '秘書について',
    '私はいつでもここにいます。都市運営について何でもお聞きください！',
    'ここでは都市開発についてのアドバイスを受けることができます。'
  ),
  generateAdvice(
    'general',
    'low',
    'ゲームの基本操作',
    'マウスでグリッドをクリックして施設を建設できます。',
    '施設の種類は左側のパネルから選択してください。'
  ),
  generateAdvice(
    'general',
    'low',
    '施設の配置のコツ',
    '施設は道路に接続する必要があります。',
    '道路を先に建設してから施設を配置すると効率的です。'
  ),
  generateAdvice(
    'economy',
    'low',
    '経済状況の監視',
    '現在の経済状況を定期的にチェックすることをお勧めします。',
    '統計画面の経済タブで収支状況を確認してください。'
  ),
  generateAdvice(
    'economy',
    'low',
    '初期資金の使い方',
    '初期資金は限られています。',
    'まずは基本的なインフラ（道路、住宅）から始めることをお勧めします。'
  ),
  generateAdvice(
    'infrastructure',
    'low',
    'インフラの重要性',
    '上水道と電気は都市の発展に不可欠です。',
    '人口が増える前に、十分なインフラ容量を確保してください。'
  ),
  generateAdvice(
    'population',
    'low',
    '人口増加の仕組み',
    '住宅施設を建設すると人口が増加します。',
    'ただし、インフラや雇用が追いつかないと人口流出の原因になります。'
  ),
  generateAdvice(
    'satisfaction',
    'low',
    '市民の満足度',
    '公園や商業施設は市民の満足度を向上させます。',
    '満足度が高いと人口増加や税収向上につながります。'
  ),
  generateAdvice(
    'mission',
    'low',
    'ミッションについて',
    'ミッションを達成すると報酬がもらえます。',
    '左側のミッションパネルで現在のミッションを確認してください。'
  ),
  generateAdvice(
    'general',
    'low',
    '時間の進行',
    '時間は自動的に進行しますが、一時停止も可能です。',
    '右上の時間コントロールで速度を調整できます。'
  )
];

export const useSecretaryStore = create<SecretaryStore>((set, get) => ({
  // 初期状態
  selectedCharacter: SAMPLE_CHARACTERS[0],
  characterDisplayState: {
    characterId: SAMPLE_CHARACTERS[0].id,
    expression: DEFAULT_EXPRESSION,
    layerStates: DEFAULT_LAYER_STATES
  },
  
  advices: generateDefaultAdvices(),
  unreadAdviceCount: 12,
  lastAdviceGenerationWeek: 0,
  
  isSecretaryPanelOpen: false,
  isAdvicePanelOpen: false,
  
  // キャラクター操作
  changeExpression: (expression: ExpressionType) => {
    set((state) => ({
      characterDisplayState: {
        ...state.characterDisplayState,
        expression
      }
    }));
  },
  
  toggleLayer: (layerType: LayerType) => {
    set((state) => {
      const currentState = state.characterDisplayState.layerStates[layerType];
      const newState: LayerState = currentState === 'on' ? 'off' : 'on';
      
      return {
        characterDisplayState: {
          ...state.characterDisplayState,
          layerStates: {
            ...state.characterDisplayState.layerStates,
            [layerType]: newState
          }
        }
      };
    });
  },
  
  changeCharacter: (characterId: string) => {
    const character = SAMPLE_CHARACTERS.find(c => c.id === characterId);
    if (character) {
      set({
        selectedCharacter: character,
        characterDisplayState: {
          characterId: character.id,
          expression: DEFAULT_EXPRESSION,
          layerStates: DEFAULT_LAYER_STATES
        }
      });
    }
  },
  
  // アドバイス操作
  addAdvice: (adviceData) => {
    const newAdvice = generateAdvice(
      adviceData.type,
      adviceData.priority,
      adviceData.title,
      adviceData.message,
      adviceData.suggestion
    );
    
    set((state) => ({
      advices: [newAdvice, ...state.advices],
      unreadAdviceCount: state.unreadAdviceCount + 1
    }));
  },
  
  markAdviceAsRead: (adviceId: string) => {
    set((state) => {
      const updatedAdvices = state.advices.map(advice =>
        advice.id === adviceId ? { ...advice, isRead: true } : advice
      );
      
      const unreadCount = updatedAdvices.filter(advice => !advice.isRead).length;
      
      return {
        advices: updatedAdvices,
        unreadAdviceCount: unreadCount
      };
    });
  },
  
  dismissAdvice: (adviceId: string) => {
    set((state) => {
      const updatedAdvices = state.advices.map(advice =>
        advice.id === adviceId ? { ...advice, isDismissed: true } : advice
      );
      
      return { advices: updatedAdvices };
    });
  },
  
  clearAllAdvices: () => {
    set({
      advices: [],
      unreadAdviceCount: 0
    });
  },
  
  // UI操作
  openSecretaryPanel: () => set({ isSecretaryPanelOpen: true }),
  closeSecretaryPanel: () => set({ isSecretaryPanelOpen: false }),
  openAdvicePanel: () => set({ isAdvicePanelOpen: true }),
  closeAdvicePanel: () => set({ isAdvicePanelOpen: false }),
  
  // アドバイス生成
  generateAdvices: (gameState?: any, economyState?: any, infrastructureState?: any) => {
    if (gameState && economyState && infrastructureState) {
      // 動的アドバイスを生成
      const dynamicAdvices = generateDynamicAdvices(gameState, economyState, infrastructureState);
      
      // 既存のアドバイスと重複しないようにフィルタリング
      const existingAdviceTitles = get().advices.map(advice => advice.title);
      const newAdvices = dynamicAdvices.filter(advice => 
        !existingAdviceTitles.includes(advice.title)
      );
      
      if (newAdvices.length > 0) {
        set((state) => ({
          advices: [...newAdvices, ...state.advices],
          unreadAdviceCount: state.unreadAdviceCount + newAdvices.length
        }));
        
        console.log(`Generated ${newAdvices.length} new dynamic advices`);
      }
    } else {
      console.log('Game state not provided, skipping dynamic advice generation');
    }
  },
  
  // 定期的なアドバイス生成（ゲーム進行時などに呼び出し）
  generatePeriodicAdvices: (gameState: any, economyState: any, infrastructureState: any) => {
    // 週次でアドバイスを生成
    const currentWeek = gameState.stats.date.totalWeeks;
    const lastAdviceWeek = get().lastAdviceGenerationWeek || 0;
    
    if (currentWeek > lastAdviceWeek) {
      get().generateAdvices(gameState, economyState, infrastructureState);
      set((state) => ({ ...state, lastAdviceGenerationWeek: currentWeek }));
    }
  },
  
  // セーブ・ロード
  saveState: () => {
    const state = get();
    return {
      selectedCharacterId: state.selectedCharacter.id,
      characterDisplayState: state.characterDisplayState,
      advices: state.advices,
      unreadAdviceCount: state.unreadAdviceCount,
      lastAdviceGenerationWeek: state.lastAdviceGenerationWeek
    };
  },
  
  loadState: (savedState: any) => {
    if (savedState) {
      const character = SAMPLE_CHARACTERS.find(c => c.id === savedState.selectedCharacterId) || SAMPLE_CHARACTERS[0];
      
      set({
        selectedCharacter: character,
        characterDisplayState: savedState.characterDisplayState || {
          characterId: character.id,
          expression: DEFAULT_EXPRESSION,
          layerStates: DEFAULT_LAYER_STATES
        },
        advices: savedState.advices || [],
        unreadAdviceCount: savedState.unreadAdviceCount || 0,
        lastAdviceGenerationWeek: savedState.lastAdviceGenerationWeek || 0
      });
    }
  },
  
  resetToInitial: () => {
    set({
      selectedCharacter: SAMPLE_CHARACTERS[0],
      characterDisplayState: {
        characterId: SAMPLE_CHARACTERS[0].id,
        expression: DEFAULT_EXPRESSION,
        layerStates: DEFAULT_LAYER_STATES
      },
      advices: generateDefaultAdvices(),
      unreadAdviceCount: 12,
      lastAdviceGenerationWeek: 0,
      isSecretaryPanelOpen: false,
      isAdvicePanelOpen: false
    });
  }
}));
