import { useEffect } from 'react';
import { useMissionStore } from '../stores/MissionStore';
import { MissionItem } from './MissionItem';
import { playPanelSound } from './SoundSettings';

interface MissionPanelProps {
  onClose: () => void;
}

export default function MissionPanel({ onClose }: MissionPanelProps) {
  const { missions, activeMissions, completedMissions, generateSampleMissions } = useMissionStore();

  // パネルが開かれたときにサンプルミッションを生成（テスト用）
  useEffect(() => {
    if (missions.length === 0) {
      generateSampleMissions();
    }
  }, [missions.length, generateSampleMissions]);

  // ミッションをカテゴリ別に分類
  const missionsByCategory = missions.reduce((acc, mission) => {
    if (!acc[mission.category]) {
      acc[mission.category] = [];
    }
    acc[mission.category].push(mission);
    return acc;
  }, {} as Record<string, typeof missions>);

  // カテゴリ名の日本語表示
  const getCategoryName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'development': '開発',
      'economic': '経済',
      'infrastructure': 'インフラ',
      'environmental': '環境',
      'social': '社会',
      'special': '特殊',
      'tutorial': 'チュートリアル',
      'seasonal': '季節',
      'challenge': 'チャレンジ',
      'collection': 'コレクション'
    };
    return categoryNames[category] || category;
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 w-[600px] max-h-[600px] z-[3000]">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ミッション</h2>
        <button
          onClick={() => {
            playPanelSound();
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 統計情報 */}
      <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{activeMissions.length}</div>
          <div className="text-sm text-gray-600">進行中</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completedMissions.length}</div>
          <div className="text-sm text-gray-600">完了</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{missions.length}</div>
          <div className="text-sm text-gray-600">総数</div>
        </div>
      </div>

      {/* ミッション一覧 */}
      <div className="max-h-[400px] overflow-y-auto">
        {Object.entries(missionsByCategory).map(([category, categoryMissions]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
              {getCategoryName(category)}
            </h3>
            <div className="space-y-3">
              {categoryMissions
                .sort((a, b) => a.priority - b.priority)
                .map(mission => (
                  <MissionItem key={mission.id} mission={mission} />
                ))}
            </div>
          </div>
        ))}
        
        {missions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            利用可能なミッションがありません
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              playPanelSound();
              generateSampleMissions();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            サンプルミッション生成
          </button>
          <div className="text-sm text-gray-500">
            月次処理で自動更新されます
          </div>
        </div>
      </div>
    </div>
  );
}
