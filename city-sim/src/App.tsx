import { useState } from 'react'
import { Grid } from './components/grid'
import type { Position } from './types/grid'
import './App.css'

function App() {
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);

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
