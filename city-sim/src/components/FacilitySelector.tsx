import type { CategoryKey, FacilityType } from "../types/facility";
import { FACILITY_CATEGORIES } from "../types/facility";
import { getFacilityRegistry } from "../utils/facilityLoader";
import { useState, useEffect } from "react";
import { TbCash, TbLock } from "react-icons/tb";
import { playPanelSound, playSelectSound, playSelect1Sound } from "./SoundSettings";
import { useFacilityStore } from "../stores/FacilityStore";

interface FacilitySelectorProps {
  selectedType: FacilityType | null;  // 現在選択されている施設タイプ
  onSelectType: (type: FacilityType | null) => void;  // 選択を変更する関数
  money: number;  // 資金
}

export function FacilitySelector({ selectedType, onSelectType, money }: FacilitySelectorProps) {
  const [category, setCategory] = useState<CategoryKey>("residential");
  const [detailType, setDetailType] = useState<FacilityType | null>(null);
  const { isFacilityUnlocked } = useFacilityStore();

  // カテゴリや選択中施設が変わったら詳細を閉じる
  useEffect(() => {
    setDetailType(null);
  }, [category, selectedType]);

  const categorizedFacilities = Object.values(getFacilityRegistry()).reduce((acc, facility) => {
    const category = facility.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(facility);
    return acc;
  }, {} as Record<CategoryKey, ReturnType<typeof getFacilityRegistry>[keyof ReturnType<typeof getFacilityRegistry>][]>);


  return (
    <div className="w-full max-w-4x1">
      {/* タブグループ */}
      <div className="flex space-x-1">
        {Object.entries(FACILITY_CATEGORIES).map(([key, categoryInfo]) => (
          <button
            key={key}
            onClick={() => {
              playSelectSound(); // カテゴリ選択時に効果音を再生
              setCategory(key as CategoryKey);
            }}
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
      <div className="bg-gray-500/30 rounded-lg rounded-tl-none p-3">
        <div className="flex gap-2 overflow-x-auto" style={{width: '100%', maxWidth: '900px'}}>
          {categorizedFacilities[category]?.map((facility) => {
            const isSelected = selectedType === facility.type;
            const canAfford = money >= facility.cost;
            const isUnlocked = isFacilityUnlocked(facility.type);
            const isDisabled = !canAfford || !isUnlocked;
            
            return (
              <div key={facility.type} className="flex flex-col items-start min-w-[140px]">
                <button
                  onClick={() => {
                    if (!isUnlocked) return; // ロック中は何もしない
                    if (isSelected) {
                      onSelectType(null);
                    } else {
                      playSelect1Sound(); // 施設選択時にselect1.mp3を再生
                      onSelectType(facility.type);
                    }
                  }}
                  disabled={isDisabled}
                  className={`px-3 py-2 text-xs rounded text-left transition-colors flex-shrink-0 w-full relative ${
                    isSelected 
                      ? 'bg-gray-200 text-gray-900 shadow-lg' 
                      : !isUnlocked
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : canAfford
                          ? 'bg-white text-gray-800 hover:bg-gray-300'
                          : 'bg-gray-500 text-gray-800 cursor-not-allowed'
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded">
                      <TbLock className="text-red-400" size={20} />
                    </div>
                  )}
                  <div className="font-semibold">{facility.name}</div>
                  <div className="text-sm flex items-center gap-1"><TbCash/>{facility.cost.toLocaleString()}</div>
                  <div className="text-xs opacity-75">{facility.description}</div>
                </button>
                <button
                  className="mt-1 text-xs underline text-blue-200 hover:text-blue-400"
                  onClick={() => {
                    playPanelSound();
                    setDetailType(facility.type);
                  }}
                  type="button"
                >
                  詳細を見る
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 選択された施設の詳細情報（ボタンで開閉） */}
      {detailType && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-white">
          <button
            className="mb-2 text-xs underline text-blue-200 hover:text-blue-400"
            onClick={() => {
              playPanelSound();
              setDetailType(null);
            }}
            type="button"
          >
            閉じる
          </button>
          <div><b>{getFacilityRegistry()[detailType].name}</b></div>
          <div>コスト: ¥{getFacilityRegistry()[detailType].cost?.toLocaleString() ?? '-'}</div>
          <div>維持費: ¥{getFacilityRegistry()[detailType].maintenanceCost?.toLocaleString() ?? '-'}/月</div>
          {getFacilityRegistry()[detailType].workforceRequired && (
            <div>必要労働力: {getFacilityRegistry()[detailType].workforceRequired?.min}-{getFacilityRegistry()[detailType].workforceRequired?.max}人</div>
          )}
          <div>満足度: {getFacilityRegistry()[detailType].satisfaction ?? 0}</div>
        </div>
      )}
    </div>
  )
}
