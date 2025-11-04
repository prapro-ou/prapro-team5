import { useRef } from 'react';
import type { GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import type { HeightTerrainTile } from '../types/terrainWithHeight';
import { Container, Graphics, Texture, Sprite } from 'pixi.js';
import { useRedrawControl } from './useRedrawControl';
import { 
  drawTerrain, 
  drawFacilities, 
  updateFacilitiesIncremental,
  drawPreview, 
  drawEffectPreview, 
  drawRoadDragRange 
} from '../utils/drawingUtils';

type MutableRef<T> = { current: T };

interface DrawingHooksProps {
  terrainMap: Map<string, string>;
  getTerrainAt: (x: number, y: number) => string | undefined;
  heightTerrainMap: Map<string, HeightTerrainTile>;
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
  heightTerrainMap,
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
  const facilitySpriteMapRef = useRef<Map<string, Sprite[]>>(new Map());
  const previousFacilitiesRef = useRef<Facility[]>([]);

  const { 
    shouldRedrawTerrain, 
    shouldRedrawPreview, 
    shouldRedrawEffectPreview, 
    resetPreviewStates,
    resetTerrainState
  } = useRedrawControl();

  // 地形描画関数
  const drawTerrainLayer = () => {
    if (!terrainLayerRef.current || !isInitializedRef.current) return;
    
    // 地形データの変更をチェック（地形マップ + 高さマップの両方を判定）
    const needsRedraw = shouldRedrawTerrain(terrainMap, heightTerrainMap);
    
    if (!needsRedraw) {
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
      returnGraphics,
      heightTerrainMap
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
      returnGraphics,
      heightTerrainMap
    );
  };

  // 施設描画関数（部分更新対応）
  const drawFacilitiesLayer = () => {
    if (!facilitiesLayerRef.current || !isInitializedRef.current) return;
    
    const facilities = facilitiesRef.current;
    const previousFacilities = previousFacilitiesRef.current;
    
    // 施設数が大きく変わった場合は全再描画（部分更新のオーバーヘッドが大きいため）
    const facilityCountDiff = Math.abs(facilities.length - previousFacilities.length);
    if (facilityCountDiff > facilities.length * 0.5 || facilities.length === 0) {
      // 全再描画
      drawFacilities(
        facilitiesLayerRef.current,
        facilities,
        offsetsRef.current.offsetX,
        offsetsRef.current.offsetY,
        texturesRef.current,
        getPooledGraphics,
        returnGraphics,
        heightTerrainMap
      );
      // スプライトマップを再構築
      facilitySpriteMapRef.current.clear();
      previousFacilitiesRef.current = facilities;
      return;
    }
    
    // 部分更新
    updateFacilitiesIncremental(
      facilitiesLayerRef.current,
      facilities,
      previousFacilities,
      facilitySpriteMapRef.current,
      offsetsRef.current.offsetX,
      offsetsRef.current.offsetY,
      texturesRef.current,
      heightTerrainMap
    );
    
    previousFacilitiesRef.current = [...facilities];
  };

  // 施設を強制描画
  const drawFacilitiesLayerForced = () => {
    if (!facilitiesLayerRef.current || !isInitializedRef.current) return;
    const { offsetX, offsetY } = offsetsRef.current;
    const facilities = facilitiesRef.current;
    
    // スプライトマップをクリアして全再描画
    facilitySpriteMapRef.current.forEach(sprites => {
      sprites.forEach(sprite => {
        if (sprite.parent) {
          sprite.parent.removeChild(sprite);
        }
        sprite.destroy();
      });
    });
    facilitySpriteMapRef.current.clear();
    
    drawFacilities(
      facilitiesLayerRef.current,
      facilities,
      offsetX,
      offsetY,
      texturesRef.current,
      getPooledGraphics,
      returnGraphics,
      heightTerrainMap
    );
    
    previousFacilitiesRef.current = [...facilities];
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
      returnGraphics,
      heightTerrainMap
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
      returnGraphics,
      heightTerrainMap
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
      returnGraphics,
      heightTerrainMap
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
    drawTerrainLayerForced,
    drawFacilitiesLayerForced
  };
};
