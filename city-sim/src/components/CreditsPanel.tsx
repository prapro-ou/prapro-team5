import React from 'react';
import { TbX } from 'react-icons/tb';

// クレジットパネルが受け取るプロパティの型定義
interface CreditsPanelProps {
  onClose: () => void;
}

// クレジットに表示するデータ
const creditsData = [
  { role: 'ディレクター', name: 'あなた' },
  { role: 'プログラム', name: 'あなた' },
  { role: 'デザイン', name: 'あなた' },
  { role: 'サウンド', name: 'Gemini' },
  { role: 'スペシャルサンクス', name: 'プレイヤーの皆さん' },
];

/**
 * クレジット（スタッフロール）を表示するパネルコンポーネント．
 */
export const CreditsPanel: React.FC<CreditsPanelProps> = ({ onClose }) => {
  return (
    // 画面全体を覆う背景レイヤー
    <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center" onClick={onClose}>
      {/* パネル本体 */}
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md relative border border-gray-600 text-white"
        onClick={(e) => e.stopPropagation()} // パネル内クリックで閉じないようにする
      >
        {/* 閉じるボタン */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <TbX size={24} />
        </button>

        {/* タイトル */}
        <h2 className="text-3xl font-bold mb-8 text-center">クレジット</h2>

        {/* スタッフリスト */}
        <div className="space-y-6 text-center">
          {creditsData.map((credit, index) => (
            <div key={index}>
              <p className="text-lg text-gray-400">{credit.role}</p>
              <p className="text-2xl font-semibold">{credit.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};