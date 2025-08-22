import type { Mission } from '../types/mission';
import { useMissionStore } from '../stores/MissionStore';
import { MissionProgress } from './MissionProgress';
import { playCoinSound } from './SoundSettings';

interface MissionItemProps {
  mission: Mission;
}

export function MissionItem({ mission }: MissionItemProps) {
  const { completeMission } = useMissionStore();

  // 状態に応じたスタイル
  const getStatusStyle = () => {
    switch (mission.status) {
      case 'available':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'in_progress':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'completed':
        return 'border-l-4 border-green-500 bg-green-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
    }
  };

  // 状態に応じたテキスト
  const getStatusText = () => {
    switch (mission.status) {
      case 'available':
        return '受注可能';
      case 'in_progress':
        return '進行中';
      case 'completed':
        return '完了';
      default:
        return '不明';
    }
  };

  // 状態に応じたテキストカラー
  const getStatusTextColor = () => {
    switch (mission.status) {
      case 'available':
        return 'text-blue-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // ミッション完了処理
  const handleComplete = () => {
    if (mission.status === 'in_progress') {
      playCoinSound();
      completeMission(mission.id);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${getStatusStyle()} transition-all duration-200 hover:shadow-md`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 mb-1">
            {mission.name}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {mission.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusTextColor()} bg-white`}>
            {getStatusText()}
          </span>
          <span className="text-xs text-gray-500">
            優先度: {mission.priority}
          </span>
        </div>
      </div>

      {/* 進捗バー */}
      <div className="mb-3">
        <MissionProgress progress={mission.progress} status={mission.status} />
      </div>

      {/* 条件と効果の表示 */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* 条件 */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">達成条件</h5>
          <div className="space-y-1">
            {mission.conditions?.map((condition, index) => (
              <div key={index} className="text-xs text-gray-600">
                {condition.type === 'facility_type_count' && condition.target
                  ? `${condition.target}施設を${condition.value}個以上`
                  : condition.type === 'population'
                  ? `人口${condition.value}人以上`
                  : condition.type === 'money'
                  ? `所持金${condition.value}円以上`
                  : condition.type === 'satisfaction'
                  ? `満足度${condition.value}以上`
                  : `${condition.type}: ${condition.op} ${condition.value}`
                }
              </div>
            ))}
          </div>
        </div>

        {/* 効果 */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">報酬</h5>
          <div className="space-y-1">
            {mission.effects?.map((effect, index) => (
              <div key={index} className="text-xs text-gray-600">
                {effect.type === 'money'
                  ? `資金 +${effect.value}円`
                  : effect.type === 'population'
                  ? `人口 +${effect.value}人`
                  : effect.type === 'satisfaction'
                  ? `満足度 +${effect.value}`
                  : `${effect.type}: +${effect.value}`
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex justify-end">
        {mission.status === 'in_progress' && (
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
          >
            完了
          </button>
        )}
        {mission.status === 'available' && (
          <span className="px-4 py-2 bg-gray-300 text-gray-600 text-sm font-medium rounded cursor-not-allowed">
            条件未達成
          </span>
        )}
        {mission.status === 'completed' && (
          <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded">
            完了済み
          </span>
        )}
      </div>
    </div>
  );
}
