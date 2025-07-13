import { useState } from 'react';
import { Grid } from './components/grid';
import { FacilitySelector } from './components/FacilitySelector';
import { InfoPanel } from './components/InfoPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { CreditsPanel } from './components/CreditsPanel';
import { TbCrane, TbCraneOff, TbSettings } from "react-icons/tb";
// --- 追加ここまで ---
import './App.css';


// --- ここから追加：型定義と施設データ ---
// 本来は外部の型定義ファイル（./types/*.ts）に記述される内容です．
// このファイルを単体で動作させるために，ここに必要な定義を追加しました．

// グリッド上の位置を表す型
export interface Position {
  x: number;
  y: number;
}

// 施設の種類を定義する型
export type FacilityType = 'residential' | 'commercial' | 'industrial' | 'road';

// 施設のカテゴリを定義する型
export type CategoryKey = 'residential' | 'commercial' | 'industrial' | 'infrastructure';

// 設置された施設を表す型
export interface Facility {
  id: string;
  type: FacilityType;
  position: Position;
  occupiedTiles: Position[];
}

// ゲームの統計情報を表す型
export interface GameStats {
  money: number;
  population: number;
  satisfaction: number;
  date: {
    year: number;
    month: number;
  };
}

// 各施設の詳細データ
export const FACILITY_DATA: Record<FacilityType, {
  name: string;
  description: string;
  cost: number;
  size: number;
  category: CategoryKey;
  type: FacilityType;
}> = {
  residential: { name: '住宅', description: '住民が住むための家', cost: 100, size: 1, category: 'residential', type: 'residential' },
  commercial: { name: '商業施設', description: 'お店やオフィス', cost: 500, size: 1, category: 'commercial', type: 'commercial' },
  industrial: { name: '工業地帯', description: '製品を生産する工場', cost: 1000, size: 1, category: 'industrial', type: 'industrial' },
  road: { name: '道路', description: '施設と施設をつなぐ道', cost: 20, size: 1, category: 'infrastructure', type: 'road' },
};

// --- 追加ここまで ---


function App() {
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showPanel, setShowPanel] = useState<boolean>(false); // パネルの表示状態
  // --- ここから追加 ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  // --- 追加ここまで ---

  // ゲーム統計情報
  const [gameStats, setGameStats] = useState<GameStats>({
    money: 10000,
    population: 0,
    satisfaction: 50,
    date: { year: 2024, month: 1 }
  });

  const GRID_WIDTH = 20;  // グリッドの幅
  const GRID_HEIGHT = 20; // グリッドの高さ

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

  // --- ここから追加 ---
  const handleShowCredits = () => {
    setIsSettingsOpen(false);
    setIsCreditsOpen(true);
  };
  // --- 追加ここまで ---

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* 情報パネル */}
      <InfoPanel stats={gameStats} />
      
        {/* ゲームグリッド */}
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
      {/* パネル切り替えボタン */}
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {showPanel ? <TbCraneOff/> : <TbCrane/>}
      </button>

      {/* --- ここから追加 --- */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-20 right-4 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors z-[900]"
      >
        <TbSettings size={24} />
      </button>
      {/* --- 追加ここまで --- */}

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

      {/* --- ここから追加 --- */}
      {isSettingsOpen && (
        <SettingsPanel 
          onClose={() => setIsSettingsOpen(false)} 
          onShowCredits={handleShowCredits} 
        />
      )}

      {isCreditsOpen && <CreditsPanel onClose={() => setIsCreditsOpen(false)} />}
      {/* --- 追加ここまで --- */}
    </div>
  );
}

export default App;

