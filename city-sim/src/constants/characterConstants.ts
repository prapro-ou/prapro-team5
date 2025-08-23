import type { Character, LayerType, ExpressionType, LayerState } from '../types/character';

// レイヤーの重ね順（z-index）
export const LAYER_Z_INDEX: Record<LayerType, number> = {
  kemomimi: 7,    // ケモミミ（最前面）
  hair: 6,        // 髪
  face: 5,        // 顔パーツ
  ribbon: 5,      // リボン
  jacket: 5,      // ジャケット
  body: 4,        // 身体（ベース）
  tail: 1         // しっぽ（最背面）
};

// デフォルトのレイヤー表示状態
export const DEFAULT_LAYER_STATES: Record<LayerType, LayerState> = {
  kemomimi: 'on',
  body: 'on',
  hair: 'on',
  face: 'on',
  jacket: 'on',
  ribbon: 'on',
  tail: 'on'
};

// デフォルトの表情
export const DEFAULT_EXPRESSION: ExpressionType = 'normal';

// 利用可能な表情の一覧
export const AVAILABLE_EXPRESSIONS: ExpressionType[] = [
  'normal',
  'happy',
  'serious',
  'worried',
  'surprised',
  'thinking'
];

// 秘書データ
export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'secretary_0',
    name: '秘書ちゃん',
    description: 'あなたの個人秘書兼都市開発アドバイザー。',
    baseImage: 'images/characters/secretary_0/body.png',
    expressions: ['normal', 'happy', 'serious', 'worried'],
    hasJacket: true
  }
];

// レイヤー名の日本語表示
export const LAYER_NAMES: Record<LayerType, string> = {
  kemomimi: 'ケモミミ',
  body: '身体',
  hair: '髪',
  face: '顔',
  jacket: 'ジャケット',
  ribbon: 'リボン',
  tail: 'しっぽ'
};

// 表情名の日本語表示
export const EXPRESSION_NAMES: Record<ExpressionType, string> = {
  normal: '通常',
  happy: '嬉しい',
  serious: '真剣',
  worried: '心配',
  surprised: '驚き',
  thinking: '考え中'
};

// キャラクター表示のデフォルトサイズ
export const CHARACTER_DISPLAY_SIZE = {
  width: 512,
  height: 512
};

// レイヤー画像のベースパス
export const CHARACTER_IMAGE_BASE_PATH = 'images/characters';

// レイヤー別の画像ファイル名パターン
export const LAYER_IMAGE_PATTERNS: Record<LayerType, string> = {
  kemomimi: 'kemomimi.png',
  body: 'body.png',
  hair: 'hair.png',
  face: 'face_{expression}.png',  // 表情によって変わる
  jacket: 'jacket.png',
  ribbon: 'ribbon.png',
  tail: 'tail.png'
};
