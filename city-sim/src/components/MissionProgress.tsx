import type { MissionStatus } from '../types/mission';

interface MissionProgressProps {
  progress: number;
  status: MissionStatus;
}

export function MissionProgress({ progress, status }: MissionProgressProps) {
  // 状態に応じた色分け
  const getProgressColor = () => {
    switch (status) {
      case 'available':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  // 状態に応じた背景色
  const getBackgroundColor = () => {
    switch (status) {
      case 'available':
        return 'bg-blue-100';
      case 'in_progress':
        return 'bg-yellow-100';
      case 'completed':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="w-full">
      {/* 進捗バー */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <div className={`w-full h-2 rounded-full ${getBackgroundColor()} overflow-hidden`}>
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
          {progress}%
        </span>
      </div>
      
      {/* 進捗テキスト */}
      <div className="text-xs text-gray-500">
        {status === 'completed' && 'ミッション完了'}
        {status === 'in_progress' && '達成中...'}
        {status === 'available' && '未達成'}
      </div>
    </div>
  );
}
