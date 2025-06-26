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
    
    // 既存の施設をチェック
    const existingFacility = facilities.find(f => f.position.x === position.x && f.position.y === position.y);

    if (existingFacility) {
      console.warn(`すでに施設が配置されています (${position.x}, ${position.y})`);
      return;
    }

    // 施設の配置
    const newFacility: Facility = {
      id: `${type}_${position.x}_${position.y}_${Date.now()}`,
      type,
      position
    };

    setFacilities(prev => [...prev, newFacility]);
    console.log(`Placed ${facilityData.name} at (${position.x}, ${position.y})`);
  };

  const handleTileClick = (position: Position) => {
    setSelectedTile(position);
    if (selectedFacilityType) {
      placeFacility(position, selectedFacilityType);
    } else {
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
