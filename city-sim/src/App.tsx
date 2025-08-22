// import { Grid } from './components/grid'
import { CanvasGrid } from './components/CanvasGrid'
import { FacilitySelector } from './components/FacilitySelector'
import { InfoPanel } from './components/InfoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { CreditsPanel } from './components/CreditsPanel'
import { InfrastructureInfo } from './components/InfrastructureInfo'
import StartScreen from './components/StartScreen'
import RewardPanel from './components/RewardPanel';
import { StatisticsPanel } from './components/StatisticsScreen';
import { YearlyEvaluationResult } from './components/YearlyEvaluationResult';
import MissionPanel from './components/MissionPanel';

import type { Position } from './types/grid'
import type { FacilityType } from './types/facility'
import { FACILITY_DATA } from './types/facility'
import './App.css'
import { TbCrane ,TbCraneOff, TbSettings, TbAlignLeft2, TbAward, TbChartBar, TbChecklist } from "react-icons/tb";
import CitizenFeed from "./components/CitizenFeed";
import { useEffect, useState } from 'react';
import SNSicon from './assets/SNSicon.png';

import { useGameStore } from './stores/GameStore';
import { useFacilityStore } from './stores/FacilityStore'
import { useUIStore } from './stores/UIStore';
import { playBuildSound, playPanelSound } from './components/SoundSettings';
import { useRewardStore } from './stores/RewardStore';
import { useInfrastructureStore } from './stores/InfrastructureStore';
import { useTerrainStore } from './stores/TerrainStore';
import { useTimeControlStore } from './stores/TimeControlStore';
import { startHappinessDecayTask } from './stores/HappinessDecayTask';

// SNSフィード表示用ボタンコンポーネント

const SNSFeedButton = () => {
  const [showSNS, setShowSNS] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowSNS(v => !v)}
        className="fixed bottom-4 right-4 rounded-lg shadow-lg z-[1500]"
        style={{ background: 'transparent', padding: 0, border: 'none' }}
      >
  <img src={SNSicon} alt="SNS" style={{ width: 256, height: 128 }} />
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
    isInfrastructureInfoOpen,
    selectedTile,
    togglePanel,
    openSettings,
    closeSettings,
    closeCredits,
    switchToCredits,
    setSelectedTile,
    toggleInfrastructureInfo,
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
    createFacility 
  } = useFacilityStore();

  // 報酬パネル表示状態のみAppで管理
  const [showRewardPanel, setShowRewardPanel] = useState(false);
  const { rewards, claimReward, updateAchievements, hasClaimableRewards } = useRewardStore();
  // 報酬達成判定はゲーム状態が変わるたびに呼ぶ
  useEffect(() => {
    updateAchievements();
  }, [stats.population, facilities, stats.date.week, stats.date.month, stats.date.year, stats.level, stats.money, updateAchievements]);

  // 時間経過を処理するuseEffect
  useEffect(() => {
    if (showStartScreen) return; // スタート画面中はタイマーを動かさない
    if (isPaused) return; // 一時停止中はタイマーを動かさない

    const interval = getCurrentInterval();
    if (interval === Infinity) return; // 一時停止中

    const timerId = setInterval(() => {
      advanceTime();
    }, interval);

    // コンポーネントが不要になった際にタイマーを解除する（クリーンアップ）
    return () => clearInterval(timerId);
  }, [advanceTime, showStartScreen, isPaused, getCurrentInterval]);

  // 統計画面の状態を監視して時間制御をチェック
  useEffect(() => {
    if (!showStartScreen) {
      checkModalState();
    }
  }, [isStatisticsOpen, showStartScreen, checkModalState]);

  // インフラ計算
  useEffect(() => {
    const { calculateInfrastructure } = useInfrastructureStore.getState();
    calculateInfrastructure(facilities);
  }, [facilities]);

  // 道路接続状態の更新（施設が変更された時のみ）
  useEffect(() => {
    if (!showStartScreen && facilities.length > 0) {
      const { updateRoadConnectivity } = useFacilityStore.getState();
      updateRoadConnectivity({ width: GRID_WIDTH, height: GRID_HEIGHT });
    }
  }, [facilities.length, showStartScreen]); // facilities.lengthのみを監視

   useEffect(() => {
     if (!showStartScreen) {
     startHappinessDecayTask();
     console.log("HappinessDecayTask started");
    }
   }, [showStartScreen, facilities.length]);
  // 地形生成
  const { generateTerrain } = useTerrainStore();
  
  // ゲーム開始時の地形生成（新規ゲーム時のみ）
  useEffect(() => {
    if (!showStartScreen && !localStorage.getItem('city-sim-loaded')) {
      const generatedRoads = generateTerrain({ width: GRID_WIDTH, height: GRID_HEIGHT });
      
      // 生成された道路をFacilityStoreに登録
      if (generatedRoads.length > 0) {
        const { addFacility, createFacility } = useFacilityStore.getState();
        generatedRoads.forEach(road => {
          const roadFacility = createFacility({ x: road.x, y: road.y }, 'road');
          roadFacility.variantIndex = road.variantIndex;
          roadFacility.isConnected = true; // 生成された道路は接続されている
          addFacility(roadFacility);
        });
        
        console.log(`${generatedRoads.length}個の道路が生成されました`);
      }
    }
  }, [showStartScreen, generateTerrain]);

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
    if (type === 'residential') {
      // 道路接続状態を更新
      const { updateRoadConnectivity } = useFacilityStore.getState();
      updateRoadConnectivity({ width: GRID_WIDTH, height: GRID_HEIGHT });
      
      // 更新された施設リストを取得
      const updatedFacilities = useFacilityStore.getState().facilities;
      const placedFacility = updatedFacilities.find(f => f.id === newFacility.id);
      
      // 道路に接続されている場合のみ人口を増やす
      if (placedFacility && placedFacility.isConnected) {
        addPopulation(100);
        console.log('住宅が道路に接続されました。人口が100人増加しました。');
      } else {
        console.log('住宅が道路に接続されていません。人口は増加しません。');
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

  // スタート画面
  if (showStartScreen) {
    return (
      <>
        <StartScreen 
          onStart={() => {
            localStorage.removeItem('city-sim-loaded');
            setShowStartScreen(false);
          }} 
          onShowSettings={openSettings}
          onLoadGame={() => {
            setShowStartScreen(false);
            setTimeout(() => {
              openSettings();
            }, 100);
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
              setShowRewardPanel(v => {
                playPanelSound(); // 開閉どちらでも同じ音
                return !v;
              });
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white w-20 h-12 rounded-lg shadow-lg transition-colors flex items-center justify-center"
          >
            <TbAward size={24} className="text-yellow-400" />
          </button>
          {/* 受け取り可能な報酬がある場合の通知バッジ */}
          {hasClaimableRewards() && (
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
      {/* 報酬パネル */}
      {showRewardPanel && (
        <RewardPanel
          rewards={rewards}
          onClaim={claimReward}
          onClose={() => setShowRewardPanel(false)}
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
      
      {/* インフラパネルボタン */}
      <button
        onClick={toggleInfrastructureInfo}
        className="fixed top-25 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        <TbAlignLeft2 />
      </button>

      {/* 統計画面ボタン */}
      <button
        onClick={openStatistics}
        className="fixed top-40 left-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        <TbChartBar />
      </button>

      {/* ミッションボタン */}
      <button
        onClick={() => {
          openMissionPanel();
        }}
        className="fixed top-55 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        <TbChecklist />
      </button>

      {/* インフラ情報パネル */}
      {isInfrastructureInfoOpen && (
        <div className="fixed top-25 left-25 z-[1100]">
          <InfrastructureInfo onClose={toggleInfrastructureInfo} />
        </div>
      )}

      {/* ゲームグリッド */}
      <div className="pt-20 w-full h-full overflow-hidden">
        <div className="w-full h-full">
          <CanvasGrid 
            size={{ width: GRID_WIDTH, height: GRID_HEIGHT }}
            onTileClick={handleTileClick}
            selectedPosition={selectedTile}
            facilities={facilities}
            selectedFacilityType={selectedFacilityType}
            money={stats.money}
          />
        </div>
      </div>

      {/* パネル切り替えボタン */}
      <button 
        onClick={togglePanel}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {showPanel ? <TbCraneOff/> : <TbCrane/>}
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
            // 現在のゲーム状態をリセット
            // 各ストアを初期状態に戻す
            useGameStore.getState().resetToInitial();
            useFacilityStore.getState().resetToInitial();
            useTerrainStore.getState().resetToInitial({ width: GRID_WIDTH, height: GRID_HEIGHT });
            useInfrastructureStore.getState().resetToInitial();
            useRewardStore.getState().resetToInitial();
            
            // 設定パネルを閉じて、スタート画面を表示
            closeSettings();
            setShowStartScreen(true);
          }}
        />
      </div>
      
      {/* クレジットパネル */}
      {isCreditsOpen && <CreditsPanel onClose={closeCredits} />}
      
      {/* 統計画面 */}
      {/* isStatisticsOpen && (
        <StatisticsPanel onClose={closeStatistics} />
      ) */}
      
      {/* ミッションパネル */}
      {isMissionPanelOpen && (
        <MissionPanel onClose={closeMissionPanel} />
      )}
    </div>
    
  );
}

export default App
