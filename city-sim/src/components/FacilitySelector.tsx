import type { FacilityType } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";

interface FacilitySelectorProps {
  selectedType: FacilityType | null;  // 現在選択されている施設タイプ
  onSelectType: (type: FacilityType | null) => void;  // 選択を変更する関数
}

export function FacilitySelector({ selectedType, onSelectType}: FacilitySelectorProps) {
  return (
    <div>
      <h3 className="text-white text-lg mb-3">施設</h3>

      <button
        onClick={() => onSelectType(null)}
        className={`w-full mb-2 p-2 rounded ${
          selectedType === null
            ? 'bg-blue-600 text-gray-800'
            : 'bg-gray-600 text-gray-500 hover:bg-gray-500'
        }`}
      >
        選択解除
      </button>

      <div className="space-y-2">
        {Object.values(FACILITY_DATA).map((facility) => {
          const isSelected = selectedType === facility.type;
          
          return (
            <button
              key={facility.type}
              onClick={() => onSelectType(facility.type)}
              className={`w-full p-3 rounded text-left transition-colors ${
                isSelected ? 'bg-green-600 text-gray-800' : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold">{facility.name}</div>
              <div className="text-sm">¥{facility.cost}</div>
              <div className="text-xs opacity-75">{facility.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  )
}