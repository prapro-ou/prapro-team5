import type { 
  Character, 
  CharacterDisplayState, 
  LayerType, 
  // ExpressionType, 
  // LayerState,
  CharacterSelectionCallbacks 
} from '../types/character';
import { 
  LAYER_Z_INDEX, 
  LAYER_NAMES, 
  CHARACTER_DISPLAY_SIZE,
  CHARACTER_IMAGE_BASE_PATH,
  LAYER_IMAGE_PATTERNS
} from '../constants/characterConstants';

interface CharacterDisplayProps {
  character: Character;
  displayState: CharacterDisplayState;
  callbacks: CharacterSelectionCallbacks;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: { width: number; height: number };
}

export function CharacterDisplay({ 
  character, 
  displayState, 
  // callbacks, 
  className = '',
  size = 'medium',
  customSize
}: CharacterDisplayProps) {
  
  // レイヤー画像のパスを生成
  const getLayerImagePath = (layerType: LayerType): string => {
    const basePath = CHARACTER_IMAGE_BASE_PATH;
    const characterId = character.id;
    
    if (layerType === 'face') {
      // 顔パーツは表情によって変わる
      return `${basePath}/${characterId}/face_${displayState.expression}.png`;
    }
    
    const fileName = LAYER_IMAGE_PATTERNS[layerType];
    return `${basePath}/${characterId}/${fileName}`;
  };

  // サイズ設定を取得
  const getDisplaySize = () => {
    if (size === 'custom' && customSize) {
      return customSize;
    }
    
    switch (size) {
      case 'small':
        return { width: 128, height: 128 };
      case 'medium':
        return { width: 192, height: 192 };
      case 'large':
        return { width: 512, height: 512 };
      default:
        return CHARACTER_DISPLAY_SIZE;
    }
  };

  const displaySize = getDisplaySize();

  // レイヤーを重ね順でソート
  const sortedLayers = Object.entries(LAYER_Z_INDEX)
    .sort(([, a], [, b]) => a - b)
    .map(([layerType]) => layerType as LayerType);

  // レイヤー表示/非表示の切り替え
	//   const toggleLayer = (layerType: LayerType) => {
	//     const currentState = displayState.layerStates[layerType];
	//     const newState: LayerState = currentState === 'on' ? 'off' : 'on';
	//     callbacks.onLayerToggle(layerType, newState);
	//   };

  // 表情変更
  // const changeExpression = (expression: ExpressionType) => {
  //   callbacks.onExpressionChange(expression);
  // };

  return (
    <div 
      className={`relative ${className}`}
      style={{
        width: displaySize.width,
        height: displaySize.height
      }}
    >
      {/* レイヤー重ね合わせ表示 */}
      {sortedLayers.map((layerType) => {
        const isVisible = displayState.layerStates[layerType] === 'on';
        const zIndex = LAYER_Z_INDEX[layerType];
        
        if (!isVisible) return null;
        
        return (
          <div
            key={layerType}
            className="absolute inset-0"
            style={{ zIndex }}
          >
            <img
              src={getLayerImagePath(layerType)}
              alt={`${LAYER_NAMES[layerType]} - ${character.name}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                // 画像読み込みエラー時の処理
                console.warn(`Failed to load image for layer: ${layerType}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );
      })}
      
      {/* 画像読み込み中の表示 */}
      {Object.values(displayState.layerStates).every(state => state === 'off') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <div className="text-lg font-bold mb-2">キャラクター</div>
            <div className="text-sm">レイヤーを有効にしてください</div>
          </div>
        </div>
      )}
    </div>
  );
}
