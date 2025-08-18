import { TbDroplet, TbBolt, TbX } from 'react-icons/tb';
import { useInfrastructureStore } from '../stores/InfrastructureStore';

interface InfrastructureInfoProps {
  onClose: () => void;
}

export function InfrastructureInfo({ onClose }: InfrastructureInfoProps) {
  const { getInfrastructureStatus } = useInfrastructureStore();
  const status = getInfrastructureStatus();

  const getStatusColor = (balance: number) => {
    if (balance < 0) return 'text-red-500';
    if (balance > 0) return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="fixed bg-gray-800/50 backdrop-blur-sm text-white shadow-2xl z-[1100] p-6 rounded-lg max-w-md">
      <div className="flex items-center justify-between mb-4 mx-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TbDroplet className="text-blue-400" />
          インフラ状況
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <TbX size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* 電気 */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TbBolt className="text-yellow-400" />
            <span className="font-semibold">電気</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">需要</span>
              <span>{status.electricity.demand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">供給</span>
              <span>{status.electricity.supply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">収支</span>
              <span className={getStatusColor(status.electricity.balance)}>
                {status.electricity.balance >= 0 ? '+' : ''}{status.electricity.balance}
              </span>
            </div>
          </div>
        </div>

        {/* 水道 */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TbDroplet className="text-blue-400" />
            <span className="font-semibold">水道</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">需要</span>
              <span>{status.water.demand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">供給</span>
              <span>{status.water.supply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">収支</span>
              <span className={getStatusColor(status.water.balance)}>
                {status.water.balance >= 0 ? '+' : ''}{status.water.balance}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
