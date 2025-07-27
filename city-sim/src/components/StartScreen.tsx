import React from 'react';

type Props = {
  onStart: () => void;
  onShowSettings: () => void;
};

// ビル生成関数
const createBuilding = (rows: number, cols: number, width: string, height: string, margin: string) => {
  return (
    <div className="flex flex-col">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex">
          {[...Array(cols)].map((_, colIndex) => (
            <div
              key={`window-${rowIndex}-${colIndex}`}
              className={`${width} ${height} mx-1 ${margin} rounded-sm transition-all duration-300 ${
                Math.random() > 0.8 ? 'bg-gray-100/60' : 'bg-gray-700/40'
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
    {/* ビルの窓明かり */}
    <div className="absolute left-0 bottom-0 flex flex-col">
      <div className="flex flex-col">
        {[...Array(5)].map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex">
            {[...Array(3)].map((_, colIndex) => (
              <div
                key={`left-window-${rowIndex}-${colIndex}`}
                className={`w-6 h-4 mx-1 mb-3 transition-all duration-300 ${
                  Math.random() > 0.8 ? 'bg-gray-100/60' : 'bg-gray-700/40'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white shadow-lg items-center rounded-lg">
      <img src="logo.svg" alt="Titile Logo" className="w-full h-36 object-contain p-4" />
    </div>
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
