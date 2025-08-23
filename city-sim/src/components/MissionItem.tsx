import type { Mission } from '../types/mission';
import { useMissionStore } from '../stores/MissionStore';
import { MissionProgress } from './MissionProgress';
import { playCoinSound } from './SoundSettings';
import { getFactionDisplayName, getProductDisplayName, getInfrastructureDisplayName } from '../utils/displayUtils';

interface MissionItemProps {
  mission: Mission;
}

export function MissionItem({ mission }: MissionItemProps) {
  const { acceptMission } = useMissionStore();

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



  // ミッション受注処理
  const handleAccept = () => {
    if (mission.status === 'available' && !mission.autoAccept) {
      playCoinSound();
      acceptMission(mission.id);
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
          <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-600 bg-gray-100">
            {mission.autoAccept ? '自動' : '手動'}
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
                  : condition.type === 'support_rating' && condition.target
                  ? `${getFactionDisplayName(condition.target)}支持率${condition.value}%以上`
                  : condition.type === 'infrastructure_supply' && condition.target
                  ? `${getInfrastructureDisplayName(condition.target)}供給${condition.value}以上`
                  : condition.type === 'infrastructure_demand' && condition.target
                  ? `${getInfrastructureDisplayName(condition.target)}需要${condition.value}以上`
                  : condition.type === 'infrastructure_balance' && condition.target
                  ? `${getInfrastructureDisplayName(condition.target)}バランス${condition.value}以上`
                  : condition.type === 'infrastructure_ratio' && condition.target
                  ? `${getInfrastructureDisplayName(condition.target)}供給率${condition.value}%以上`
                  : condition.type === 'tax_revenue'
                  ? `税収${condition.value}円以上`
                  : condition.type === 'workforce_efficiency'
                  ? `労働力効率${condition.value}%以上`
                  : condition.type === 'monthly_income'
                  ? `月次収入${condition.value}円${condition.op === '>' ? '超' : '以上'}`
                  : condition.type === 'monthly_expense'
                  ? `月次支出${condition.value}円${condition.op === '<' ? '未満' : condition.op === '<=' ? '以下' : '以上'}`
                  : condition.type === 'product_demand' && condition.target
                  ? `${getProductDisplayName(condition.target)}需要${condition.value}以上`
                  : condition.type === 'product_production' && condition.target
                  ? `${getProductDisplayName(condition.target)}生産${condition.value}以上`
                  : condition.type === 'product_efficiency'
                  ? `製品効率${condition.value}%以上`
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
                  ? `資金 ${effect.value >= 0 ? '+' : ''}${effect.value}円`
                  : effect.type === 'population'
                  ? `人口 ${effect.value >= 0 ? '+' : ''}${effect.value}人`
                  : effect.type === 'satisfaction'
                  ? `満足度 ${effect.value >= 0 ? '+' : ''}${effect.value}`
                  : effect.type === 'faction_support'
                  ? `${getFactionDisplayName(effect.target || '')}支持率 ${effect.value >= 0 ? '+' : ''}${effect.value}%`
                  : `${effect.type}: ${effect.value >= 0 ? '+' : ''}${effect.value}`
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex justify-end gap-2">
        {mission.status === 'in_progress' && (
          <span className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded">
            進行中（自動完了）
          </span>
        )}
        {mission.status === 'available' && !mission.autoAccept && (
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
          >
            受注
          </button>
        )}
        {mission.status === 'available' && mission.autoAccept && (
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
