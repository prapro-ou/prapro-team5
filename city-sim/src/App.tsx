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
    console.log(`click: (${position.x}, ${position.y})`);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <Grid 
        size={{ width: 20, height: 15 }}
        onTileClick={handleTileClick}
        selectedPosition={selectedTile}
      />
    </div>
  )
}

export default App
