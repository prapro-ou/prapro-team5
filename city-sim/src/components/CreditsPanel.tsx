import React from 'react';
import { TbX } from 'react-icons/tb';

// クレジットパネルが受け取るプロパティの型定義
interface CreditsPanelProps {
  onClose: () => void;
}

// クレジットに表示するデータ
const creditsData = [
  { role: 'プロデューサー', name: '橋本 旺都' },
  { role: 'ディレクター', name: '遠田 光佑' },
  { role: 'プログラム', name: '遠田 光佑,中村 悠一,黒杉 太稀' },
  { role: '施設イラスト', name: '濱崎 蒼平' },
  { role: 'BGM', bgmNames: ['Morning Glory', 'to the Air', 'Precious Thoughts'], author: 'shimtone', authorUrl: 'https://dova-s.jp/_contents/author/profile295.html' },
  { role: 'SE', name: '小森平様', authorUrl: 'https://taira-komori.net/' },
  { role: 'スペシャルサンクス', name: 'プレイヤーの皆さん' },
];

/**
 * クレジット（スタッフロール）を表示するパネルコンポーネント．
 */
export const CreditsPanel: React.FC<CreditsPanelProps> = ({ onClose }) => {
  return (
    // 画面全体を覆う背景レイヤー
    <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4" onClick={onClose}>
      {/* パネル本体 */}
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm max-h-[80vh] relative border border-gray-600 text-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // パネル内クリックで閉じないようにする
      >
        {/* 閉じるボタン */}
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors z-10"
        >
          <TbX size={20} />
        </button>

        {/* タイトル */}
        <h2 className="text-2xl font-bold mb-4 text-center flex-shrink-0">クレジット</h2>

        {/* スタッフリスト - スクロール可能 */}
        <div className="space-y-2 text-center overflow-y-auto flex-1 pr-2">
          {creditsData.map((credit, index) => (
            <div key={index} className="py-1">
              <p className="text-sm text-gray-400">{credit.role}</p>
              {credit.role === 'BGM' ? (
                <>
                  <div className="mb-1">
                    {Array.isArray(credit.bgmNames)
                      ? credit.bgmNames.map((name, i) => (
                          <div key={i} className="text-lg font-semibold text-white">{name}</div>
                        ))
                      : <span className="text-lg font-semibold text-white">{credit.bgmNames}</span>
                    }
                  </div>
                  <a 
                    href={credit.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    {credit.author}
                  </a>
                </>
              ) : credit.role === 'SE' ? (
                <a 
                  href={credit.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  {credit.name}
                </a>
              ) : (
                <p className="text-lg font-semibold">{credit.name}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};