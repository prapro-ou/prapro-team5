import React from 'react';
import type { Position } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { FACILITY_DATA } from '../types/facility';

interface UseFacilityPreviewProps {
  size: { width: number; height: number };
  selectedFacilityType: FacilityType | null;
  hoveredTile: Position | null;
  isPlacingFacility: boolean;
  dragRange: Set<string>;
  money: number;
  facilities: Facility[];
  selectedPosition: Position | null;
}

export type PreviewStatus = 'valid' | 'occupied' | 'insufficient-funds' | 'out-of-bounds' | null;

export const useFacilityPreview = ({
  size,
  selectedFacilityType,
  hoveredTile,
  isPlacingFacility,
  dragRange,
  money,
  facilities,
  selectedPosition
}: UseFacilityPreviewProps) => {
  
  // 施設マップをメモ化
  const facilityMap = React.useMemo(() => {
    const map = new Map<string, Facility>();
    facilities.forEach(facility => {
      facility.occupiedTiles.forEach(tile => {
        map.set(`${tile.x}-${tile.y}`, facility);
      });
    });
    return map;
  }, [facilities]);

  // プレビュー範囲の事前計算
  const previewTiles = React.useMemo(() => {
    if (!selectedFacilityType || !hoveredTile) return new Set<string>();
    
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const radius = Math.floor(facilityData.size / 2);
    const tiles = new Set<string>();
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = hoveredTile.x + dx;
        const y = hoveredTile.y + dy;
        
        // 全マップ範囲でチェック
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    return tiles;
  }, [selectedFacilityType, hoveredTile, size]);

  // プレビューステータスの取得
  const getPreviewStatus = React.useCallback((x: number, y: number): PreviewStatus => {
    const tileKey = `${x}-${y}`;

    // 範囲外チェック
    if (x < 0 || x >= size.width || y < 0 || y >= size.height) {
      return 'out-of-bounds';
    }

    // ドラッグ範囲内のプレビュー
    if (isPlacingFacility && dragRange.has(tileKey)) {
      if (!selectedFacilityType) return null;
      
      const facilityData = FACILITY_DATA[selectedFacilityType];

      if (facilityData.category !== 'infrastructure') return null;

      if (money < facilityData.cost) {
        return 'insufficient-funds';
      }
      if (facilityMap.has(tileKey)) {
        return 'occupied';
      }
      return 'valid';
    }

    // ドラッグ中はホバーによるプレビューを無効にする
    if (isPlacingFacility) return null;

    if (!selectedFacilityType || !hoveredTile) return null;
    
    // ホバー中心から離れすぎてたら計算しない
    const distance = Math.abs(x - hoveredTile.x) + Math.abs(y - hoveredTile.y);
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const maxDistance = Math.floor(facilityData.size / 2) + 1;
    
    if (distance > maxDistance) return null;

    if (!previewTiles.has(tileKey)) return null;

    // 資金不足チェック
    if (money < facilityData.cost) {
      return 'insufficient-funds';
    }
    // 既存施設チェック
    if (facilityMap.has(tileKey)) {
      return 'occupied';
    }
    return 'valid';
  }, [selectedFacilityType, hoveredTile, previewTiles, facilityMap, money, isPlacingFacility, dragRange, size]);

  // プレビュー時の色を施設タイプごとに変更
  const getPreviewColor = React.useCallback((status: PreviewStatus, facilityType?: FacilityType | null): string => {
    if (status === 'valid') {
      switch (facilityType) {
        case 'residential': return 'bg-green-300 opacity-70';
        case 'commercial': return 'bg-blue-300 opacity-70';
        case 'industrial': return 'bg-yellow-200 opacity-70';
        case 'road': return 'bg-gray-400 opacity-70';
        case 'city_hall': return 'bg-purple-300 opacity-70';
        case 'park': return 'bg-lime-200 opacity-70';
        default: return 'bg-green-300 opacity-70';
      }
    }

    switch (status) {
      case 'occupied': return 'bg-red-300 opacity-70';
      case 'insufficient-funds': return 'bg-red-300 opacity-70';
      case 'out-of-bounds': return 'bg-red-500 opacity-70';
      default: return '';
    }
  }, []);

  // 公園効果範囲の計算
  const parkEffectTiles = React.useMemo(() => {
    const tiles = new Set<string>();
    
    // プレビュー中
    if (selectedFacilityType === 'park' && hoveredTile) {
      const effectRadius = FACILITY_DATA['park'].effectRadius ?? 0;
      for (let dx = -effectRadius; dx <= effectRadius; dx++) {
        for (let dy = -effectRadius; dy <= effectRadius; dy++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= effectRadius) {
            const x = hoveredTile.x + dx;
            const y = hoveredTile.y + dy;
            if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
              tiles.add(`${x}-${y}`);
            }
          }
        }
      }
    }
    // 設置済み公園が選択状態のとき
    else if (selectedPosition) {
      const selectedPark = facilities.find(f => 
        f.type === 'park' && 
        f.position.x === selectedPosition.x && 
        f.position.y === selectedPosition.y
      );
      if (selectedPark) {
        const effectRadius = FACILITY_DATA['park'].effectRadius ?? 0;
        for (let dx = -effectRadius; dx <= effectRadius; dx++) {
          for (let dy = -effectRadius; dy <= effectRadius; dy++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= effectRadius) {
              const x = selectedPark.position.x + dx;
              const y = selectedPark.position.y + dy;
              if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
                tiles.add(`${x}-${y}`);
              }
            }
          }
        }
      }
    }
    
    return tiles;
  }, [selectedFacilityType, hoveredTile, selectedPosition, facilities, size]);

  // プレビューが無効かどうかの判定
  const isPreviewInvalid = React.useMemo(() => {
    if (!selectedFacilityType || !hoveredTile) return false;
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const radius = Math.floor(facilityData.size / 2);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = hoveredTile.x + dx;
        const y = hoveredTile.y + dy;
        const status = getPreviewStatus(x, y);
        if (status === 'occupied' || status === 'out-of-bounds' || status === 'insufficient-funds') {
          return true;
        }
      }
    }
    return false;
  }, [selectedFacilityType, hoveredTile, getPreviewStatus]);

  // 施設の色を取得
  const getFacilityColor = React.useCallback((facility?: Facility): string => {
    if (!facility) return 'bg-gray-700'; // デフォルトの色
    switch (facility.type) {
      case 'residential': return 'bg-green-500';
      case 'commercial': return 'bg-blue-500';
      case 'industrial': return 'bg-yellow-500';
      case 'road': return 'bg-gray-900';
      case 'city_hall': return 'bg-purple-500';
      case 'park': return 'bg-lime-400'; // 公園は明るい緑
      default: return 'bg-gray-700';
    }
  }, []);

  // プレビュー色の計算
  const getPreviewColorValue = React.useCallback((x: number, y: number): string => {
    const tileKey = `${x}-${y}`;
    
    // ドラッグ敷設中のプレビュー
    if (isPlacingFacility && dragRange.has(tileKey)) {
      if (!selectedFacilityType) return '';
      return getPreviewColor(getPreviewStatus(x, y), selectedFacilityType);
    }
    
    // 通常のホバープレビュー
    if (!selectedFacilityType || !hoveredTile) return '';
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const radius = Math.floor(facilityData.size / 2);
    if (
      x >= hoveredTile.x - radius && x <= hoveredTile.x + radius &&
      y >= hoveredTile.y - radius && y <= hoveredTile.y + radius
    ) {
      if (isPreviewInvalid) {
        return 'bg-red-300 opacity-70';
      }
      return getPreviewColor(getPreviewStatus(x, y), selectedFacilityType);
    }
    return '';
  }, [isPlacingFacility, dragRange, selectedFacilityType, hoveredTile, isPreviewInvalid, getPreviewStatus, getPreviewColor]);

  return {
    facilityMap,
    previewTiles,
    parkEffectTiles,
    getPreviewStatus,
    getPreviewColor,
    isPreviewInvalid,
    getFacilityColor,        // 追加
    getPreviewColorValue     // 追加
  };
}; 