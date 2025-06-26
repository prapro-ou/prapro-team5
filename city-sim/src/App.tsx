import { useState } from 'react'
import { Grid } from './components/grid'
import { FacilitySelector } from './components/FacilitySelector'
import type { Position } from './types/grid'
import type { Facility, FacilityType } from './types/facility'
import { FACILITY_DATA } from './types/facility'
import './App.css'

function App() {
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  
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
        if (x < 0 || x >= 40 || y < 0 || y >= 30) {
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
    setSelectedTile(position);
    if (selectedFacilityType) {
      placeFacility(position, selectedFacilityType);
    } 
    else {
      console.log(`click: (${position.x}, ${position.y})`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="flex gap-8">
        {/* 左側: 操作パネル */}
        <div className="w-80 bg-gray-800 p-4 rounded-lg">
          
          <FacilitySelector 
            selectedType={selectedFacilityType}
            onSelectType={setSelectedFacilityType}
          />
          
          {selectedTile && (
            <div className="mt-4 text-white">
              <h3 className="text-lg">選択位置</h3>
              <p>({selectedTile.x}, {selectedTile.y})</p>
            </div>
          )}
        </div>

        {/* 右側: ゲームグリッド */}
        <div className="flex-1">
          <Grid 
            size={{ width: 40, height: 30 }}
            onTileClick={handleTileClick}
            selectedPosition={selectedTile}
            facilities={facilities}
          />
        </div>
      </div>
    </div>
  );
}

export default App
