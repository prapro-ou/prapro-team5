import { TbArrowLeft } from 'react-icons/tb';

interface StatisticsPanelProps {
  onClose: () => void;
}

export function StatisticsPanel({ onClose }: StatisticsPanelProps) {
  return (
    <div className="h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <div className="bg-gray-800 p-6 shadow-lg border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">統計画面</h1>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors"
          >
            <TbArrowLeft size={20} />
            ゲームに戻る
          </button>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <h2 className="text-2xl mb-4">統計画面</h2>
        </div>
      </div>
    </div>
  );
}
