import { TbArrowLeft, TbUsers, TbBolt, TbBuilding, TbChartBar, TbCash } from 'react-icons/tb';
import { useState } from 'react';

interface StatisticsPanelProps {
  onClose: () => void;
}

type TabType = 'basic' | 'infrastructure' | 'industry' | 'economy' | 'achievement';

export function StatisticsPanel({ onClose }: StatisticsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const tabs = [
    { id: 'basic', name: '基本', icon: TbUsers },
    { id: 'infrastructure', name: 'インフラ', icon: TbBolt },
    { id: 'industry', name: '産業', icon: TbBuilding },
    { id: 'economy', name: '経済', icon: TbCash },
    { id: 'achievement', name: '実績', icon: TbChartBar },
  ];

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden flex">
      {/* 左サイドバー - タブ */}
      <div className="w-48 bg-gray-800 border-r border-gray-700">
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-300 mb-4">カテゴリ</h2>
          <div className="space-y-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <IconComponent size={20} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gray-800 p-3 shadow-lg border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">統計情報</h1>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors"
            >
              <TbArrowLeft size={20} />
              ゲームに戻る
            </button>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 p-8">
          <div className="text-center text-gray-400">
            <h2 className="text-2xl mb-4">{tabs.find(tab => tab.id === activeTab)?.name}タブ</h2>
            <p>ここに{activeTab === 'basic' ? '基本' : activeTab === 'infrastructure' ? 'インフラ' : activeTab === 'industry' ? '産業' : activeTab === 'economy' ? '経済' : '実績'}情報が表示されます</p>
          </div>
        </div>
      </div>
    </div>
  );
}
