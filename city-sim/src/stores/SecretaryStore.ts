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

// 会話メッセージの種類
export type ConversationType = 'greeting' | 'situation' | 'encouragement' | 'general';

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

// 会話メッセージ情報
export interface ConversationMessage {
  id: string;
  type: ConversationType;
  content: string;
  timestamp: number;
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
  
  // 会話管理
  conversationMessages: ConversationMessage[];
  lastConversationWeek: number;
  
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
  
  // 会話操作
  addConversationMessage: (type: ConversationType, content: string) => void;
  clearOldConversations: () => void;
  generateConversations: (gameState?: any) => void;
  
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
  
  // 季節判定と服装自動制御
  isSummerSeason: (month: number) => boolean;
  updateSeasonalClothing: (month: number) => void;
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
export const generateDynamicAdvices = (gameState: any, _economyState: any, infrastructureState: any): Advice[] => {
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

// 季節に応じた会話メッセージを取得
export const getSeasonalMessages = (month: number): Array<{ type: ConversationType; content: string }> => {
  switch (month) {
    case 1:
      return [
        { type: 'greeting', content: '新年あけましておめでとうございます！今年も都市建設を頑張りましょう！' },
        { type: 'situation', content: '寒い季節ですが、都市の建設は順調ですか？' },
        { type: 'encouragement', content: '新しい年の始まりに、都市の未来を描いてみませんか？' }
      ];
    case 2:
      return [
        { type: 'greeting', content: 'まだ寒い日が続きますね。体調管理に気をつけましょう。' },
        { type: 'situation', content: '冬の間の都市運営はいかがですか？' },
        { type: 'encouragement', content: '春に向けて、都市の準備を進めていきましょう！' }
      ];
    case 3:
      return [
        { type: 'greeting', content: '春の訪れを感じる季節になりましたね！' },
        { type: 'situation', content: '春の都市は活気づいていますか？' },
        { type: 'encouragement', content: '新しい季節の始まりに、都市の発展計画を立ててみましょう！' }
      ];
    case 4:
      return [
        { type: 'greeting', content: '桜の季節ですね。都市も春らしく彩られています。' },
        { type: 'situation', content: '春の都市建設は順調に進んでいますか？' },
        { type: 'encouragement', content: '春の暖かさと共に、都市も成長していきましょう！' }
      ];
    case 5:
      return [
        { type: 'greeting', content: '新緑の季節ですね。都市も緑に包まれています。' },
        { type: 'situation', content: '5月の都市運営はいかがですか？' },
        { type: 'encouragement', content: '緑豊かな都市を作っていきましょう！' }
      ];
    case 6:
      return [
        { type: 'greeting', content: '梅雨の季節になりましたね。都市の排水対策は大丈夫ですか？' },
        { type: 'situation', content: '雨の多い季節の都市管理は大変ですね。' },
        { type: 'encouragement', content: '梅雨明けに向けて、都市の準備を整えましょう！' }
      ];
    case 7:
      return [
        { type: 'greeting', content: '夏本番ですね！暑い季節の都市運営お疲れ様です。' },
        { type: 'situation', content: '夏の都市は活気づいていますか？' },
        { type: 'encouragement', content: '夏の暑さに負けず、都市建設を頑張りましょう！' }
      ];
    case 8:
      return [
        { type: 'greeting', content: '夏休みの季節ですね。都市も賑やかになりそうです。' },
        { type: 'situation', content: '8月の都市運営はいかがですか？' },
        { type: 'encouragement', content: '夏の思い出と共に、都市も発展していきましょう！' }
      ];
    case 9:
      return [
        { type: 'greeting', content: '秋の気配を感じる季節になりましたね。' },
        { type: 'situation', content: '秋の都市は落ち着いた雰囲気ですか？' },
        { type: 'encouragement', content: '秋の涼しさと共に、都市の計画を見直してみましょう！' }
      ];
    case 10:
      return [
        { type: 'greeting', content: '紅葉の季節ですね。都市も秋らしく彩られています。' },
        { type: 'situation', content: '10月の都市運営はいかがですか？' },
        { type: 'encouragement', content: '秋の美しさと共に、都市も成熟していきましょう！' }
      ];
    case 11:
      return [
        { type: 'greeting', content: '冬の足音が聞こえる季節になりましたね。' },
        { type: 'situation', content: '冬に向けて都市の準備は整っていますか？' },
        { type: 'encouragement', content: '年末評価に向けて、都市の総仕上げを頑張りましょう！' }
      ];
    case 12:
      return [
        { type: 'greeting', content: '一年の締めくくりの季節ですね。お疲れ様でした！' },
        { type: 'situation', content: '年末の都市運営はいかがですか？' },
        { type: 'encouragement', content: '今年の成果を振り返り、来年への準備を整えましょう！' }
      ];
    default:
      return [];
  }
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
  
  // 会話管理
  conversationMessages: [],
  lastConversationWeek: 0,
  
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
        unreadCount
      };
    });
  },
  
  dismissAdvice: (adviceId: string) => {
    set((state) => {
      const updatedAdvices = state.advices.map(advice =>
        advice.id === adviceId ? { ...advice, isDismissed: true } : advice
      );
      
      return {
        advices: updatedAdvices
      };
    });
  },
  
  clearAllAdvices: () => {
    set({ advices: [] });
  },
  
  // 会話操作
  addConversationMessage: (type: ConversationType, content: string) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now()
    };
    
    set((state) => ({
      conversationMessages: [newMessage, ...state.conversationMessages]
    }));
  },
  
  clearOldConversations: () => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    set((state) => ({
      conversationMessages: state.conversationMessages.filter(
        msg => msg.timestamp > oneWeekAgo
      )
    }));
  },
  
  generateConversations: (_gameState?: any) => {
    // ゲーム状態に基づいて会話を生成
    const messages = [
      '都市の成長が素晴らしいですね！',
      '新しい施設の建設、お疲れ様です。',
      '市民の満足度が上がっていますよ。',
      'インフラの整備が進んでいますね。'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    get().addConversationMessage('general', randomMessage);
  },
  
  // UI操作
  openSecretaryPanel: () => set({ isSecretaryPanelOpen: true }),
  closeSecretaryPanel: () => set({ isSecretaryPanelOpen: false }),
  openAdvicePanel: () => set({ isAdvicePanelOpen: true }),
  closeAdvicePanel: () => set({ isAdvicePanelOpen: false }),
  
  // アドバイス生成
  generateAdvices: (gameState?: any, _economyState?: any, _infrastructureState?: any) => {
    // ゲーム状態に基づいてアドバイスを生成
    const advices: Omit<Advice, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>[] = [];
    
    if (gameState?.population < 1000) {
      advices.push({
        type: 'population',
        priority: 'medium',
        title: '人口増加の提案',
        message: '住宅区画を増やすことで人口を増やすことができます。',
        suggestion: '道路に接続された住宅区画を建設してみてください。'
      });
    }
    
    if (gameState?.satisfaction < 50) {
      advices.push({
        type: 'satisfaction',
        priority: 'high',
        title: '満足度向上の提案',
        message: '市民の満足度が低下しています。',
        suggestion: '公園の建設や道路の整備を検討してください。'
      });
    }
    
    advices.forEach(advice => get().addAdvice(advice));
  },
  
  generatePeriodicAdvices: (gameState: any, economyState: any, infrastructureState: any) => {
    // 定期的なアドバイス生成
    const currentWeek = gameState?.date?.week || 0;
    const lastGeneration = get().lastAdviceGenerationWeek;
    
    if (currentWeek > lastGeneration) {
      get().generateAdvices(gameState, economyState, infrastructureState);
      set({ lastAdviceGenerationWeek: currentWeek });
    }
  },
  
  // セーブ・ロード
  saveState: () => {
    const state = get();
    return {
      selectedCharacter: state.selectedCharacter,
      characterDisplayState: state.characterDisplayState,
      advices: state.advices,
      conversationMessages: state.conversationMessages,
      lastAdviceGenerationWeek: state.lastAdviceGenerationWeek,
      lastConversationWeek: state.lastConversationWeek
    };
  },
  
  loadState: (savedState: any) => {
    set({
      selectedCharacter: savedState.selectedCharacter || SAMPLE_CHARACTERS[0],
      characterDisplayState: savedState.characterDisplayState || {
        characterId: SAMPLE_CHARACTERS[0].id,
        expression: DEFAULT_EXPRESSION,
        layerStates: DEFAULT_LAYER_STATES
      },
      advices: savedState.advices || generateDefaultAdvices(),
      conversationMessages: savedState.conversationMessages || [],
      lastAdviceGenerationWeek: savedState.lastAdviceGenerationWeek || 0,
      lastConversationWeek: savedState.lastConversationWeek || 0
    });
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
      conversationMessages: [],
      lastAdviceGenerationWeek: 0,
      lastConversationWeek: 0,
      isSecretaryPanelOpen: false,
      isAdvicePanelOpen: false
    });
  },
  
  // 季節判定と服装自動制御
  isSummerSeason: (month: number) => {
    // 5,6,7,8,9月を夏シーズンとして判定
    return month >= 5 && month <= 9;
  },
  
  updateSeasonalClothing: (month: number) => {
    const isSummer = get().isSummerSeason(month);
    
    set((state) => ({
      characterDisplayState: {
        ...state.characterDisplayState,
        layerStates: {
          ...state.characterDisplayState.layerStates,
          ribbon: isSummer ? 'off' : 'on',
          jacket: isSummer ? 'off' : 'on' // 夏はジャケットを外す、冬は着る
        }
      }
    }));
    
    console.log(`Seasonal clothing updated: ${isSummer ? 'Summer (jacket off)' : 'Winter (jacket on)'} for month ${month}`);
  }
}));
