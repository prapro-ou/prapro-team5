import React from 'react';

type Props = {
  onStart: () => void;
  onShowSettings: () => void;
};

// ビル生成関数
const createBuilding = (rows: number, cols: number, width: string, height: string, margin: string) => {
  return (
    <div className="flex flex-col border-2 border-gray-600/20">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex">
          {[...Array(cols)].map((_, colIndex) => (
            <div
              key={`window-${rowIndex}-${colIndex}`}
              className={`${width} ${height} mx-1 mt-1 ${margin} transition-all duration-300 ${
                Math.random() > 0.8 
                  ? 'bg-yellow-300/80 shadow-lg shadow-yellow-200/50 glow-yellow'
                  : ''
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const StartScreen: React.FC<Props> = ({ onStart, onShowSettings }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-[2000]">
    {/* 装飾 */}
    <div className="absolute left-0 bottom-0 flex flex-col">
      {createBuilding(5, 3, 'w-6', 'h-4', 'mb-2')}
    </div>
    <div className="absolute left-30 bottom-0 flex flex-col">
      {createBuilding(8, 3, 'w-6', 'h-4', 'mb-2')}
    </div>
    <div className="absolute left-60 bottom-0 flex flex-col">
      {createBuilding(5, 6, 'w-6', 'h-4', 'mb-2')}
    </div>
    <div className="absolute right-0 bottom-0 flex flex-col">
      {createBuilding(5, 2, 'w-6', 'h-4', 'mb-2')}
    </div>
    <div className="absolute right-22 bottom-0 flex flex-col">
      {createBuilding(10, 3, 'w-6', 'h-4', 'mb-2')}
    </div>
    <div className="absolute right-52 bottom-0 flex flex-col">
      {createBuilding(7, 4, 'w-6', 'h-4', 'mb-2')}
    </div>
    {/* ロゴ */}
    <div className="bg-white shadow-lg items-center rounded-lg">
      <img src="logo.svg" alt="Titile Logo" className="w-full h-36 object-contain p-4" />
    </div>
    {/* ボタン */}
    <div className="flex flex-col items-center space-y-4 mt-12">
      <button
        onClick={onStart}
        className="border-2 border-white/20 bg-gray-500/75 hover:bg-gray-700/75 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10"
      >
        スタート
      </button>
      <button
        onClick={onShowSettings}
        className="border-2 border-white/20 bg-gray-500/75 hover:bg-gray-700/75 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10"
      >
        設定
      </button>
    </div>
  </div>
);

export default StartScreen;
