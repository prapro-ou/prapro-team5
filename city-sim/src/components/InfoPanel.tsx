import React from 'react';
import { TbCash, TbUsers, TbMoodHappy, TbCalendar ,TbStar, TbBriefcase, TbBox} from 'react-icons/tb';
import type { GameStats } from '../types/game';

interface InfoPanelProps {
  stats: GameStats;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ stats }) => {
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
        {/* 労働力 */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2" title="労働力">
          <TbBriefcase className="text-orange-400 text-xl" />
          <div className="text-lg font-bold text-white">
            {stats.workforce.toLocaleString()}
          </div>
        </div>
        {/* 製品 */}
        <div className="flex items-center gap-2 bg-gray-600 rounded-lg p-2" title="製品備蓄">
          <TbBox className="text-yellow-600 text-xl" />
          <div className="text-lg font-bold text-white">
            {stats.goods.toLocaleString()}
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
      </div>
    </div>
	)
}
