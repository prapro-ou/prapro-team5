import React from 'react';

type Props = {
  onStart: () => void;
  onShowSettings: () => void;
};

const StartScreen: React.FC<Props> = ({ onStart, onShowSettings }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-[2000]">
    <div className="bg-white shadow-lg items-center rounded-lg">
      <img src="logo.svg" alt="Titile Logo" className="w-full h-36 object-contain p-4" />
    </div>
    <div className="flex flex-col items-center space-y-4 mt-12">
      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48"
      >
        スタート
      </button>
      <button
        onClick={onShowSettings}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48"
      >
        設定
      </button>
    </div>
  </div>
);

export default StartScreen;
