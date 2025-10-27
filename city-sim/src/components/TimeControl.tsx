import { TbPlayerPause, TbPlayerPlay, TbPlayerStop, TbClock } from 'react-icons/tb';
import { useTimeControlStore } from '../stores/TimeControlStore';
import { useUIStore } from '../stores/UIStore';
import { useEffect } from 'react';

export function TimeControl() {
  const { 
    isPaused, 
    speedMultiplier, 
    togglePause, 
    setSpeed,
    checkModalState
  } = useTimeControlStore();
  
  // UI状態を監視
  const uiState = useUIStore();

  const speedOptions = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' }
  ];

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Spaceキーで一時停止/再開
      if (event.code === 'Space') {
        event.preventDefault(); // ページスクロールを防ぐ
        togglePause();
      }
      
      // 数字キーで速度変更
      if (event.code === 'Digit1') {
        setSpeed(1);
      } 
      else if (event.code === 'Digit2') {
        setSpeed(2);
      } 
      else if (event.code === 'Digit4') {
        setSpeed(4);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [togglePause, setSpeed]);

  // モーダル状態の変更を監視して自動停止/再開
  useEffect(() => {
    checkModalState();
  }, [
    uiState.isSettingsOpen,
    uiState.isCreditsOpen,
    uiState.isSaveLoadOpen,
    checkModalState
  ]);

  return (
    <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-1 border border-gray-600 shadow-md">
      {/* 現在の状態表示 */}
      <div className="flex items-center gap-2 text-sm">
        <TbClock className="text-gray-400" size={16} />
        <span className="text-gray-300">速度:</span>
        <span className="font-medium text-gray-200">{speedMultiplier}x</span>
      </div>

      {/* 一時停止/再開ボタン */}
      <button
        onClick={togglePause}
        className={`p-2.5 rounded-lg transition-all duration-200 ${
          isPaused 
            ? 'bg-emerald-700 hover:bg-emerald-800 text-emerald-100' 
            : 'bg-rose-700 hover:bg-rose-800 text-rose-100'
        }`}
        title={isPaused ? 'ゲームを再開 (Space)' : 'ゲームを一時停止 (Space)'}
      >
        {isPaused ? <TbPlayerPlay size={16} /> : <TbPlayerPause size={16} />}
      </button>

      {/* 速度選択ボタン */}
      <div className="flex items-center gap-1.5">
        {speedOptions.map((option) => {
          const isActive = speedMultiplier === option.value;
          const isDisabled = isPaused; // 一時停止中は速度変更を無効化
          
          return (
            <button
              key={option.value}
              onClick={() => !isDisabled && setSpeed(option.value)}
              disabled={isDisabled}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all duration-200 ${
                isActive
                  ? 'bg-slate-600 text-slate-100'
                  : isDisabled
                  ? 'bg-gray-500 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-gray-100'
              }`}
              title={`速度: ${option.label}${isDisabled ? ' (一時停止中は変更不可)' : ''} (${option.value}キー)`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
} 