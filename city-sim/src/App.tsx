import { Grid } from './components/grid'
import { FacilitySelector } from './components/FacilitySelector'
import { InfoPanel } from './components/InfoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { CreditsPanel } from './components/CreditsPanel'
import type { Position } from './types/grid'
import type { FacilityType } from './types/facility'
import { FACILITY_DATA } from './types/facility'
import './App.css'
import { TbCrane ,TbCraneOff, TbSettings } from "react-icons/tb";
import { useEffect } from 'react';

import { useGameStore } from './stores/GameStore';
import { useFacilityStore } from './stores/FacilityStore'
import { useUIStore } from './stores/UIStore';

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
    setSelectedTile
  } = useUIStore();

  // ゲーム統計情報・レベルアップ通知
  const { stats, spendMoney, advanceTime, addPopulation, recalculateSatisfaction, levelUpMessage, setLevelUpMessage } = useGameStore();

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

  // 時間経過を処理するuseEffect
  useEffect(() => {
    // 2000ミリ秒（2秒）ごとに1週間進めるタイマーを設定
    const timerId = setInterval(() => {
      advanceTime();
    }, 2000);

    // コンポーネントが不要になった際にタイマーを解除する（クリーンアップ）
    return () => clearInterval(timerId);
  }, [advanceTime]); // advanceTimeは不変だが、作法として依存配列に含める

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
    // もし設置した施設が住宅なら、人口を100人増やす
    if (type === 'residential') {
      addPopulation(100);
    }
    // 施設を設置した後に満足度を再計算する
    // この時、更新後の施設リストを取得して渡す
    recalculateSatisfaction(useFacilityStore.getState().facilities);
    console.log(`Placed ${facilityData.name} at (${position.x}, ${position.y})`);
  };

  const handleTileClick = (position: Position) => {
    const correctedPosition = {
      x: Math.max(0, Math.min(GRID_WIDTH - 1, position.x)),
      y: Math.max(0, Math.min(GRID_HEIGHT - 1, position.y))
    };
    setSelectedTile(correctedPosition);
    if (selectedFacilityType) {
      placeFacility(correctedPosition, selectedFacilityType);
    } else {
      console.log(`click: (${correctedPosition.x}, ${correctedPosition.y})`);
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

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* レベルアップ通知 */}
      {levelUpMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xl font-bold px-8 py-4 rounded-lg shadow-lg z-[2000] animate-bounce">
          {levelUpMessage}
        </div>
      )}
      {/* 情報パネル */}
      <InfoPanel stats={stats} />
      
      {/* ゲームグリッド */}
      <div className="pt-20 flex justify-center items-center h-[calc(100vh-5rem)]">
        <Grid 
          size={{ width: GRID_WIDTH, height: GRID_HEIGHT }}
          onTileClick={handleTileClick}
          selectedPosition={selectedTile}
          facilities={facilities}
          selectedFacilityType={selectedFacilityType}
          money={stats.money}
        />
      </div>
      {/* パネル切り替えボタン */}
      <button 
        onClick={togglePanel}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {showPanel ? <TbCraneOff/> : <TbCrane/>}
      </button>

      {/* 設定パネルを開くボタン */}
      <button 
        onClick={openSettings}
        className="fixed top-4 right-4 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors z-[1100]"
      >
        <TbSettings size={24} />
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

      {/* 設定パネルをCSSで非表示にする */}
      <div style={{ display: isSettingsOpen ? 'block' : 'none' }}>
        <SettingsPanel 
          onClose={closeSettings} 
          onShowCredits={switchToCredits}
        />
      </div>
      {/* クレジットパネル */}
      {isCreditsOpen && <CreditsPanel onClose={closeCredits} />}
    </div>
  );
}

export default App
