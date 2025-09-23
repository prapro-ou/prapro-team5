// import { Grid } from './components/grid'
// import { CanvasGrid } from './components/CanvasGrid'
import IsometricGrid from './components/MapGrid'
import LoadingScreen from './components/LoadingScreen'
import { FacilitySelector } from './components/FacilitySelector'
import { InfoPanel } from './components/InfoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { CreditsPanel } from './components/CreditsPanel'
import StartScreen from './components/StartScreen'
import OpeningSequence from './components/OpeningSequence'
import AchievementPanel from './components/AchievementPanel';
import { StatisticsPanel } from './components/StatisticsScreen';
import { YearlyEvaluationResult } from './components/YearlyEvaluationResult';
import MissionPanel from './components/MissionPanel';

import type { Position } from './types/grid'
import type { FacilityType } from './types/facility'
import { FACILITY_DATA } from './types/facility'
import './App.css'
import { TbCrane ,TbCraneOff, TbSettings, TbAward, TbChartBar, TbChecklist, TbBulldozer, TbMessageCircle } from "react-icons/tb";
import CitizenFeed from "./components/CitizenFeed";
import { useEffect, useState } from 'react';

import { useGameStore } from './stores/GameStore';
import { useFacilityStore } from './stores/FacilityStore'
import { useUIStore } from './stores/UIStore';
import { useMissionStore } from './stores/MissionStore';
import { playBuildSound, playPanelSound } from './components/SoundSettings';
import { useAchievementStore } from './stores/AchievementStore';
import { useInfrastructureStore } from './stores/InfrastructureStore';
import { useTerrainStore } from './stores/TerrainStore';
import { useTimeControlStore } from './stores/TimeControlStore';
import { startHappinessDecayTask } from './stores/HappinessDecayTask';
import { useSecretaryStore } from './stores/SecretaryStore';
import { useSupportStore } from './stores/SupportStore';
import { useYearlyEvaluationStore } from './stores/YearlyEvaluationStore';

// SNSフィード表示用ボタンコンポーネント

const SNSFeedButton = () => {
  const [showSNS, setShowSNS] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowSNS(v => !v)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[1500]"
      >
        <TbMessageCircle size={24} />
      </button>
      {showSNS && (
        <div className="fixed bottom-20 right-4 z-[1500]">
          <CitizenFeed />
        </div>
      )}
    </>
  );
};

function App() {
  // UI状態
  const {
    showPanel,
    isSettingsOpen,
    isCreditsOpen,
    selectedTile,
    togglePanel,
    openSettings,
    closeSettings,
    closeCredits,
    switchToCredits,
    setSelectedTile,
    isStatisticsOpen,
    openStatistics,
    closeStatistics,
    isYearlyEvaluationResultOpen,
    closeYearlyEvaluationResult,
    isMissionPanelOpen,
    openMissionPanel,
    closeMissionPanel
  } = useUIStore();

  // スタート画面の表示状態
  const [showStartScreen, setShowStartScreen] = useState(true);
  // Pixi 使用切替（フェーズ1検証用）
  const [usePixi, setUsePixi] = useState(true);
  
  // オープニングシーケンスの表示状態
  const [showOpeningSequence, setShowOpeningSequence] = useState(false);
  
  // 強制初期化完了フラグ
  const [isInitializationComplete, setIsInitializationComplete] = useState(false);

  // グリッド初期描画ローディング
  const [isGridLoading, setIsGridLoading] = useState(false);
  const [gridLoadingStartedAt, setGridLoadingStartedAt] = useState<number | null>(null);
  const [gridKey, setGridKey] = useState(0);

  // 施設削除モード状態
  const [deleteMode, setDeleteMode] = useState(false);

  // ゲーム統計情報・レベルアップ通知
  const { stats, spendMoney, advanceTime, addPopulation, recalculateSatisfaction, levelUpMessage, setLevelUpMessage } = useGameStore();
  
  // 時間制御
  const { isPaused, getCurrentInterval, checkModalState } = useTimeControlStore();

  const GRID_WIDTH = 120;  // グリッドの幅
  const GRID_HEIGHT = 120; // グリッドの高さ

  // 施設状態
  const { 
    facilities, 
    selectedFacilityType, 
    setSelectedFacilityType, 
    addFacility,
    checkCanPlace,
    createFacility,
    removeFacility
  } = useFacilityStore();

  const [showAchievementPanel, setShowAchievementPanel] = useState(false);
  const { achievements, claimAchievement, updateAchievements, hasClaimableAchievements, loadAchievementsFromFile } = useAchievementStore();
  
  // 秘書ストア
  const { updateSeasonalClothing } = useSecretaryStore();
  
  // 実績システムの初期化
  useEffect(() => {
    if (isInitializationComplete) {
      console.log('実績システムを初期化中...');
      loadAchievementsFromFile();
    }
  }, [isInitializationComplete, loadAchievementsFromFile]);
  
  // ゲーム開始時の実績読み込み（フォールバック）
  useEffect(() => {
    if (!isInitializationComplete && !showStartScreen && !showOpeningSequence) {
      console.log('ゲーム開始時の実績読み込み...');
      loadAchievementsFromFile();
    }
  }, [showStartScreen, showOpeningSequence, loadAchievementsFromFile, isInitializationComplete]);
  
  // アプリ起動時の実績読み込み（最終フォールバック）
  useEffect(() => {
    console.log('アプリ起動時の実績読み込み...');
    loadAchievementsFromFile();
  }, [loadAchievementsFromFile]);
  
  // 実績達成判定はゲーム状態が変わるたびに呼ぶ
  useEffect(() => {
    if (!isInitializationComplete) return;
    updateAchievements();
  }, [stats.population, facilities, stats.date.week, stats.date.month, stats.date.year, stats.level, stats.money, updateAchievements, isInitializationComplete]);
  
  // 月が変わるたびに季節に応じた服装の更新
  useEffect(() => {
    if (!isInitializationComplete) return;
    updateSeasonalClothing(stats.date.month);
  }, [stats.date.month, updateSeasonalClothing, isInitializationComplete]);

  // 時間経過を処理するuseEffect
  useEffect(() => {
    if (!isInitializationComplete) return;
    if (showStartScreen || showOpeningSequence) return; // スタート画面またはオープニング中はタイマーを動かさない
    if (isPaused) return; // 一時停止中はタイマーを動かさない

    const interval = getCurrentInterval();
    if (interval === Infinity) return; // 一時停止中

    const timerId = setInterval(() => {
      advanceTime();
    }, interval);

    // コンポーネントが不要になった際にタイマーを解除する（クリーンアップ）
    return () => clearInterval(timerId);
  }, [advanceTime, showStartScreen, showOpeningSequence, isPaused, getCurrentInterval, isInitializationComplete]);

  // 統計画面の状態を監視して時間制御をチェック
  useEffect(() => {
    if (!isInitializationComplete) return;
    if (!showStartScreen && !showOpeningSequence) {
      checkModalState();
    }
  }, [isStatisticsOpen, showStartScreen, showOpeningSequence, checkModalState, isInitializationComplete]);

  // インフラ計算
  useEffect(() => {
    if (!isInitializationComplete) return;
    const { calculateInfrastructure } = useInfrastructureStore.getState();
    calculateInfrastructure(facilities);
  }, [facilities, isInitializationComplete]);

  // 道路接続状態の更新（施設が変更された時のみ）
  useEffect(() => {
    if (!isInitializationComplete) return;
    if (!showStartScreen || !showOpeningSequence || facilities.length === 0) return;
    const { updateRoadConnectivity } = useFacilityStore.getState();
    updateRoadConnectivity({ width: GRID_WIDTH, height: GRID_HEIGHT });
  }, [facilities.length, showStartScreen, showOpeningSequence, isInitializationComplete]);

   useEffect(() => {
     if (!isInitializationComplete || !showStartScreen || !showOpeningSequence) return;
     startHappinessDecayTask();
   }, [showStartScreen, showOpeningSequence, facilities.length, isInitializationComplete]);
  // 地形生成
  const { generateTerrain } = useTerrainStore();

  // 施設配置処理
  const placeFacility = (position: Position, type: FacilityType) => {
    const facilityData = FACILITY_DATA[type];
    // 配置可能かチェック
    if (!checkCanPlace(position, type, { width: GRID_WIDTH, height: GRID_HEIGHT })) {
      console.warn(`施設を配置できません`);
      return;
    }
    if (!spendMoney(facilityData.cost)) {
      console.warn(`資金が不足しています: ¥${facilityData.cost}`);
      return;
    }

    // 施設の配置
    const newFacility = createFacility(position, type);
    addFacility(newFacility);
    // 設置音を鳴らす
    playBuildSound();
    // もし設置した施設が住宅なら、道路接続状態をチェックして人口を増やす
    if (facilityData.category === 'residential') {
      // 道路接続状態を更新
      const { updateRoadConnectivity } = useFacilityStore.getState();
      updateRoadConnectivity({ width: GRID_WIDTH, height: GRID_HEIGHT });
      
      // 更新された施設リストを取得
      const updatedFacilities = useFacilityStore.getState().facilities;
      const placedFacility = updatedFacilities.find(f => f.id === newFacility.id);
      
      // 道路に接続されている場合のみ人口を増やす
      if (placedFacility && placedFacility.isConnected) {
        if (typeof facilityData.basePopulation === 'number') {
          addPopulation(facilityData.basePopulation);
        }
      }
    }
    // 施設を設置した後に満足度を再計算する
    // この時、更新後の施設リストを取得して渡す
    recalculateSatisfaction(useFacilityStore.getState().facilities);
    console.log(`Placed ${facilityData.name} at (${position.x}, ${position.y})`);

    // インフラ状況を再計算
    const { calculateInfrastructure } = useInfrastructureStore.getState();
    calculateInfrastructure(useFacilityStore.getState().facilities);
  };

  const handleTileClick = (position: Position) => {
    const correctedPosition = {
      x: Math.max(0, Math.min(GRID_WIDTH - 1, position.x)),
      y: Math.max(0, Math.min(GRID_HEIGHT - 1, position.y))
    };
    
      if (deleteMode) {
        // 削除モード時は施設があれば削除
        const facility = facilities.find(f =>
          f.occupiedTiles.some(tile => tile.x === correctedPosition.x && tile.y === correctedPosition.y)
        );
        if (facility) {
          // 住宅施設なら人口減算
          const facilityData = FACILITY_DATA[facility.type];
          if (facilityData.category === 'residential' && typeof facilityData.basePopulation === 'number') {
            addPopulation(-facilityData.basePopulation);
          }
          removeFacility(facility.id);
          // setDeleteMode(false); // 削除後も削除モードを維持
          return;
        }
      } else {
        // 通常モード
        // 同じ位置をクリックした場合は選択を解除
        if (selectedTile && 
            selectedTile.x === correctedPosition.x && 
            selectedTile.y === correctedPosition.y) {
          setSelectedTile(null);
          return;
        }
        // 新しい位置を選択
        setSelectedTile(correctedPosition);
        if (selectedFacilityType) {
          placeFacility(correctedPosition, selectedFacilityType);
        }
      }
  };

  // レベルアップ通知を一定時間で消す
  useEffect(() => {
    if (levelUpMessage) {
      const timer = setTimeout(() => {
        setLevelUpMessage(null);
      }, 3000); // 3秒で自動消去
      return () => clearTimeout(timer);
    }
  }, [levelUpMessage, setLevelUpMessage]);

  // オープニングシーケンス
  if (showOpeningSequence) {
    return (
      <OpeningSequence 
                onComplete={() => {
          // 初期化完了フラグを有効化
          setIsInitializationComplete(true);
          
          // ゲーム状態を初期化（SaveLoadRegistryの影響を回避するため強制初期化）
          // 副作用はクソ，何もわからん
          useGameStore.setState({
            stats: {
              level: 1,
              money: 10000,
              population: 0,
              satisfaction: 50,
              workforceAllocations: [],
              date: { year: 2024, month: 1, week: 1, totalWeeks: 1 },
              monthlyBalance: { income: 0, expense: 0, balance: 0 },
              yearlyEvaluation: null,
              yearlyStats: null,
              previousYearStats: null,
              previousYearEvaluation: null,
              monthlyAccumulation: {
                year: 2024,
                monthlyTaxRevenue: new Array(12).fill(0),
                monthlyMaintenanceCost: new Array(12).fill(0),
                monthlyPopulation: new Array(12).fill(0),
                monthlySatisfaction: new Array(12).fill(50),
                monthlySupportRatings: {
                  central_government: new Array(12).fill(50),
                  citizens: new Array(12).fill(50),
                  chamber_of_commerce: new Array(12).fill(50)
                }
              },
              supportSystem: {
                factionSupports: [
                  { type: 'central_government', currentRating: 50, previousRating: 50, change: 0 },
                  { type: 'citizens', currentRating: 50, previousRating: 50, change: 0 },
                  { type: 'chamber_of_commerce', currentRating: 50, previousRating: 50, change: 0 }
                ],
                monthlyHistory: [],
                yearlyHistory: [],
                lastCalculationDate: { year: 2024, month: 1 }
              }
            },
            levelUpMessage: null
          });
          
          // 他のストアをリセット
          useFacilityStore.getState().resetToInitial();
          useTerrainStore.getState().resetToInitial({ width: GRID_WIDTH, height: GRID_HEIGHT });
          useInfrastructureStore.getState().resetToInitial();
          useAchievementStore.getState().resetToInitial();
          useMissionStore.getState().resetToInitial();
          useTimeControlStore.getState().resetToInitial();
          useSecretaryStore.getState().resetToInitial();
          useSupportStore.getState().resetToInitial();
          useYearlyEvaluationStore.getState().resetToInitial();

          const generatedRoads = generateTerrain({ width: GRID_WIDTH, height: GRID_HEIGHT });
          if (generatedRoads.length > 0) {
            const { addFacility, createFacility } = useFacilityStore.getState();
            generatedRoads.forEach(road => {
              const roadFacility = createFacility({ x: road.x, y: road.y }, 'road');
              roadFacility.variantIndex = road.variantIndex;
              roadFacility.isConnected = true;
              addFacility(roadFacility);
            });
          }
          
          // オープニング状態を変更
        // グリッド初期描画のローディングを開始
        setIsGridLoading(true);
        setGridLoadingStartedAt(Date.now());
        setShowOpeningSequence(false);
          
          // 初期化完了フラグは既に有効化済み
        }}
      />
    );
  }

  // スタート画面
  if (showStartScreen) {
    return (
      <>
        <StartScreen 
          onStart={() => {
            localStorage.removeItem('city-sim-loaded');
            setShowStartScreen(false);
            setShowOpeningSequence(true);
            setGridKey(k => k + 1);
          }} 
          onShowSettings={openSettings}
          onLoadGame={() => {
            // タイトルからロード後、グリッド初期描画のローディングを先に開始
            setIsGridLoading(true);
            setGridLoadingStartedAt(Date.now());
            // 設定画面は自動で開かない
            setShowStartScreen(false);
            // Gridを確実に再マウント
            setGridKey(k => k + 1);
          }}
        />
        {/* スタート画面中でも設定パネルを表示可能にする */}
        {isSettingsOpen && (
          <SettingsPanel 
            onClose={closeSettings} 
            onShowCredits={switchToCredits}
            isGameStarted={false}
            onReturnToTitle={() => {
              closeSettings();
              setShowStartScreen(true);
            }}
          />
        )}
        {/* スタート画面でもクレジットパネルを表示可能にする */}
        {isCreditsOpen && (
          <CreditsPanel onClose={closeCredits} />
        )}
      </>
    );
  }

  // 統計画面
  if (isStatisticsOpen) {
    return (
      <StatisticsPanel onClose={closeStatistics} />
    );
  }

  // 年末評価結果表示画面
  if (isYearlyEvaluationResultOpen) {
    return (
      <YearlyEvaluationResult onClose={closeYearlyEvaluationResult} />
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      {/* 右上に設定ボタンと報酬ボタンを並べて配置 */}
      <div className="fixed top-4 right-5 flex gap-4 z-[1200] items-center">
        <div className="relative">
          <button
            onClick={() => {
              setShowAchievementPanel(v => {
                playPanelSound(); // 開閉どちらでも同じ音
                return !v;
              });
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white w-20 h-12 rounded-lg shadow-lg transition-colors flex items-center justify-center"
          >
            <TbAward size={24} className="text-yellow-400" />
          </button>
          {/* 受け取り可能な報酬がある場合の通知バッジ */}
          {hasClaimableAchievements() && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <button 
          onClick={openSettings}
          className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <TbSettings size={26} />
        </button>
      </div>
      {/* 実績パネル */}
      {showAchievementPanel && (
        <AchievementPanel
          achievements={achievements}
          onClaim={claimAchievement}
          onClose={() => setShowAchievementPanel(false)}
        />
      )}
      {/* レベルアップ通知 */}
      {levelUpMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xl font-bold px-8 py-4 rounded-lg shadow-lg z-[2000] animate-bounce">
          {levelUpMessage}
        </div>
      )}
      {/* 情報パネル */}
      <InfoPanel />
      
      {/* 統計画面ボタン */}
      <button
        onClick={openStatistics}
        className="fixed top-25 left-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        <TbChartBar />
      </button>

      {/* ミッションボタン */}
      <button
        onClick={() => {
          openMissionPanel();
        }}
        className="fixed top-40 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        <TbChecklist />
      </button>



      {/* ゲームグリッド */}
      <div className="pt-20 w-full h-full overflow-hidden">
        <div className="w-full h-full">
          <IsometricGrid
            key={gridKey}
            size={{ width: GRID_WIDTH, height: GRID_HEIGHT }}
            onTileClick={handleTileClick}
            onReady={async () => {
              // 最小表示時間200msを確保
              const started = gridLoadingStartedAt ?? Date.now();
              const elapsed = Date.now() - started;
              const remain = Math.max(0, 200 - elapsed);
              if (remain > 0) await new Promise((r) => setTimeout(r, remain));
              setIsGridLoading(false);
              setGridLoadingStartedAt(null);
            }}
            selectedPosition={selectedTile}
            facilities={facilities}
            selectedFacilityType={selectedFacilityType}
            money={stats.money}
            deleteMode={deleteMode}
          />
        </div>
      </div>

      {/* 施設削除モード切替ボタン */}
      <button
        onClick={() => {
          playPanelSound();
          setDeleteMode(v => !v);
        }}
        className={`fixed bottom-20 left-4 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[950] ${deleteMode ? 'ring-4 ring-red-400' : ''}`}
      >
        <TbBulldozer/>
      </button>
      {/* 建設モード切り替えボタン */}
      <button 
        onClick={togglePanel}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {showPanel ? <TbCraneOff/> : <TbCrane/>}
      </button>
      {/* Pixi/Canvas 切替ボタン（検証用） */}
      <button
        onClick={() => setUsePixi(v => !v)}
        className="fixed bottom-4 right-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {usePixi ? 'Canvasに切替' : 'Pixiに切替'}
      </button>

      {/* 施設建設パネル */}
      {showPanel && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/10 p-6 rounded-lg shadow-2xl z-[800] backdrop-blur-sm w-2xl">
          <div className="flex-1">
            <FacilitySelector 
              selectedType={selectedFacilityType}
              onSelectType={setSelectedFacilityType}
              money={stats.money}
            />
          </div>
        </div>
      )}

      {/* SNSを見るボタンとフィード表示 */}
      <SNSFeedButton />

      {/* 設定パネルをCSSで非表示にする */}
      <div style={{ display: isSettingsOpen ? 'block' : 'none' }}>
        <SettingsPanel 
          onClose={closeSettings} 
          onShowCredits={switchToCredits}
          isGameStarted={!showStartScreen}
                      onReturnToTitle={() => {
              // 初期化完了フラグを一時的に無効化
              setIsInitializationComplete(false);
              
              // 現在のゲーム状態をリセット
              // 各ストアを初期状態に戻す
              useGameStore.getState().resetToInitial();
              useFacilityStore.getState().resetToInitial();
              useTerrainStore.getState().resetToInitial({ width: GRID_WIDTH, height: GRID_HEIGHT });
              useInfrastructureStore.getState().resetToInitial();
              useAchievementStore.getState().resetToInitial();
              useMissionStore.getState().resetToInitial();
              
              // 設定パネルを閉じて、スタート画面を表示
              closeSettings();
              setShowStartScreen(true);
              
              // 初期化完了フラグを有効化
              setTimeout(() => {
                setIsInitializationComplete(true);
              }, 100);
            }}
        />
      </div>
      
      {/* クレジットパネル */}
      {isCreditsOpen && <CreditsPanel onClose={closeCredits} />}
      
      {/* ミッションパネル */}
      {isMissionPanelOpen && (
        <MissionPanel onClose={closeMissionPanel} />
      )}

      {/* グリッド初期描画時のローディング */}
      {isGridLoading && (
        <LoadingScreen
          isVisible={true}
          message={'環境を準備しています...'}
          progress={90}
        />
      )}
    </div>
    
  );
}

export default App
