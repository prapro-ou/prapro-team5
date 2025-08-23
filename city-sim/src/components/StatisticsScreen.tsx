import { TbArrowLeft, TbUsers, TbBolt, TbBuilding, TbChartBar, TbCash, TbCalendar, TbStar, TbDroplet, TbFlag, TbScale, TbTrophy, TbIdBadge } from 'react-icons/tb';
import { useState } from 'react';
import { useGameStore } from '../stores/GameStore';
import { useEconomyStore } from '../stores/EconomyStore';
import { useProductStore } from '../stores/ProductStore';
import { useFacilityStore } from '../stores/FacilityStore';
import { useInfrastructureStore } from '../stores/InfrastructureStore';
import { useSupportStore } from '../stores/SupportStore';

interface StatisticsPanelProps {
  onClose: () => void;
}

type TabType = 'basic' | 'infrastructure' | 'industry' | 'economy' | 'support' | 'secretary';

export function StatisticsPanel({ onClose }: StatisticsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const stats = useGameStore(state => state.stats);
  const { taxRates, setTaxRates } = useEconomyStore();
  const { getProductSupplyDemandStatus } = useProductStore();
  const facilities = useFacilityStore(state => state.facilities);
  const { getInfrastructureStatus, getInfrastructureShortage, getInfrastructureSurplus } = useInfrastructureStore();
  const { getAllFactionSupports, getActiveEffects } = useSupportStore();

  const tabs = [
    { id: 'basic', name: '基本', icon: TbUsers },
    { id: 'economy', name: '経済', icon: TbCash  },
    { id: 'industry', name: '産業', icon: TbBuilding },
    { id: 'infrastructure', name: 'インフラ', icon: TbBolt },
    { id: 'support', name: '支持・派閥', icon: TbFlag },
    { id: 'secretary', name: '秘書', icon: TbIdBadge}
  ];

  // 基本タブのコンテンツ
  const renderBasicTab = () => (
    <div className="space-y-6">
      {/* 基本情報セクション */}
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

      {/* 前年度評価結果セクション */}
      {stats.previousYearEvaluation && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-200">
            <TbChartBar className="text-blue-400" />
            前年度({stats.previousYearEvaluation.year}) 評価結果
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">{stats.previousYearEvaluation.grade}</div>
              <div className="text-sm text-gray-400">総合評価</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.previousYearEvaluation.totalScore}</div>
              <div className="text-sm text-gray-400">総合スコア</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{stats.previousYearEvaluation.subsidy.toLocaleString()}</div>
              <div className="text-sm text-gray-400">補助金</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{stats.previousYearEvaluation.year}</div>
              <div className="text-sm text-gray-400">評価年度</div>
            </div>
          </div>
          
          {/* 詳細評価項目 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h4 className="text-lg font-bold mb-3 text-gray-200">評価詳細</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">発展度合い</span>
                  <span className="font-bold text-blue-400">{stats.previousYearEvaluation.developmentScore}/40点</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">支持率</span>
                  <span className="font-bold text-green-400">{stats.previousYearEvaluation.approvalRating}/30点</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">満足度スコア</span>
                  <span className="font-bold text-purple-400">{stats.previousYearEvaluation.satisfactionScore}/20点</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">ミッション達成</span>
                  <span className="font-bold text-yellow-400">{stats.previousYearEvaluation.missionCompletion}/10点</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h4 className="text-lg font-bold mb-3 text-gray-200">評価コメント</h4>
              <div className="text-sm space-y-2">
                {stats.previousYearEvaluation.grade === 'S' && (
                  <p className="text-blue-300">素晴らしい都市運営でした！中央政府はあなたを高く評価しています。</p>
                )}
                {stats.previousYearEvaluation.grade === 'A' && (
                  <p className="text-green-300">優秀な都市運営でした。中央政府はあなたの活躍に期待しています。</p>
                )}
                {stats.previousYearEvaluation.grade === 'B' && (
                  <p className="text-blue-300">良好な都市運営でした。中央政府はあなたの活躍に注目しています。</p>
                )}
                {stats.previousYearEvaluation.grade === 'C' && (
                  <p className="text-orange-300">まずまずの都市運営でした。中央政府はより一層の努力を求めています。</p>
                )}
                {stats.previousYearEvaluation.grade === 'D' && (
                  <p className="text-red-300">改善の余地がありました。中央政府は計画の見直しを要求しています。</p>
                )}
                {stats.previousYearEvaluation.grade === 'E' && (
                  <p className="text-red-400">都市運営に課題がありました。中央政府はあなたを問題視しています。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 年末評価未実施の場合の表示 */}
      {!stats.previousYearEvaluation && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-3 text-gray-300 flex items-center gap-2">
            <TbTrophy className="text-gray-400" />
            年末評価
          </h3>
          <div className="text-center text-gray-400">
            <p className="mb-2">年末評価は12月第4週に実行されます</p>
            <p className="text-sm">現在の進行状況: {stats.date.year}年{stats.date.month}月{stats.date.week}週目</p>
            {stats.date.month === 12 && stats.date.week === 4 && (
              <p className="text-yellow-400 font-bold mt-2">今週が年末評価の週です！</p>
            )}
          </div>
        </div>
      )}
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
  const renderInfrastructureTab = () => {
    const infrastructureStatus = getInfrastructureStatus();
    const shortage = getInfrastructureShortage();
    const surplus = getInfrastructureSurplus();
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 上水道カード */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-3 text-blue-300 flex items-center gap-2">
            <TbDroplet className="text-blue-400" />
            上水道
          </h3>
          <div className="space-y-3">
            {/* 上水道需要 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">上水道需要</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">{infrastructureStatus.water.demand.toLocaleString()}</span>
                <span className="text-xs text-gray-400">m³/月</span>
              </div>
            </div>
            
            {/* 上水道供給 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">上水道供給</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-400">{infrastructureStatus.water.supply.toLocaleString()}</span>
                <span className="text-xs text-gray-400">m³/月</span>
              </div>
            </div>
            
            {/* 上水道バランス */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">上水道バランス</span>
              <div className="flex items-center gap-2">
                {shortage.water > 0 ? (
                  <span className="text-sm font-bold text-red-400">不足: {shortage.water.toLocaleString()}m³/月</span>
                ) : surplus.water > 0 ? (
                  <span className="text-sm font-bold text-green-400">余剰: {surplus.water.toLocaleString()}m³/月</span>
                ) : (
                  <span className="text-sm font-bold text-blue-400">均衡</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 電気カード */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-3 text-yellow-300 flex items-center gap-2">
            <TbBolt className="text-yellow-400" />
            電気
          </h3>
          <div className="space-y-3">
            {/* 電気需要 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">電気需要</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">{infrastructureStatus.electricity.demand.toLocaleString()}</span>
                <span className="text-xs text-gray-400">kWh/月</span>
              </div>
            </div>
            
            {/* 電気供給 */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">電気供給</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-400">{infrastructureStatus.electricity.supply.toLocaleString()}</span>
                <span className="text-xs text-gray-400">kWh/月</span>
              </div>
            </div>
            
            {/* 電気バランス */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <span className="text-gray-300">電気バランス</span>
              <div className="flex items-center gap-2">
                {shortage.electricity > 0 ? (
                  <span className="text-sm font-bold text-red-400">不足: {shortage.electricity.toLocaleString()}kWh/月</span>
                ) : surplus.electricity > 0 ? (
                  <span className="text-sm font-bold text-green-400">余剰: {surplus.electricity.toLocaleString()}kWh/月</span>
                ) : (
                  <span className="text-sm font-bold text-blue-400">均衡</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 支持率タブのコンテンツ
  const renderSupportTab = () => {
    const factionSupports = getAllFactionSupports();
    
    return (
      <div className="space-y-6">
        {/* 支持状況パネル */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-200">
            <TbFlag className="text-blue-400" />
            支持状況
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {factionSupports.map((factionSupport) => {
              const getFactionName = (type: string) => {
                switch (type) {
                  case 'central_government': return '中央政府';
                  case 'citizens': return '市民';
                  case 'chamber_of_commerce': return '商工会';
                  default: return type;
                }
              };

              const getFactionColor = (type: string) => {
                switch (type) {
                  case 'central_government': return 'text-blue-400';
                  case 'citizens': return 'text-green-400';
                  case 'chamber_of_commerce': return 'text-purple-400';
                  default: return 'text-gray-400';
                }
              };

              const getRatingColor = (rating: number) => {
                if (rating >= 80) return 'text-green-400';
                if (rating >= 60) return 'text-blue-400';
                if (rating >= 40) return 'text-yellow-400';
                if (rating >= 20) return 'text-orange-400';
                return 'text-red-400';
              };

              const getChangeColor = (change: number) => {
                if (change > 0) return 'text-green-400';
                if (change < 0) return 'text-red-400';
                return 'text-gray-400';
              };

              const getChangeIcon = (change: number) => {
                if (change > 0) return '↗';
                if (change < 0) return '↘';
                return '→';
              };

              return (
                <div key={factionSupport.type} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h4 className={`text-lg font-bold mb-3 ${getFactionColor(factionSupport.type)}`}>
                    {getFactionName(factionSupport.type)}
                  </h4>
                  <div className="space-y-3">
                    {/* 現在の支持率 */}
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getRatingColor(factionSupport.currentRating)}`}>
                        {factionSupport.currentRating}%
                      </div>
                      <div className="text-xs text-gray-400">現在の支持率</div>
                    </div>
                    
                    {/* 変化量 */}
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getChangeColor(factionSupport.change)}`}>
                        {getChangeIcon(factionSupport.change)} {Math.abs(factionSupport.change)}%
                      </div>
                      <div className="text-xs text-gray-400">前月比変化</div>
                    </div>
                    
                    {/* 支持率レベル */}
                    <div className="text-center">
                      <div className="text-sm text-gray-300">
                        レベル: {
                          factionSupport.currentRating >= 80 ? '非常に高い' :
                          factionSupport.currentRating >= 60 ? '高い' :
                          factionSupport.currentRating >= 40 ? '普通' :
                          factionSupport.currentRating >= 20 ? '低い' : '非常に低い'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 支持率効果パネル */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-200">
            <TbScale className="text-yellow-400" />
            支持率による効果
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {factionSupports.map((factionSupport) => {
              const activeEffects = getActiveEffects(factionSupport.type);
              
              const getFactionName = (type: string) => {
                switch (type) {
                  case 'central_government': return '中央政府';
                  case 'citizens': return '市民';
                  case 'chamber_of_commerce': return '商工会';
                  default: return type;
                }
              };

              const getFactionColor = (type: string) => {
                switch (type) {
                  case 'central_government': return 'text-blue-400';
                  case 'citizens': return 'text-green-400';
                  case 'chamber_of_commerce': return 'text-purple-400';
                  default: return 'text-gray-400';
                }
              };

              const hasEffects = Object.keys(activeEffects).length > 0;

              return (
                <div key={factionSupport.type} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h4 className={`text-lg font-bold mb-3 ${getFactionColor(factionSupport.type)}`}>
                    {getFactionName(factionSupport.type)}
                  </h4>
                  <div className="space-y-2">
                    {hasEffects ? (
                      Object.entries(activeEffects).map(([effectKey, effectValue]) => {
                        if (effectValue === undefined) return null;
                        
                        const getEffectName = (key: string) => {
                          switch (key) {
                            case 'taxMultiplier': return '税収倍率';
                            case 'populationGrowthMultiplier': return '人口増加倍率';
                            case 'populationOutflowRate': return '人口流出率';
                            case 'satisfactionBonus': return '満足度ボーナス';
                            case 'satisfactionPenalty': return '満足度ペナルティ';
                            case 'facilityEfficiencyMultiplier': return '施設効率倍率';
                            case 'constructionCostMultiplier': return '建設コスト倍率';
                            case 'infrastructureEfficiencyBonus': return 'インフラ効率ボーナス';
                            case 'subsidyMultiplier': return '補助金倍率';
                            case 'workforceEfficiencyBonus': return '労働力効率ボーナス';
                            case 'maintenanceCostMultiplier': return '維持費倍率';
                            default: return key;
                          }
                        };

                        const getEffectValue = (key: string, value: number) => {
                          if (key.includes('Multiplier')) {
                            return `${(value * 100).toFixed(0)}%`;
                          }
                          if (key.includes('Bonus') || key.includes('Penalty')) {
                            return value > 0 ? `+${value}` : `${value}`;
                          }
                          if (key.includes('Rate')) {
                            return `${(value * 100).toFixed(1)}%`;
                          }
                          return value.toString();
                        };

                        const getEffectColor = (key: string, value: number) => {
                          if (key.includes('Penalty') || key.includes('Outflow')) {
                            return 'text-red-400';
                          }
                          if (value > 1 || (key.includes('Bonus') && value > 0)) {
                            return 'text-green-400';
                          }
                          if (value < 1 || (key.includes('Penalty') && value < 0)) {
                            return 'text-red-400';
                          }
                          return 'text-gray-400';
                        };

                        return (
                          <div key={effectKey} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{getEffectName(effectKey)}</span>
                            <span className={`font-bold ${getEffectColor(effectKey, effectValue)}`}>
                              {getEffectValue(effectKey, effectValue)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-gray-400 text-sm">
                        標準効果（変更なし）
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 秘書タブのコンテンツ
  const renderSecretaryTab = () => (
    <div className="space-y-6">
      {/* 秘書情報カード */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-200">
          <TbIdBadge className="text-blue-400" />
          秘書情報
        </h3>
        <div className="text-center text-gray-400">
          <p className="mb-2">秘書機能は現在開発中です</p>
          <p className="text-sm">この機能では以下を提供予定です：</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• 現在の開発状況のアドバイス</li>
            <li>• 都市運営のヒント</li>
            <li>• 問題点の早期発見</li>
            <li>• 最適化提案</li>
          </ul>
        </div>
      </div>
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
      case 'support':
        return renderSupportTab();
      case 'secretary':
        return renderSecretaryTab();
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
