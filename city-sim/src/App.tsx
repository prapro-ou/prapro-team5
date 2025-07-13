import { useState } from 'react'
import { Grid } from './components/grid'
import { FacilitySelector } from './components/FacilitySelector'
import { InfoPanel } from './components/InfoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { CreditsPanel } from './components/CreditsPanel'
import type { Position } from './types/grid'
import type { Facility, FacilityType } from './types/facility'
import type { GameStats } from './types/game'
import { FACILITY_DATA } from './types/facility'
import './App.css'
import { TbCrane ,TbCraneOff, TbSettings } from "react-icons/tb";

function App() {
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showPanel, setShowPanel] = useState<boolean>(false); // パネルの表示状態

  // 設定パネルとクレジットパネルの表示状態を管理
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  // ゲーム統計情報
  const [gameStats, setGameStats] = useState<GameStats>({
    money: 10000,
    population: 0,
    satisfaction: 50,
    date: { year: 2024, month: 1 }
  });

  const GRID_WIDTH = 20; // グリッドの幅
  const GRID_HEIGHT = 20;// グリッドの高さ　

  // 施設配置処理
  const placeFacility = (position: Position, type: FacilityType) => {
    const facilityData = FACILITY_DATA[type];
    // 施設のタイル半径
    const radius = Math.floor(facilityData.size / 2);
    const occupiedTiles: Position[] = [];
    // 範囲外チェック
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = position.x + dx;
        const y = position.y + dy;

        // 範囲外チェック
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
          console.warn(`施設の配置が範囲外です`);
          return;
        }
        occupiedTiles.push({ x, y });
      }
    }
    
    // 既存の施設をチェック
    const existingFacility = facilities.some(facility =>
      facility.occupiedTiles.some(occupied =>
        occupiedTiles.some(newTile =>
          newTile.x === occupied.x && newTile.y === occupied.y
        )
      )
    );

    if (existingFacility) {
      console.warn(`エリア内に既存施設があります`);
      return;
    }

    // 資金チェック
    if (gameStats.money < facilityData.cost) {
      console.warn(`資金が不足しています: ¥${facilityData.cost}`);
      return;
    }

    // 資金を減らす
    setGameStats(prev => ({
      ...prev,
      money: prev.money - facilityData.cost
    }));

    // 施設の配置
    const newFacility: Facility = {
      id: `${type}_${position.x}_${position.y}_${Date.now()}`,
      type,
      position: position,
      occupiedTiles
    };

    setFacilities(prev => [...prev, newFacility]);
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
    } 
    else {
      console.log(`click: (${correctedPosition.x}, ${correctedPosition.y})`);
    }
  };

  // 設定パネルからクレジットパネルへ切り替える関数
  const handleShowCredits = () => {
    setIsSettingsOpen(false);
    setIsCreditsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* 情報パネル */}
      <InfoPanel stats={gameStats} />
      
      {/*ゲームグリッド*/}
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
      {/*パネル切り替えボタン */}
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {showPanel ? <TbCraneOff/> : <TbCrane/>}
      </button>

      {/* 設定パネルを開くボタン */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-20 right-4 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors z-[900]"
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
                money={gameStats.money}
              />
            </div>
        </div>
      )}

      {/* 設定パネルをCSSで非表示にする */}
      <div style={{ display: isSettingsOpen ? 'block' : 'none' }}>
        <SettingsPanel 
          onClose={() => setIsSettingsOpen(false)} 
          onShowCredits={handleShowCredits}
        />
      </div>

      {/* クレジットパネルは状態を持たないので、従来通りでOK */}
      {isCreditsOpen && <CreditsPanel onClose={() => setIsCreditsOpen(false)} />}
    </div>
  );
}

export default App
