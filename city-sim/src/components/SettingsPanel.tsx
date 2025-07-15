import React from 'react';
import { BGMPlayer } from './SoundSettings';
import { TbX, TbFileText } from 'react-icons/tb';

// プロパティの型定義にonShowCreditsを追加
interface SettingsPanelProps {
  onClose: () => void;
  onShowCredits: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onShowCredits }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-600">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <TbX size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">設定</h2>
        <div className="space-y-4">
          {/* 既存のBGMプレイヤー */}
          <BGMPlayer />

          {/* クレジット表示ボタンを新しく追加 */}
          <button 
            onClick={onShowCredits}
            className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold p-4 rounded-lg transition-colors"
          >
            <TbFileText />
            クレジットを表示
          </button>
        </div>
      </div>
    </div>
  );
};