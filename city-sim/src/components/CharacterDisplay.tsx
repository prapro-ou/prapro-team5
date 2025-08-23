import type { 
  Character, 
  CharacterDisplayState, 
  LayerType, 
  ExpressionType, 
  LayerState,
  CharacterSelectionCallbacks 
} from '../types/character';
import { 
  LAYER_Z_INDEX, 
  LAYER_NAMES, 
  EXPRESSION_NAMES, 
  CHARACTER_DISPLAY_SIZE,
  CHARACTER_IMAGE_BASE_PATH,
  LAYER_IMAGE_PATTERNS
} from '../constants/characterConstants';

interface CharacterDisplayProps {
  character: Character;
  displayState: CharacterDisplayState;
  callbacks: CharacterSelectionCallbacks;
  className?: string;
}

export function CharacterDisplay({ 
  character, 
  displayState, 
  callbacks, 
  className = '' 
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

  // レイヤーを重ね順でソート
  const sortedLayers = Object.entries(LAYER_Z_INDEX)
    .sort(([, a], [, b]) => a - b)
    .map(([layerType]) => layerType as LayerType);

  // レイヤー表示/非表示の切り替え
  const toggleLayer = (layerType: LayerType) => {
    const currentState = displayState.layerStates[layerType];
    const newState: LayerState = currentState === 'on' ? 'off' : 'on';
    callbacks.onLayerToggle(layerType, newState);
  };

  // 表情変更
  const changeExpression = (expression: ExpressionType) => {
    callbacks.onExpressionChange(expression);
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* キャラクター表示エリア */}
      <div 
        className="relative bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden"
        style={{
          width: CHARACTER_DISPLAY_SIZE.width,
          height: CHARACTER_DISPLAY_SIZE.height
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
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-gray-500 text-center">
              <div className="text-lg font-bold mb-2">キャラクター</div>
              <div className="text-sm">レイヤーを有効にしてください</div>
            </div>
          </div>
        )}
      </div>

      {/* キャラクター情報 */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{character.name}</h3>
        <p className="text-sm text-gray-600">{character.description}</p>
      </div>

      {/* 表情選択 */}
      <div className="w-full max-w-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">表情</h4>
        <div className="grid grid-cols-3 gap-2">
          {character.expressions.map((expression) => (
            <button
              key={expression}
              onClick={() => changeExpression(expression)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                displayState.expression === expression
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {EXPRESSION_NAMES[expression]}
            </button>
          ))}
        </div>
      </div>

      {/* レイヤー表示制御 */}
      <div className="w-full max-w-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">レイヤー表示</h4>
        <div className="grid grid-cols-2 gap-2">
          {sortedLayers.map((layerType) => (
            <button
              key={layerType}
              onClick={() => toggleLayer(layerType)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                displayState.layerStates[layerType] === 'on'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {LAYER_NAMES[layerType]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
