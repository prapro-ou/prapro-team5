import type { CategoryKey, FacilityType } from "../types/facility";
import { FACILITY_DATA, FACILITY_CATEGORIES } from "../types/facility";
import { useState } from "react";

interface FacilitySelectorProps {
  selectedType: FacilityType | null;  // 現在選択されている施設タイプ
  onSelectType: (type: FacilityType | null) => void;  // 選択を変更する関数
  money: number;  // 資金
}

export function FacilitySelector({ selectedType, onSelectType, money}: FacilitySelectorProps) {
  const [category, setCategory] = useState<CategoryKey>("residential");

  const categorizedFacilities = Object.values(FACILITY_DATA).reduce((acc, facility) => {
    const category = facility.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(facility);
    return acc;
  }, {} as Record<CategoryKey, typeof FACILITY_DATA[keyof typeof FACILITY_DATA][]>);

  return (
    <div>
      {/* タブグループ */}
      <div className="flex space-x-1">
        {Object.entries(FACILITY_CATEGORIES).map(([key, categoryInfo]) => (
          <button
            key={key}
            onClick={() => setCategory(key as CategoryKey)}
            className={`px-3 py-1 text-xs rounded-t-lg transition-colors ${
              category === key
                ? 'bg-white text-gray-600 border-b-2 border-green-500 hover:bg-gray-300'
                : 'bg-white text-gray-800 hover:text-gray-600 hover:bg-gray-300'
            }`}
          >
            {categoryInfo.name}
          </button>
        ))}
      </div>

      {/* リストエリア */}
      <div className="bg-gray-700 rounded-lg rounded-tl-none p-3">
        <div className="flex flex-wrap gap-2">
          {categorizedFacilities[category]?.map((facility) => {
            const isSelected = selectedType === facility.type;
            const canAfford = money >= facility.cost;
            
            return (
              <button
                key={facility.type}
                onClick={() => onSelectType(facility.type)}
                disabled={!canAfford}
                className={`px-3 py-2 text-xs rounded text-left transition-colors ${
                  isSelected 
                    ? 'bg-gray-200 text-gray-900 shadow-lg' 
                    : canAfford
                      ? 'bg-white text-gray-800 hover:bg-gray-300'
                      : 'bg-gray-500 text-gray-800 cursor-not-allowed'
                }`}
              >
                <div className="font-semibold">{facility.name}</div>
                <div className="text-sm">¥{facility.cost.toLocaleString()}</div>
                <div className="text-xs opacity-75">{facility.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  )
}
