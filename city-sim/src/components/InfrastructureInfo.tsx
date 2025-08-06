import React from 'react';
import { TbDroplet, TbBolt, TbX } from 'react-icons/tb';

interface InfrastructureInfoProps {
  onClose: () => void;
}

export function InfrastructureInfo({ onClose }: InfrastructureInfoProps) {
	return (
		<div className="fixed left-0 top-0 h-full w-80 bg-gray-800/95 backdrop-blur-sm text-white shadow-2xl z-[1100]">
			<div className="flex items-center justify-between p-4 border-b border-gray-600">
				<h2 className="text-xl font-bold flex items-center gap-2">
					<TbDroplet className="text-blue-400" />
					インフラ情報
				</h2>
				<button
					onClick={onClose}
					className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
				>
					<TbX size={20} />
				</button>
			</div>
			
			<div className="p-4">
				<div className="mt-4 space-y-2">
					<div className="flex items-center gap-2">
						<TbBolt className="text-yellow-400" />
						<span>電気</span>
					</div>
					<div className="flex items-center gap-2">
						<TbDroplet className="text-blue-400" />
						<span>水道</span>
					</div>
				</div>
			</div>
		</div>
	);
}
