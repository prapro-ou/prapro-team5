import React from 'react';

type Props = {
  onStart: () => void;
};

const StartScreen: React.FC<Props> = ({ onStart }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-[3000]">
    <h1 className="text-5xl font-bold text-white mb-8">City Sim</h1>
    <button
      onClick={onStart}
      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-2xl shadow-lg"
    >
      スタート
    </button>
  </div>
);

export default StartScreen;
