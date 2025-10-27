import React from 'react';
import { TbCash, TbUsers, TbMoodHappy, TbCalendar, TbStar, TbSettings, TbAward } from 'react-icons/tb';
import { useGameStore } from '../stores/GameStore';
import { useAchievementStore } from '../stores/AchievementStore';
import { playPanelSound } from './SoundSettings';
import { TimeControl } from './TimeControl';

interface InfoPanelProps {
  onOpenSettings: () => void;
  onShowAchievementPanel: (show: boolean) => void;
  showAchievementPanel: boolean;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ onOpenSettings, onShowAchievementPanel, showAchievementPanel }) => {
  // すべての情報をストアから直接取得
  const stats = useGameStore(state => state.stats);
  const { hasClaimableAchievements } = useAchievementStore();

	return (
    <div className="fixed top-0 left-0 right-0 z-[1000] bg-gray-800 p-4 shadow-lg border-b border-gray-700">
      <div className="flex items-center gap-10">
        {/* レベル */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2">
          <TbStar className="text-yellow-400 text-xl" />
          <div className="text-lg font-bold text-white">
            Lv.{stats.level}
          </div>
        </div>
        {/* 資金 */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2">
          <TbCash className="text-green-400 text-xl" />
          <div className="text-lg font-bold text-white">
            {stats.money.toLocaleString()}
          </div>
        </div>
        {/* 人口 */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2">
          <TbUsers className="text-blue-400 text-xl" />
          <div className="text-lg font-bold text-white">
            {stats.population.toLocaleString()}
          </div>
        </div>
        {/* 満足度 */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2">
          <TbMoodHappy className="text-yellow-400 text-xl" />
          <div className="text-lg font-bold text-white">
            {stats.satisfaction.toLocaleString()}%
          </div>
        </div>
        {/* 日付 */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2">
          <TbCalendar className="text-gray-300 text-xl" />
          <div className="text-lg font-bold text-white">
            {stats.date.year}年{stats.date.month}月{stats.date.week}週目
          </div>
        </div>
        
        {/* 時間制御 */}
        <TimeControl />
        
        {/* 右側にボタンを配置 */}
        <div className="ml-auto flex items-center gap-4">
          {/* 実績ボタン */}
          <div className="relative">
            <button
              onClick={() => {
                playPanelSound();
                onShowAchievementPanel(!showAchievementPanel);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white w-20 h-12 rounded-lg shadow-lg transition-colors flex items-center justify-center"
            >
              <TbAward size={24} className="text-yellow-400" />
            </button>
            {hasClaimableAchievements() && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          
          {/* 設定ボタン */}
          <button 
            onClick={() => {
              playPanelSound();
              onOpenSettings();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white w-12 h-12 rounded-lg shadow-lg transition-colors flex items-center justify-center"
          >
            <TbSettings size={24} />
          </button>
        </div>
      </div>
    </div>
	)
}
