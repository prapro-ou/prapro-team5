import { useRef } from 'react';
import type { GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Container, Graphics, Texture } from 'pixi.js';
import { useRedrawControl } from './useRedrawControl';
import { 
  drawTerrain, 
  drawFacilities, 
  drawPreview, 
  drawEffectPreview, 
  drawRoadDragRange 
} from '../utils/drawingUtils';

type MutableRef<T> = { current: T };

interface DrawingHooksProps {
  terrainMap: Map<string, string>;
  getTerrainAt: (x: number, y: number) => string | undefined;
  facilitiesRef: MutableRef<Facility[]>;
  selectedFacilityTypeRef: MutableRef<FacilityType | null | undefined>;
  moneyRef: MutableRef<number>;
  size: GridSize;
  hoverRef: MutableRef<{ x: number; y: number } | null>;
  roadDragRef: MutableRef<{
    isPlacing: boolean;
    startTile: { x: number; y: number } | null;
    endTile: { x: number; y: number } | null;
  }>;
  offsetsRef: MutableRef<{ offsetX: number; offsetY: number }>;
  texturesRef: MutableRef<Map<string, Texture>>;
  getPooledGraphics: () => Graphics;
  returnGraphics: (g: Graphics) => void;
  isInitializedRef: MutableRef<boolean>;
}

export const usePixiDrawing = ({
  terrainMap,
  getTerrainAt,
  facilitiesRef,
  selectedFacilityTypeRef,
  moneyRef,
  size,
  hoverRef,
  roadDragRef,
  offsetsRef,
  texturesRef,
  getPooledGraphics,
  returnGraphics,
  isInitializedRef
}: DrawingHooksProps) => {
  const terrainLayerRef = useRef<Container | null>(null);
  const facilitiesLayerRef = useRef<Container | null>(null);
  const previewLayerRef = useRef<Container | null>(null);
  const effectPreviewLayerRef = useRef<Container | null>(null);

  const { 
    shouldRedrawTerrain, 
    shouldRedrawFacilities, 
    shouldRedrawPreview, 
    shouldRedrawEffectPreview, 
    resetPreviewStates,
    resetTerrainState
  } = useRedrawControl();

  // 地形描画関数
  const drawTerrainLayer = () => {
    if (!terrainLayerRef.current || !isInitializedRef.current) return;
    
    // 地形データの変更をチェック
    if (!shouldRedrawTerrain(terrainMap)) {
      return; // 変更なしの場合はスキップ
    }
    
    const { offsetX, offsetY } = offsetsRef.current;
    
    drawTerrain(
      terrainLayerRef.current,
      terrainMap,
      size,
      offsetX,
      offsetY,
      getTerrainAt,
      getPooledGraphics,
      returnGraphics
    );
  };

  // 地形を強制描画
  const drawTerrainLayerForced = () => {
    if (!terrainLayerRef.current || !isInitializedRef.current) return;
    const { offsetX, offsetY } = offsetsRef.current;
    drawTerrain(
      terrainLayerRef.current,
      terrainMap,
      size,
      offsetX,
      offsetY,
      getTerrainAt,
      getPooledGraphics,
      returnGraphics
    );
  };

  // 施設描画関数
  const drawFacilitiesLayer = () => {
    if (!facilitiesLayerRef.current || !isInitializedRef.current) return;
    
    // 施設データの変更をチェック
    const facilities = facilitiesRef.current;
    if (!shouldRedrawFacilities(facilities)) {
      return; // 変更なしの場合はスキップ
    }
    
    const { offsetX, offsetY } = offsetsRef.current;
    
    drawFacilities(
      facilitiesLayerRef.current,
      facilities,
      offsetX,
      offsetY,
      texturesRef.current,
      getPooledGraphics,
      returnGraphics
    );
  };

  // プレビュー描画関数
  const drawPreviewLayer = () => {
    if (!previewLayerRef.current || !isInitializedRef.current) return;
    
    const selectedFacilityType = selectedFacilityTypeRef.current;
    const hoverPosition = hoverRef.current;
    if (!selectedFacilityType || !hoverPosition) return;
    
    // マウス位置の変更をチェック
    if (!shouldRedrawPreview(hoverPosition)) {
      return; // マウス位置が変わっていない場合はスキップ
    }
    
    const { offsetX, offsetY } = offsetsRef.current;
    const facilities = facilitiesRef.current;
    const money = moneyRef.current;
    
    drawPreview(
      previewLayerRef.current,
      selectedFacilityType,
      hoverPosition,
      size,
      offsetX,
      offsetY,
      money,
      facilities,
      getPooledGraphics,
      returnGraphics
    );
  };

  // 効果範囲プレビュー描画関数
  const drawEffectPreviewLayer = () => {
    if (!effectPreviewLayerRef.current || !isInitializedRef.current) return;
    
    const selectedFacilityType = selectedFacilityTypeRef.current;
    const hoverPosition = hoverRef.current;
    if (!selectedFacilityType || !hoverPosition) return;
    
    // マウス位置の変更をチェック
    if (!shouldRedrawEffectPreview(hoverPosition)) {
      return; // マウス位置が変わっていない場合はスキップ
    }
    
    const { offsetX, offsetY } = offsetsRef.current;
    
    drawEffectPreview(
      effectPreviewLayerRef.current,
      selectedFacilityType,
      hoverPosition,
      size,
      offsetX,
      offsetY,
      getPooledGraphics,
      returnGraphics
    );
  };

  // 道路ドラッグ範囲描画関数
  const drawRoadDragRangeLayer = () => {
    if (!previewLayerRef.current || !isInitializedRef.current) return;
    
    const selectedFacilityType = selectedFacilityTypeRef.current;
    const roadDragState = roadDragRef.current;
    if (!selectedFacilityType || !roadDragState.isPlacing || !roadDragState.startTile || !roadDragState.endTile) return;
    
    if (selectedFacilityType !== 'road') return;
    
    const { offsetX, offsetY } = offsetsRef.current;
    const facilities = facilitiesRef.current;
    const money = moneyRef.current;
    
    drawRoadDragRange(
      previewLayerRef.current,
      selectedFacilityType,
      roadDragState.isPlacing,
      roadDragState.startTile,
      roadDragState.endTile,
      size,
      offsetX,
      offsetY,
      money,
      facilities,
      getPooledGraphics,
      returnGraphics
    );
  };

  // プレビューをクリアする関数
  const clearPreviews = () => {
    // プレビューレイヤーをクリア
    if (previewLayerRef.current) {
      previewLayerRef.current.children.forEach(child => {
        if (child instanceof Graphics) {
          returnGraphics(child);
        }
      });
      previewLayerRef.current.removeChildren();
    }
    
    // 効果範囲プレビューレイヤーをクリア
    if (effectPreviewLayerRef.current) {
      effectPreviewLayerRef.current.children.forEach(child => {
        if (child instanceof Graphics) {
          returnGraphics(child);
        }
      });
      effectPreviewLayerRef.current.removeChildren();
    }
    
    // マウス位置の状態をリセット
    resetPreviewStates();
  };

  return {
    // レイヤー参照
    terrainLayerRef,
    facilitiesLayerRef,
    previewLayerRef,
    effectPreviewLayerRef,
    
    // 描画関数
    drawTerrainLayer,
    drawFacilitiesLayer,
    drawPreviewLayer,
    drawEffectPreviewLayer,
    drawRoadDragRangeLayer,
    clearPreviews,
    
    // 状態リセット関数
    resetTerrainState,
    
    // 強制描画
    drawTerrainLayerForced
  };
};
