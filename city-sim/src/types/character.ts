// 表情の種類
export type ExpressionType = 
  | 'normal'      // 通常
  | 'happy'       // 嬉しい
  | 'serious'     // 真剣
  | 'worried'     // 心配
  | 'surprised'   // 驚き
  | 'thinking';   // 考え中

// レイヤータイプ
export type LayerType = 
  | 'kemomimi'    // ケモミミ
  | 'hair'        // 髪
  | 'body'        // 身体（ベース）
  | 'face'        // 顔パーツ
  | 'jacket'      // ジャケット
  | 'ribbon'      // リボン
  | 'tail';       // しっぽ

// 各レイヤーの状態
export type LayerState = 
  | 'on'          // 表示
  | 'off';        // 非表示

// キャラクターの基本情報
export interface Character {
  id: string;                    // 一意識別子
  name: string;                  // キャラクター名
  description: string;           // 説明
  baseImage: string;             // ベース画像のパス
  expressions: ExpressionType[]; // 利用可能な表情
  hasJacket: boolean;            // ジャケット機能の有無
}

// 現在のキャラクター表示状態
export interface CharacterDisplayState {
  characterId: string;           // 選択中のキャラクターID
  expression: ExpressionType;    // 現在の表情
  layerStates: Record<LayerType, LayerState>; // 各レイヤーの表示状態
}

// レイヤー情報
export interface CharacterLayer {
  id: string;                    // レイヤーID
  type: LayerType;               // レイヤータイプ
  imagePath: string;             // 画像パス
  zIndex: number;                // 重ね順
  isVisible: boolean;            // 表示/非表示
}

// キャラクターの完全な表示設定
export interface CharacterRenderConfig {
  character: Character;
  displayState: CharacterDisplayState;
  layers: CharacterLayer[];
}

// キャラクター選択時のコールバック
export interface CharacterSelectionCallbacks {
  onExpressionChange: (expression: ExpressionType) => void;
  onLayerToggle: (layerType: LayerType, state: LayerState) => void;
  onCharacterChange: (characterId: string) => void;
}
