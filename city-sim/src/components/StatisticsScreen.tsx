import { TbArrowLeft, TbUsers, TbBolt, TbBuilding, TbChartBar, TbCash, TbCalendar, TbStar } from 'react-icons/tb';
import { useState } from 'react';
import { useGameStore } from '../stores/GameStore';

interface StatisticsPanelProps {
  onClose: () => void;
}

type TabType = 'basic' | 'infrastructure' | 'industry' | 'economy' | 'achievement';

export function StatisticsPanel({ onClose }: StatisticsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const stats = useGameStore(state => state.stats);

  const tabs = [
    { id: 'basic', name: '基本', icon: TbUsers },
    { id: 'infrastructure', name: 'インフラ', icon: TbBolt },
    { id: 'industry', name: '産業', icon: TbBuilding },
    { id: 'economy', name: '経済', icon: TbCash },
    { id: 'achievement', name: '実績', icon: TbChartBar },
  ];

  // 基本タブのコンテンツ
  const renderBasicTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 都市状況カード */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-blue-300 flex items-center gap-2">
          <TbStar className="text-yellow-400" />
          都市状況
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">Lv.{stats.level}</div>
            <div className="text-xs text-gray-400">レベル</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.population.toLocaleString()}</div>
            <div className="text-xs text-gray-400">人口</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${stats.monthlyBalance.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.monthlyBalance.balance >= 0 ? '+' : ''}{stats.monthlyBalance.balance.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">月次収支</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.money.toLocaleString()}</div>
            <div className="text-xs text-gray-400">資金</div>
          </div>
        </div>
      </div>

      {/* 時間・進行カード */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-green-300 flex items-center gap-2">
          <TbCalendar className="text-blue-400" />
          時間・進行
        </h3>
        <div className="space-y-3">
          {/* 現在の日付 */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <span className="text-gray-300">現在の日付</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-400">{stats.date.year}</span>
              <span className="text-gray-400">年</span>
              <span className="text-lg font-bold text-green-400">{stats.date.month}</span>
              <span className="text-gray-400">月</span>
              <span className="text-lg font-bold text-purple-400">{stats.date.week}</span>
              <span className="text-gray-400">週目</span>
            </div>
          </div>
          
          {/* 累計週数 */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <span className="text-gray-300">ゲーム開始からの週数</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-yellow-400">{stats.date.totalWeeks}</span>
              <span className="text-gray-400">週</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicTab();
      case 'infrastructure':
        return (
          <div className="text-center text-gray-400">
            <h2 className="text-2xl mb-4">インフラタブ</h2>
            <p>ここにインフラ情報が表示されます</p>
          </div>
        );
      case 'industry':
        return (
          <div className="text-center text-gray-400">
            <h2 className="text-2xl mb-4">産業タブ</h2>
            <p>ここに産業情報が表示されます</p>
          </div>
        );
      case 'economy':
        return (
          <div className="text-center text-gray-400">
            <h2 className="text-2xl mb-4">経済タブ</h2>
            <p>ここに経済情報が表示されます</p>
          </div>
        );
      case 'achievement':
        return (
          <div className="text-center text-gray-400">
            <h2 className="text-2xl mb-4">実績タブ</h2>
            <p>ここに実績情報が表示されます</p>
          </div>
        );
      default:
        return renderBasicTab();
    }
  };

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
        <div className="flex-1 p-8 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
