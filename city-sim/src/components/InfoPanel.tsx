import React from 'react';
import { TbCash, TbUsers, TbMoodHappy, TbCalendar } from 'react-icons/tb';
import type { GameStats } from '../types/game';

interface InfoPanelProps {
  stats: GameStats;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ stats }) => {
	return (
		<div className="fixed top-0 left-0 right-0 z-50 bg-gray-800 p-4 shadow-lg border-b border-gray-700">
				<div className="flex items-center gap-2">
					{/* 資金 */}
					<div className="flex items-center gap-2">
							<div>
									<div className="text-lg font-bold text-white">
										<TbCash/>{stats.money.toLocaleString()}
									</div>
							</div>
					</div>
				</div>
		</div>
	)
}
