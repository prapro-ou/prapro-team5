import { TbArrowLeft, TbUsers, TbBolt, TbBuilding, TbChartBar, TbCash, TbCalendar, TbStar, TbDroplet, TbFlag, TbScale, TbTrophy, TbIdBadge, TbBulb, TbX } from 'react-icons/tb';
import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/GameStore';
import { useEconomyStore } from '../stores/EconomyStore';
import { useProductStore } from '../stores/ProductStore';
import type { ProductType } from '../types/facility';
import { useFacilityStore } from '../stores/FacilityStore';
import { useInfrastructureStore } from '../stores/InfrastructureStore';
import { useSupportStore } from '../stores/SupportStore';
import { CharacterDisplay } from './CharacterDisplay';
import { useSecretaryStore } from '../stores/SecretaryStore';
import { getSeasonalMessages } from '../stores/SecretaryStore';
import { 
  calculatePopulationChange, 
  calculateAttractiveness, 
  calculateHealthIndex, 
  calculateEmploymentScore, 
  calculateHousingCapacity,
  calculateVacancyRate,
  type InfraFactors 
} from '../utils/populationCalculation';

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
  
  // 秘書ストア
  const {
    selectedCharacter,
    characterDisplayState,
    advices,
    conversationMessages,
    changeExpression,
    toggleLayer,
    markAdviceAsRead,
    dismissAdvice,
    addConversationMessage,
    updateSeasonalClothing,
    generateAdvices
  } = useSecretaryStore();

  // 秘書タブがアクティブになった時に会話を生成
  useEffect(() => {
    if (activeTab === 'secretary') {
      // 季節に応じたジャケットの更新
      updateSeasonalClothing(stats.date.month);
      
      // 動的アドバイスの生成（初回のみ）
      const gameState = {
        stats: {
          population: stats.population,
          satisfaction: stats.satisfaction,
          money: stats.money,
          monthlyBalance: stats.monthlyBalance,
          date: stats.date,
          facilities: facilities
        }
      };
      
      // 動的アドバイスを生成（重複防止のため条件付き）
      const currentWeek = stats.date.week;
      const lastAdviceWeek = useSecretaryStore.getState().lastAdviceGenerationWeek;
      
      if (currentWeek > lastAdviceWeek) {
        generateAdvices(gameState, null, { getInfrastructureShortage });
      }
      
      // 季節に応じた会話メッセージを生成
      const seasonalMessages = getSeasonalMessages(stats.date.month);
      
      if (seasonalMessages.length > 0) {
        // 季節メッセージからランダムに1つ選択
        const randomSeasonalMessage = seasonalMessages[Math.floor(Math.random() * seasonalMessages.length)];
        addConversationMessage(randomSeasonalMessage.type, randomSeasonalMessage.content);
      } 
      else {
        // 季節メッセージがない場合のデフォルトメッセージ
        const defaultMessages = [
          'お疲れ様です。今日も都市建設を頑張りましょう！',
          '都市の調子はどうですか？何かお困りのことは？',
          'この都市をさらに発展させていきましょう！',
          '都市建設について何でもお聞きください！'
        ];
        
        const randomMessage = defaultMessages[Math.floor(Math.random() * seasonalMessages.length)];
        addConversationMessage('general', randomMessage);
      }
    }
  }, [activeTab, addConversationMessage, stats.date.month, updateSeasonalClothing, generateAdvices, facilities, stats.date.week]);

  // 月が変わるたびに動的アドバイスを生成
  useEffect(() => {
    const gameState = {
      stats: {
        population: stats.population,
        satisfaction: stats.satisfaction,
        money: stats.money,
        monthlyBalance: stats.monthlyBalance,
        date: stats.date,
        facilities: facilities
      }
    };
    
    // 月が変わるたびに動的アドバイスを生成（重複防止のため条件付き）
    const currentWeek = stats.date.week;
    const lastAdviceWeek = useSecretaryStore.getState().lastAdviceGenerationWeek;
    
    if (currentWeek > lastAdviceWeek) {
      generateAdvices(gameState, null, { getInfrastructureShortage });
    }
  }, [stats.date.month, generateAdvices, facilities, stats.population, stats.satisfaction, stats.money, stats.monthlyBalance, getInfrastructureShortage, stats.date.week]);

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
              <div className="text-2xl font-bold text-purple-400">{Math.floor(stats.money).toLocaleString()}</div>
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

      {/* 都市状態 */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-teal-300 flex items-center gap-2">
          <TbChartBar className="text-teal-400" />
          都市状態（現在値・前月比・12ヶ月推移）
        </h3>
        {(() => {
          type SparkProps = { data: number[]; color: string; };
          const Spark = ({ data, color }: SparkProps) => {
            const w = 180, h = 40, pad = 3;
            const n = Math.max(1, data.length);
            const sx = (w - pad * 2) / Math.max(1, n - 1);
            const clamp01 = (v: number) => Math.max(0, Math.min(100, v));
            const toY = (v: number) => pad + (h - pad * 2) * (1 - clamp01(v) / 100);
            const toX = (i: number) => pad + sx * i;
            const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
            return <svg width={w} height={h}><path d={path} fill="none" stroke={color} strokeWidth={2} /></svg>;
          };

          const cp = stats.cityParameters;
          const acc = stats.monthlyAccumulation;
          const monthIdx = Math.max(0, (stats.date.month - 1) | 0);
          const prevIdx = Math.max(0, monthIdx - 1);
          const prev = acc.monthlyCityParameters && acc.monthlyCityParameters[prevIdx];
          const mcp = acc.monthlyCityParameters ?? new Array(12).fill(null).map(() => ({
            entertainment: 50, security: 50, sanitation: 50, transit: 50, environment: 50, education: 50, disaster_prevention: 50, tourism: 50,
          }));
          const satSeriesRaw = acc.monthlySatisfaction ?? new Array(12).fill(50);
          // 右端が最新（現在の月）になるように12ヶ月ロール
          const buildRolling = (arr: number[]) => {
            const idx = monthIdx; // 0..11（現在の月-1）
            const out: number[] = [];
            for (let i = 11; i >= 0; i--) {
              const k = (idx - i + 12) % 12;
              out.push(arr[k] ?? 50);
            }
            return out;
          };
          const toSeries = (key: keyof typeof mcp[number]) => buildRolling(mcp.map(m => m ? (m as any)[key] as number : 50));
          const satSeries = buildRolling(satSeriesRaw as number[]);
          const getDiffColor = (d: number) => d > 0 ? 'text-green-400' : d < 0 ? 'text-red-400' : 'text-gray-400';
          const getDiffLabel = (d: number) => d === 0 ? '±0' : `${d > 0 ? '+' : ''}${Math.round(d)}`;

          const cards = [
            {
              key: 'satisfaction', name: '満足度', value: stats.satisfaction,
              diff: (acc.monthlySatisfaction?.[monthIdx] ?? stats.satisfaction) - (acc.monthlySatisfaction?.[prevIdx] ?? stats.satisfaction),
              series: satSeries, color: '#fbbf24'
            },
            { key: 'entertainment', name: '娯楽', value: cp?.entertainment ?? 50, diff: prev ? (cp?.entertainment ?? 50) - prev.entertainment : 0, series: toSeries('entertainment'), color: '#22d3ee' },
            { key: 'security', name: '治安', value: cp?.security ?? 50, diff: prev ? (cp?.security ?? 50) - prev.security : 0, series: toSeries('security'), color: '#60a5fa' },
            { key: 'sanitation', name: '衛生', value: cp?.sanitation ?? 50, diff: prev ? (cp?.sanitation ?? 50) - prev.sanitation : 0, series: toSeries('sanitation'), color: '#34d399' },
            { key: 'transit', name: '交通利便性', value: cp?.transit ?? 50, diff: prev ? (cp?.transit ?? 50) - prev.transit : 0, series: toSeries('transit'), color: '#93c5fd' },
            { key: 'environment', name: '環境', value: cp?.environment ?? 50, diff: prev ? (cp?.environment ?? 50) - prev.environment : 0, series: toSeries('environment'), color: '#10b981' },
            { key: 'education', name: '教育', value: cp?.education ?? 50, diff: prev ? (cp?.education ?? 50) - prev.education : 0, series: toSeries('education'), color: '#a78bfa' },
            { key: 'disaster_prevention', name: '防災', value: cp?.disaster_prevention ?? 50, diff: prev ? (cp?.disaster_prevention ?? 50) - prev.disaster_prevention : 0, series: toSeries('disaster_prevention'), color: '#f87171' },
            { key: 'tourism', name: '観光', value: cp?.tourism ?? 50, diff: prev ? (cp?.tourism ?? 50) - prev.tourism : 0, series: toSeries('tourism'), color: '#fb7185' },
          ];

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map(card => (
                <div key={card.key} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="text-sm text-gray-300 mb-1">{card.name}</div>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-2xl font-bold text-teal-300">{Math.round(card.value)}</div>
                    <div className={`text-sm font-bold ${getDiffColor(card.diff)}`}>{getDiffLabel(card.diff)}</div>
                  </div>
                  <Spark data={card.series as number[]} color={card.color} />
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* 人口詳細セクション */}
      {(() => {
        // 人口計算に必要なデータを準備
        const infraStatus = getInfrastructureStatus();
        const infraFactors: InfraFactors = {
          waterDemand: infraStatus.water.demand,
          waterSupply: infraStatus.water.supply,
          electricityDemand: infraStatus.electricity.demand,
          electricitySupply: infraStatus.electricity.supply,
        };

        const population = stats.population || 0;
        const workforce = Math.floor(population * 0.6);
        const employed = stats.workforceAllocations.reduce((acc, a) => acc + (a.assignedWorkforce || 0), 0);
        const unemploymentRate = workforce > 0 ? Math.max(0, (workforce - employed) / workforce) : 0;

        // 人口増減を計算
        const populationResult = calculatePopulationChange({
          population,
          satisfaction: stats.satisfaction,
          unemploymentRate,
          facilities,
          cityParameters: stats.cityParameters,
          infra: infraFactors,
        });

        // 各パラメータを計算
        const attractiveness = calculateAttractiveness(stats.satisfaction);
        const healthIndex = calculateHealthIndex(stats.cityParameters, infraFactors);
        const employmentScore = calculateEmploymentScore(unemploymentRate);
        const housingCapacity = calculateHousingCapacity(facilities);
        const vacancyRate = calculateVacancyRate(population, housingCapacity);

        return (
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
            <h3 className="text-lg font-bold mb-3 text-cyan-300 flex items-center gap-2">
              <TbUsers className="text-cyan-400" />
              人口詳細
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 人口増減カード */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">月次人口増減</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">出生</span>
                    <span className="text-lg font-bold text-green-400">+{populationResult.births.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">死亡</span>
                    <span className="text-lg font-bold text-red-400">-{populationResult.deaths.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">転入</span>
                    <span className="text-lg font-bold text-blue-400">+{populationResult.inflow.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">転出</span>
                    <span className="text-lg font-bold text-orange-400">-{populationResult.outflow.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-200 font-semibold">月次増減</span>
                      <span className={`text-xl font-bold ${populationResult.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {populationResult.delta >= 0 ? '+' : ''}{populationResult.delta.toLocaleString()}
                      </span>
                    </div>
                    {populationResult.appliedHousingCap && (
                      <div className="text-xs text-yellow-400 mt-1">⚠️ 住宅容量制限により制限されています</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 人口パラメータカード */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">人口パラメータ</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">魅力度</span>
                    <span className="text-lg font-bold text-purple-400">{(attractiveness * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">健康指数</span>
                    <span className="text-lg font-bold text-green-400">{(healthIndex * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">雇用スコア</span>
                    <span className="text-lg font-bold text-blue-400">{(employmentScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">失業率</span>
                    <span className="text-lg font-bold text-red-400">{(unemploymentRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* 住宅カード */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">住宅状況</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">住宅容量</span>
                    <span className="text-lg font-bold text-cyan-400">{housingCapacity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">現在人口</span>
                    <span className="text-lg font-bold text-blue-400">{population.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">空室率</span>
                    <span className="text-lg font-bold text-green-400">{(vacancyRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">利用率</span>
                    <span className={`text-lg font-bold ${(population / Math.max(1, housingCapacity)) > 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {housingCapacity > 0 ? ((population / housingCapacity) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  {housingCapacity > 0 && population / housingCapacity > 1 && (
                    <div className="text-xs text-red-400 mt-1">⚠️ 過密状態（住宅容量超過）</div>
                  )}
                </div>
              </div>

              {/* 流入・流出係数カード */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">流入・流出係数</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">流入倍率</span>
                    <span className="text-lg font-bold text-blue-400">{populationResult.details.inflowMultiplier.toFixed(2)}×</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">流出倍率</span>
                    <span className="text-lg font-bold text-red-400">{populationResult.details.outflowMultiplier.toFixed(2)}×</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-600">
                    <div className="mb-1">流入倍率の構成:</div>
                    <div className="ml-2">• 魅力度: {(attractiveness * 1.2).toFixed(2)}</div>
                    <div className="ml-2">• 雇用: {(employmentScore * 0.8).toFixed(2)}</div>
                    <div className="ml-2">• 空室率: {(vacancyRate * 1.0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 人口増減グラフセクション */}
      {(() => {
        const acc = stats.monthlyAccumulation;
        const monthIdx = Math.max(0, (stats.date.month - 1) | 0);
        
        // 12ヶ月のロール配列を構築（右端が最新）
        const buildRolling = (arr: number[] | undefined) => {
          if (!arr || arr.length === 0) return new Array(12).fill(0);
          const idx = monthIdx;
          const out: number[] = [];
          for (let i = 11; i >= 0; i--) {
            const k = (idx - i + 12) % 12;
            out.push(arr[k] ?? 0);
          }
          return out;
        };

        const births = buildRolling(acc.monthlyBirths);
        const deaths = buildRolling(acc.monthlyDeaths);
        const inflow = buildRolling(acc.monthlyInflow);
        const outflow = buildRolling(acc.monthlyOutflow);
        const delta = buildRolling(acc.monthlyDelta);
        const housingCapacity = buildRolling(acc.monthlyHousingCapacity);
        const population = buildRolling(acc.monthlyPopulation);

        // 最大値を見つけてスケーリング用に使用（deltaは絶対値で比較）
        const maxDelta = Math.max(...delta.map(d => Math.abs(d)));

        // グラフコンポーネント
        type LineChartProps = {
          data: number[];
          maxValue: number;
          width?: number;
          height?: number;
          color: string;
          label: string;
        };

        const LineChart = ({ data, maxValue, width = 300, height = 80, color, label }: LineChartProps) => {
          const pad = 4;
          const w = width - pad * 2;
          const h = height - pad * 2 - 20; // ラベル用のスペース
          const n = Math.max(1, data.length);
          const sx = w / Math.max(1, n - 1);
          
          const toY = (v: number) => {
            if (maxValue === 0) return h / 2;
            const normalized = Math.max(0, Math.min(1, v / maxValue));
            return pad + h * (1 - normalized);
          };
          const toX = (i: number) => pad + sx * i;
          
          const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
          const areaPath = path + ` L${toX(data.length - 1)},${pad + h} L${pad},${pad + h} Z`;
          
          return (
            <div className="space-y-1">
              <div className="text-xs text-gray-400">{label}</div>
              <svg width={width} height={height}>
                <defs>
                  <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#gradient-${label})`} />
                <path d={path} fill="none" stroke={color} strokeWidth={2} />
                {data.map((v, i) => (
                  <circle key={i} cx={toX(i)} cy={toY(v)} r={2} fill={color} />
                ))}
              </svg>
              <div className="text-xs text-gray-500">
                {maxValue > 0 ? `最大: ${maxValue.toLocaleString()}` : 'データなし'}
              </div>
            </div>
          );
        };

        // 複数系列のグラフ
        type MultiLineChartProps = {
          series: Array<{ data: number[]; color: string; label: string }>;
          maxValue: number;
          width?: number;
          height?: number;
        };

        const MultiLineChart = ({ series, maxValue, width = 300, height = 120, }: MultiLineChartProps) => {
          const pad = 4;
          const w = width - pad * 2;
          const h = height - pad * 2 - 20;
          const n = Math.max(1, series[0]?.data.length || 0);
          const sx = w / Math.max(1, n - 1);
          
          const toY = (v: number) => {
            if (maxValue === 0) return h / 2;
            const normalized = Math.max(0, Math.min(1, v / maxValue));
            return pad + h * (1 - normalized);
          };
          const toX = (i: number) => pad + sx * i;
          
          return (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">月次推移（過去12ヶ月）</div>
              <svg width={width} height={height}>
                {series.map((s, idx) => {
                  const path = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
                  return (
                    <g key={idx}>
                      <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={idx === 0 ? '0' : '4,2'} />
                      {s.data.map((v, i) => (
                        <circle key={i} cx={toX(i)} cy={toY(v)} r={1.5} fill={s.color} />
                      ))}
                    </g>
                  );
                })}
              </svg>
              <div className="flex flex-wrap gap-3 text-xs">
                {series.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded ${idx === 0 ? 'bg-current' : ''}`} style={{ 
                      backgroundColor: s.color,
                      borderStyle: idx === 0 ? 'none' : 'dashed',
                      borderWidth: idx === 0 ? 0 : 1,
                    }}></div>
                    <span className="text-gray-400">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        };

        return (
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
            <h3 className="text-lg font-bold mb-3 text-cyan-300 flex items-center gap-2">
              <TbChartBar className="text-cyan-400" />
              人口増減グラフ（過去12ヶ月）
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 人口増減内訳グラフ */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">人口増減内訳</h4>
                <MultiLineChart
                  series={[
                    { data: births, color: '#10b981', label: '出生' },
                    { data: deaths, color: '#ef4444', label: '死亡' },
                    { data: inflow, color: '#3b82f6', label: '転入' },
                    { data: outflow, color: '#f97316', label: '転出' },
                  ]}
                  maxValue={Math.max(...births, ...deaths, ...inflow, ...outflow, 1)}
                  width={300}
                  height={140}
                />
              </div>

              {/* 月次増減グラフ */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">月次人口増減</h4>
                <LineChart
                  data={delta}
                  maxValue={Math.max(maxDelta, 1)}
                  width={300}
                  height={100}
                  color={delta[delta.length - 1] >= 0 ? '#10b981' : '#ef4444'}
                  label="増減"
                />
              </div>

              {/* 人口と住宅容量グラフ */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">人口と住宅容量</h4>
                <MultiLineChart
                  series={[
                    { data: population, color: '#3b82f6', label: '人口' },
                    { data: housingCapacity, color: '#8b5cf6', label: '住宅容量' },
                  ]}
                  maxValue={Math.max(...population, ...housingCapacity, 1)}
                  width={300}
                  height={140}
                />
              </div>

              {/* 統計情報 */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-md font-bold mb-3 text-gray-200">統計情報</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">平均出生数/月</span>
                    <span className="font-bold text-green-400">
                      {births.reduce((a, b) => a + b, 0) > 0 
                        ? Math.round(births.reduce((a, b) => a + b, 0) / births.filter(b => b > 0).length || 1)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">平均死亡数/月</span>
                    <span className="font-bold text-red-400">
                      {deaths.reduce((a, b) => a + b, 0) > 0
                        ? Math.round(deaths.reduce((a, b) => a + b, 0) / deaths.filter(d => d > 0).length || 1)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">平均転入数/月</span>
                    <span className="font-bold text-blue-400">
                      {inflow.reduce((a, b) => a + b, 0) > 0
                        ? Math.round(inflow.reduce((a, b) => a + b, 0) / inflow.filter(i => i > 0).length || 1)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">平均転出数/月</span>
                    <span className="font-bold text-orange-400">
                      {outflow.reduce((a, b) => a + b, 0) > 0
                        ? Math.round(outflow.reduce((a, b) => a + b, 0) / outflow.filter(o => o > 0).length || 1)
                        : 0}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-200 font-semibold">総人口増加</span>
                      <span className={`font-bold ${delta.reduce((a, b) => a + b, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta.reduce((a, b) => a + b, 0) >= 0 ? '+' : ''}{delta.reduce((a, b) => a + b, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
              <span className="text-lg font-bold text-yellow-400">{Math.floor(stats.money).toLocaleString()}</span>
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
    
    // 製品カテゴリの定義
    const productTypes: ProductType[] = ['raw_material', 'intermediate_product', 'final_product', 'service'];
    const productNames: Record<ProductType, string> = {
      raw_material: '原材料',
      intermediate_product: '中間製品',
      final_product: '最終製品',
      service: 'サービス'
    };
    
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
            {productTypes.map((productType) => (
              <div key={productType} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">{productNames[productType]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">需要:</span>
                    <span className="text-blue-400">{demand[productType]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">供給:</span>
                    <span className="text-green-400">{production[productType]}</span>
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
    <div className="relative">
      {/* アドバイスセクション */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg mr-60 overflow-y-auto" style={{ height: 'calc(100vh - 9em)' }}>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-200">
          <TbBulb className="text-yellow-400" />
          都市開発アドバイス
        </h3>
        <div className="space-y-3">
          {advices.filter(advice => !advice.isDismissed).map((advice) => (
            <div
              key={advice.id}
              className={`bg-gray-700 rounded-lg p-3 border-l-4 ${
                advice.priority === 'urgent' ? 'border-red-500' :
                advice.priority === 'high' ? 'border-orange-500' :
                advice.priority === 'medium' ? 'border-yellow-500' :
                'border-blue-500'
              } ${advice.isRead ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold text-gray-200 text-sm">{advice.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${
                      advice.priority === 'urgent' ? 'bg-red-600 text-white' :
                      advice.priority === 'high' ? 'bg-orange-600 text-white' :
                      advice.priority === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {advice.priority === 'urgent' ? '緊急' :
                       advice.priority === 'high' ? '高' :
                       advice.priority === 'medium' ? '中' :
                       '低'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-s mb-1">{advice.message}</p>
                  {advice.suggestion && (
                    <p className="text-blue-300 text-s italic">{advice.suggestion}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  {!advice.isRead && (
                    <button
                      onClick={() => markAdviceAsRead(advice.id)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      既読
                    </button>
                  )}
                  <button
                    onClick={() => dismissAdvice(advice.id)}
                    className="text-gray-400 hover:text-red-400 text-xs"
                  >
                    <TbX size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {advices.filter(advice => !advice.isDismissed).length === 0 && (
            <div className="text-center text-gray-400 py-4 text-sm">
              現在のアドバイスはありません
            </div>
          )}
        </div>
      </div>
      {/* 秘書キャラクター*/}
      <div className="fixed -bottom-1 right-28 shadow-lg z-50 pointer-events-none">
        {/* 会話メッセージボックス */}
        <div className="fixed bottom-90 right-1.5 p-3 bg-blue-900 rounded-lg border border-blue-600 shadow-lg w-64">
          <div className="flex-1">
            <div className="text-xs text-blue-200 mb-1">
              秘書からのメッセージ
            </div>
            <div className="text-white text-sm leading-relaxed">
              {conversationMessages.length > 0 && conversationMessages[0]?.content 
                ? conversationMessages[0].content 
                : '都市建設について何でもお聞きください！'
              }
            </div>
          </div>
        </div>
        
        <div className="w-48">
          <CharacterDisplay
            character={selectedCharacter}
            displayState={characterDisplayState}
            callbacks={{
              onExpressionChange: changeExpression,
              onLayerToggle: toggleLayer,
              onCharacterChange: () => {
                console.log('Character change requested');
              }
            }}
            className="text-white"
            size="xl"
          />
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
