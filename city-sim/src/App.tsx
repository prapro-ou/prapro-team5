import { useState } from 'react';
import { Grid } from './components/grid';
import { FacilitySelector } from './components/FacilitySelector';
import { InfoPanel } from './components/InfoPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { CreditsPanel } from './components/CreditsPanel'; // CreditsPanelをインポート
import type { Position } from './types/grid';
import type { Facility, FacilityType } from './types/facility';
import type { GameStats } from './types/game';
import { FACILITY_DATA } from './types/facility';
import './App.css';
import { TbCrane, TbCraneOff, TbSettings } from "react-icons/tb";

/**
 * アプリケーションのメインコンポーネント．
 * すべてのUIとゲームロジックを統括する．
 */
function App() {
  // --- State Declarations ---
  // ゲームの盤面に関する状態
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // 各パネルの表示状態
  const [showPanel, setShowPanel] = useState<boolean>(false); // 建設パネル
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 設定パネル
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);   // クレジットパネル

  // ゲームの統計情報
  const [gameStats, setGameStats] = useState<GameStats>({
    money: 10000,
    population: 0,
    satisfaction: 50,
    date: { year: 2024, month: 1 }
  });

  // グリッドのサイズ定義
  const GRID_WIDTH = 20;
  const GRID_HEIGHT = 20;

  // --- Functions ---

  /**
   * 指定された位置に施設を配置する．
   * @param position - 配置する中心タイルの位置
   * @param type - 配置する施設の種類
   */
  const placeFacility = (position: Position, type: FacilityType) => {
    const facilityData = FACILITY_DATA[type];
    const radius = Math.floor(facilityData.size / 2);
    const occupiedTiles: Position[] = [];

    // 施設の占有範囲を計算し，グリッド範囲外でないかチェックする
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = position.x + dx;
        const y = position.y + dy;
        
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
          console.warn(`施設の配置が範囲外です`);
          return;
        }
        occupiedTiles.push({ x, y });
      }
    }
    
    // 他施設との重複をチェックする
    const isOccupied = facilities.some(facility =>
      facility.occupiedTiles.some(occupied =>
        occupiedTiles.some(newTile =>
          newTile.x === occupied.x && newTile.y === occupied.y
        )
      )
    );

    if (isOccupied) {
      console.warn(`エリア内に既存施設があります`);
      return;
    }

    // 資金が足りるかチェックする
    if (gameStats.money < facilityData.cost) {
      console.warn(`資金が不足しています: ¥${facilityData.cost}`);
      return;
    }

    // コスト分だけ資金を減らす
    setGameStats(prev => ({
      ...prev,
      money: prev.money - facilityData.cost
    }));

    // 新しい施設オブジェクトを作成し，stateに追加する
    const newFacility: Facility = {
      id: `${type}_${position.x}_${position.y}_${Date.now()}`,
      type,
      position: position,
      occupiedTiles
    };

    setFacilities(prev => [...prev, newFacility]);
    console.log(`Placed ${facilityData.name} at (${position.x}, ${position.y})`);
  };

  /**
   * グリッド上のタイルがクリックされたときの処理．
   * @param position - クリックされたタイルの位置
   */
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

  /**
   * 設定パネルからクレジットパネルへ切り替えるための関数．
   */
  const handleShowCredits = () => {
    setIsSettingsOpen(false); // 設定パネルを閉じ，
    setIsCreditsOpen(true);   // クレジットパネルを開く．
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* 上部の情報パネル */}
      <InfoPanel stats={gameStats} />
      
      {/* 中央のゲームグリッド */}
      <div className="pt-20 flex justify-center items-center h-[calc(100vh-5rem)]">
        <div className="relative z-[100] overflow-auto max-w-full max-h-full border border-gray-600 rounded-lg bg-gray-800/20 p-4">
          <Grid 
            size={{ width: GRID_WIDTH, height: GRID_HEIGHT }}
            onTileClick={handleTileClick}
            selectedPosition={selectedTile}
            facilities={facilities}
            selectedFacilityType={selectedFacilityType}
            money={gameStats.money}
          />
        </div>
      </div>
      
      {/* 画面端のUIボタン群 */}
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {showPanel ? <TbCraneOff/> : <TbCrane/>}
      </button>

      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-20 right-4 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors z-[900]"
      >
        <TbSettings size={24} />
      </button>

      {/* 各種パネル（条件に応じて表示） */}
      {showPanel && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/10 p-6 rounded-lg shadow-2xl z-[800] backdrop-blur-sm w-2xl">
            <div className="flex-1">
              <FacilitySelector 
                selectedType={selectedFacilityType}
                onSelectType={setSelectedFacilityType}
                money={gameStats.money}
              />
            </div>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsPanel 
          onClose={() => setIsSettingsOpen(false)} 
          onShowCredits={handleShowCredits} 
        />
      )}

      {isCreditsOpen && <CreditsPanel onClose={() => setIsCreditsOpen(false)} />}
    </div>
  );
}

export default App;