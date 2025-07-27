import React, { useState, useEffect, useMemo } from 'react';

type Props = {
  onStart: () => void;
  onShowSettings: () => void;
};

// ビル生成関数
const createBuilding = (rows: number, cols: number, width: string, height: string, margin: string, isStart: boolean = false) => {
  return (
    <div className="flex flex-col border-2 border-gray-600/20">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex">
          {[...Array(cols)].map((_, colIndex) => (
            <div
            key={`window-${rowIndex}-${colIndex}`}
            className={`${width} ${height} mx-1 mt-1 ${margin} transition-all duration-300 ${
              isStart
              ? 'bg-gray-700/30'
              : Math.random() > 0.8
                ? 'bg-yellow-300/80 shadow-lg shadow-yellow-200/50 glow-yellow animate-pulse'
                : ''
            }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const StartScreen: React.FC<Props> = ({ onStart, onShowSettings }) => {
  const [logoVisible, setLogoVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);

  // アニメーション用
  useEffect(() => {
    // ロゴを0.5秒後に表示
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 500);

    // ボタンを1.5秒後に表示
    const buttonTimer = setTimeout(() => {
      setButtonsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const buildingWindows = useMemo(
    () =>
      Array.from({ length: 5 }).map(() => ({
        rows: 4 + Math.floor(Math.random() * 7),
        cols: 2 + Math.floor(Math.random() * 5), 
      })),
    []
  );

  // スタートアニメーション
  const handleStartClick = () => {
    setOverlayVisible(true);
    setTimeout(() => {
      setOverlayActive(true);
    }, 50);

    setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        onStart();
      }, 800);
    }, 3000); // アニメーション時間
  };

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-[2000]${(overlayVisible || isTransitioning) ? ' cursor-none' : ''}`}
    >
      {/* スタートアニメーション用オーバーレイ */}
      {overlayVisible && (
        <div
          className="fixed inset-0 z-[3000] pointer-events-none transition-all duration-[2500ms]"
          style={{
            background: 'linear-gradient(to bottom, #fef9c3 0%, #fcd34d 40%, #60a5fa 100%)',
            opacity: overlayActive ? 1 : 0,
            transition: 'opacity 2.5s',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* 装飾 */}
      <div className="absolute left-0 bottom-0 flex flex-col">
        {createBuilding(5, 3, 'w-6', 'h-4', 'mb-2', overlayVisible)}
      </div>
      <div className="absolute left-30 bottom-0 flex flex-col">
        {createBuilding(8, 3, 'w-6', 'h-4', 'mb-2', overlayVisible)}
      </div>
      <div className="absolute left-60 bottom-0 flex flex-col">
        {createBuilding(5, 6, 'w-6', 'h-4', 'mb-2', overlayVisible)}
      </div>
      <div className="absolute right-0 bottom-0 flex flex-col">
        {createBuilding(5, 2, 'w-6', 'h-4', 'mb-2', overlayVisible)}
      </div>
      <div className="absolute right-22 bottom-0 flex flex-col">
        {createBuilding(10, 3, 'w-6', 'h-4', 'mb-2', overlayVisible)}
      </div>
      <div className="absolute right-52 bottom-0 flex flex-col">
        {createBuilding(7, 4, 'w-6', 'h-4', 'mb-2', overlayVisible)}
      </div>

      {/* ロゴ */}
      <div className="bg-white shadow-lg items-center rounded-lg overflow-hidden">
        <div 
          className={`transition-all duration-5000 ease-out ${
            logoVisible 
              ? 'transform translate-y-0' 
              : 'transform translate-y-full'
          }`}
        >
          <img src="logo.svg" alt="Titile Logo" className="w-full h-36 object-contain p-4" />
        </div>
      </div>

      {/* ボタン */}
      <div 
        className={`flex flex-col items-center space-y-4 mt-12 transition-all duration-3000 ease-out ${
          buttonsVisible 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform translate-y-full opacity-0'
        }`}
      >
        <button
          onClick={handleStartClick}
          disabled={isTransitioning}
          className="border-2 border-white/20 bg-gray-500/75 hover:bg-gray-700/75 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          スタート
        </button>
        <button
          onClick={onShowSettings}
          disabled={isTransitioning}
          className="border-2 border-white/20 bg-gray-500/75 hover:bg-gray-700/75 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          設定
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
