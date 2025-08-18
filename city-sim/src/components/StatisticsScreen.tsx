import { TbArrowLeft, TbUsers, TbBolt, TbBuilding, TbChartBar, TbCash, TbCalendar, TbStar } from 'react-icons/tb';
import { useState } from 'react';
import { useGameStore } from '../stores/GameStore';
import { useEconomyStore } from '../stores/EconomyStore';
import { useProductStore } from '../stores/ProductStore';
import { useFacilityStore } from '../stores/FacilityStore';

interface StatisticsPanelProps {
  onClose: () => void;
}

type TabType = 'basic' | 'infrastructure' | 'industry' | 'economy' | 'achievement';

export function StatisticsPanel({ onClose }: StatisticsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const stats = useGameStore(state => state.stats);
  const { taxRates, setTaxRates } = useEconomyStore();
  const { getProductSupplyDemandStatus } = useProductStore();
  const facilities = useFacilityStore(state => state.facilities);

  const tabs = [
    { id: 'basic', name: '基本', icon: TbUsers },
    { id: 'economy', name: '経済', icon: TbCash  },
    { id: 'industry', name: '産業', icon: TbBuilding },
    { id: 'infrastructure', name: 'インフラ', icon: TbBolt },
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

  // 経済タブのコンテンツ
  const renderEconomyTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 収支詳細カード */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-green-300 flex items-center gap-2">
          <TbCash className="text-green-400" />
          収支詳細
        </h3>
        <div className="space-y-3">
          {/* 月次収入 */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <span className="text-gray-300">月次収入</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-400">+{stats.monthlyBalance.income.toLocaleString()}</span>
              <span className="text-xs text-gray-400">円</span>
            </div>
          </div>
          
          {/* 月次支出 */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <span className="text-gray-300">月次支出</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-red-400">-{stats.monthlyBalance.expense.toLocaleString()}</span>
              <span className="text-xs text-gray-400">円</span>
            </div>
          </div>
          
          {/* 月次収支 */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <span className="text-gray-300">月次収支</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${stats.monthlyBalance.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.monthlyBalance.balance >= 0 ? '+' : ''}{stats.monthlyBalance.balance.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">円</span>
            </div>
          </div>
        </div>
      </div>

      {/* 税率・資金管理カード */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-blue-300 flex items-center gap-2">
          <TbChartBar className="text-blue-400" />
          税率・資金管理
        </h3>
        <div className="space-y-3">
          {/* 市民税率調整 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">市民税率</span>
              <span className="text-lg font-bold text-blue-400">{(taxRates.citizenTax * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={taxRates.citizenTax}
              onChange={(e) => setTaxRates({ citizenTax: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1%</span>
              <span>10%</span>
            </div>
          </div>
          
          {/* 法人税率調整 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">法人税率</span>
              <span className="text-lg font-bold text-blue-400">{(taxRates.corporateTax * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.20"
              step="0.01"
              value={taxRates.corporateTax}
              onChange={(e) => setTaxRates({ corporateTax: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5%</span>
              <span>20%</span>
            </div>
          </div>
          
          {/* 現在の資金 */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
            <span className="text-gray-300">現在の資金</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-yellow-400">{stats.money.toLocaleString()}</span>
              <span className="text-xs text-gray-400">円</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 産業タブのコンテンツ
  const renderIndustryTab = () => {
    // 製品の需給状況を取得
    const { demand, production, efficiency } = getProductSupplyDemandStatus(facilities);
    
    // 製品カテゴリ名
    const productCategories = ['原材料', '中間製品', '最終製品', 'サービス'];
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 労働状況カード */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-3 text-blue-300 flex items-center gap-2">
            <TbUsers className="text-blue-400" />
            労働状況
          </h3>
          <div className="space-y-3">
            {/* 総労働者数 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">総労働者数</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-400">{Math.floor(stats.population * 0.6)}</span>
                <span className="text-xs text-gray-400">人</span>
              </div>
            </div>
            
            {/* 就職者数 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">就職者数</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-400">
                  {stats.workforceAllocations.reduce((total, allocation) => total + allocation.assignedWorkforce, 0)}
                </span>
                <span className="text-xs text-gray-400">人</span>
              </div>
            </div>
            
            {/* 求職者数 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">求職者数</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-400">
                  {Math.floor(stats.population * 0.6) - stats.workforceAllocations.reduce((total, allocation) => total + allocation.assignedWorkforce, 0)}
                </span>
                <span className="text-xs text-gray-400">人</span>
              </div>
            </div>
            
            {/* 失業率 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">失業率</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">
                  {Math.floor(stats.population * 0.6) > 0 
                    ? (((Math.floor(stats.population * 0.6) - stats.workforceAllocations.reduce((total, allocation) => total + allocation.assignedWorkforce, 0)) / Math.floor(stats.population * 0.6)) * 100).toFixed(1)
                    : '0.0'
                  }%
                </span>
              </div>
            </div>
            
            {/* 平均稼働率 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">平均稼働率</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-yellow-400">
                  {stats.workforceAllocations.length > 0 
                    ? ((stats.workforceAllocations.reduce((total, allocation) => total + allocation.efficiency, 0) / stats.workforceAllocations.length) * 100).toFixed(1)
                    : '0.0'
                  }%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 製品需給カード */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-3 text-purple-300 flex items-center gap-2">
            <TbChartBar className="text-purple-400" />
            製品需給状況
          </h3>
          <div className="space-y-3">
            {/* 製造効率 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">製造効率</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-purple-400">{(efficiency * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            {/* 製品カテゴリ別の需給 */}
            {productCategories.map((category, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">{category}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">需要:</span>
                    <span className="text-blue-400">{demand[index]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">供給:</span>
                    <span className="text-green-400">{production[index]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // インフラタブのコンテンツ
  const renderInfrastructureTab = () => (
    <div className="text-center text-gray-400">
      <h2 className="text-2xl mb-4">インフラタブ</h2>
      <p>ここにインフラ情報が表示されます</p>
    </div>
  );

  // 実績タブのコンテンツ
  const renderAchievementTab = () => (
    <div className="text-center text-gray-400">
      <h2 className="text-2xl mb-4">実績タブ</h2>
      <p>ここに実績情報が表示されます</p>
    </div>
  );

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicTab();
      case 'economy':
        return renderEconomyTab();
      case 'industry':
        return renderIndustryTab();
      case 'infrastructure':
        return renderInfrastructureTab();
      case 'achievement':
        return renderAchievementTab();
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
