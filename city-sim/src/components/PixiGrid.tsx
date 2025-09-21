import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics, Container, Point, Assets, Sprite, Texture } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT, fromIsometric } from '../utils/coordinates';
import { FACILITY_DATA } from '../types/facility';
import { getRoadConnectionType } from '../utils/roadConnection';
import { useTerrainStore } from '../stores/TerrainStore';

interface PixiGridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[];
  selectedFacilityType?: FacilityType | null;
  money?: number;
  deleteMode?: boolean;
}

// グリッド描画
export const PixiGrid: React.FC<PixiGridProps> = ({ size, onTileClick, facilities = [], selectedFacilityType, money = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, moved: false, button: 0, downX: 0, downY: 0 });
  const keysRef = useRef<{ [code: string]: boolean }>({});
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  // 道路ドラッグ連続設置用の状態管理
  const roadDragRef = useRef({ 
    isPlacing: false, 
    startTile: null as { x: number; y: number } | null, 
    endTile: null as { x: number; y: number } | null 
  });
  const lastPointerGlobalRef = useRef<Point | null>(null);
  const facilitiesLayerRef = useRef<Container | null>(null);
  const previewLayerRef = useRef<Container | null>(null);
  const effectPreviewLayerRef = useRef<Container | null>(null);
  const terrainLayerRef = useRef<Container | null>(null);
  const texturesRef = useRef<Map<string, Texture>>(new Map());
  const offsetsRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const isInitializedRef = useRef(false);
  const onTileClickRef = useRef<((position: Position) => void) | undefined>(onTileClick);
  // プロップスの最新値を保持するref（イベントハンドラの古いクロージャ問題対策）
  const selectedFacilityTypeRef = useRef<FacilityType | null | undefined>(selectedFacilityType);
  const moneyRef = useRef<number>(money);
  const facilitiesRef = useRef<Facility[]>(facilities);

  // 再描画制御用の状態
  const lastTerrainMapRef = useRef<string>('');
  const lastFacilitiesRef = useRef<string>('');
  const lastMousePositionRef = useRef<Position | null>(null);

  // オブジェクトプール
  const graphicsPoolRef = useRef<Graphics[]>([]);
  const getPooledGraphics = () => {
    const pool = graphicsPoolRef.current;
    if (pool.length > 0) {
      const g = pool.pop()!;
      g.clear();
      return g;
    }
    return new Graphics();
  };
  const returnGraphics = (g: Graphics) => {
    g.clear();
    graphicsPoolRef.current.push(g);
  };
  
  // 地形ストアの使用
  const { terrainMap, getTerrainAt } = useTerrainStore();

  useEffect(() => { selectedFacilityTypeRef.current = selectedFacilityType; }, [selectedFacilityType]);
  useEffect(() => { moneyRef.current = money; }, [money]);
  useEffect(() => { facilitiesRef.current = facilities; }, [facilities]);

  // 地形に応じた色を取得する関数
  const getTerrainColor = React.useCallback((terrain: string): number => {
    const terrainColors: Record<string, number> = {
      grass: 0x90EE90,      // 薄い緑
      water: 0x87CEEB,      // 空色
      forest: 0x228B22,     // 濃い緑
      desert: 0xF4A460,     // 砂色
      mountain: 0x696969,   // 暗いグレー
      beach: 0xF5DEB3,      // 小麦色
      swamp: 0x8B4513,      // 茶色
      rocky: 0xA0522D,      // シエナ
    };
    return terrainColors[terrain] || 0x90EE90;
  }, []);

  // 地形描画関数
  const drawTerrain = () => {
    if (!terrainLayerRef.current || !isInitializedRef.current) return;
    
    // 地形データのハッシュを計算して変更チェック
    const terrainHash = JSON.stringify(terrainMap);
    if (terrainHash === lastTerrainMapRef.current) {
      return; // 変更なしの場合はスキップ
    }
    lastTerrainMapRef.current = terrainHash;
    
    const layer = terrainLayerRef.current;
    
    // 既存のGraphicsオブジェクトをプールに戻す
    layer.children.forEach(child => {
      if (child instanceof Graphics) {
        returnGraphics(child);
      }
    });
    layer.removeChildren();
    
    const { offsetX, offsetY } = offsetsRef.current;
    
    // 見える範囲のタイルを描画
    const maxX = Math.min(size.width, 120);
    const maxY = Math.min(size.height, 120);
    
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < maxX; x++) {
        // 地形が未設定の場合はデフォルト（草）を使用
        const terrain = getTerrainAt(x, y) || 'grass';
        const color = getTerrainColor(terrain);
        
        const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
        const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
        
        const terrainG = getPooledGraphics();
        terrainG.moveTo(isoX, isoY)
          .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
          .lineTo(isoX + ISO_TILE_WIDTH, isoY)
          .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
          .lineTo(isoX, isoY)
          .fill({ color, alpha: 0.8 })
          .stroke({ color: 0x666666, width: 1 });
        
        terrainG.zIndex = isoY;
        layer.addChild(terrainG);
      }
    }
  };

  // 施設描画関数
  const drawFacilities = () => {
    if (!facilitiesLayerRef.current || !isInitializedRef.current) return;
    
    // 施設データのハッシュを計算して変更チェック
    const facilitiesNow = facilitiesRef.current ?? [];
    const facilitiesHash = JSON.stringify(facilitiesNow);
    if (facilitiesHash === lastFacilitiesRef.current) {
      return; // 変更なしの場合はスキップ
    }
    lastFacilitiesRef.current = facilitiesHash;
    
    const layer = facilitiesLayerRef.current;
    
    // 既存のGraphicsオブジェクトをプールに戻す
    layer.children.forEach(child => {
      if (child instanceof Graphics) {
        returnGraphics(child);
      }
    });
    layer.removeChildren();
    
    const { offsetX, offsetY } = offsetsRef.current;
    
    // 施設マップを作成（道路接続判定用）
    const facilityMap = new Map<string, Facility>();
    facilitiesNow.forEach(facility => {
      facility.occupiedTiles.forEach(tile => {
        facilityMap.set(`${tile.x}-${tile.y}`, facility);
      });
    });
    
    facilitiesNow.forEach(facility => {
      const facilityData = FACILITY_DATA[facility.type];
      
      // 道路接続描画処理
      if (facility.type === 'road') {
        facility.occupiedTiles.forEach(tile => {
          const connection = getRoadConnectionType(facilityMap, tile.x, tile.y);
          const imgPath = facilityData.imgPaths?.[connection.variantIndex];
          if (!imgPath) return;
          
          const texture = texturesRef.current.get(imgPath);
          if (!texture) return;
          
          const sprite = new Sprite(texture);
          const isoX = (tile.x - tile.y) * (ISO_TILE_WIDTH / 2) + offsetX;
          const isoY = (tile.x + tile.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
          
          // 道路のサイズ設定
          const imgSize = facilityData.imgSizes?.[connection.variantIndex] ?? { width: 32, height: 16 };
          sprite.width = imgSize.width;
          sprite.height = imgSize.height;
          
          // 道路のみアンカーを中心に設定
          sprite.anchor.set(0.5, 0.5);
          
          // 位置設定
          sprite.x = isoX + ISO_TILE_WIDTH / 2;
          sprite.y = isoY;
          
          // 回転の適用
          sprite.rotation = (connection.rotation * Math.PI) / 180;
          
          // フリップの適用
          if (connection.flip) {
            sprite.scale.x *= -1;   // 水平反転
          }
          
          // Z-index
          sprite.zIndex = isoY;
          layer.addChild(sprite);
        });
      } 
      else {
        // 通常の施設
        const imgPath = facilityData.imgPaths?.[0];
        if (!imgPath) return;
        
        const texture = texturesRef.current.get(imgPath);
        if (!texture) return;
        
        const sprite = new Sprite(texture);
        const center = facility.position;
        const isoX = (center.x - center.y) * (ISO_TILE_WIDTH / 2) + offsetX;
        const isoY = (center.x + center.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
        
        // 画像サイズが分かる場合は中央寄せ。なければそのまま
        const size = facilityData.imgSizes?.[0];
        if (size) {
          sprite.anchor.set(0.5, 1.0);
          sprite.x = isoX + ISO_TILE_WIDTH / 2;
          sprite.y = isoY + (ISO_TILE_HEIGHT / 2) + ISO_TILE_HEIGHT * Math.floor(facilityData.size / 2);
          sprite.width = size.width;
          sprite.height = size.height;
        }
        else {
          sprite.x = isoX;
          sprite.y = isoY;
        }
        
        // 簡易Z-index
        sprite.zIndex = isoY;
        layer.addChild(sprite);
      }
    });
  };

  // プレビュー描画関数
  const drawPreview = () => {
    if (!previewLayerRef.current || !isInitializedRef.current) return;
    
    const currentType = selectedFacilityTypeRef.current;
    if (!currentType || !hoverRef.current) return;
    
    // マウス位置の変更チェック
    const currentMousePos = hoverRef.current;
    if (currentMousePos && lastMousePositionRef.current &&
        currentMousePos.x === lastMousePositionRef.current.x &&
        currentMousePos.y === lastMousePositionRef.current.y) {
      return; // マウス位置が変わっていない場合はスキップ
    }
    lastMousePositionRef.current = currentMousePos ? { ...currentMousePos } : null;
    
    const layer = previewLayerRef.current;
    
    // 既存のGraphicsオブジェクトをプールに戻す
    layer.children.forEach(child => {
      if (child instanceof Graphics) {
        returnGraphics(child);
      }
    });
    layer.removeChildren();
    
    const { offsetX, offsetY } = offsetsRef.current;
    const facilityData = FACILITY_DATA[currentType];
    const radius = Math.floor(facilityData.size / 2);
    const center = hoverRef.current;
    
    // 施設マップを作成（既存施設の占有タイル）
    const facilityMap = new Map<string, Facility>();
    const facilitiesNow = facilitiesRef.current ?? [];
    facilitiesNow.forEach(facility => {
      facility.occupiedTiles.forEach(tile => {
        facilityMap.set(`${tile.x}-${tile.y}`, facility);
      });
    });
    
    // プレビュー範囲を描画
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = center.x + dx;
        const y = center.y + dy;
        
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
          const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
          
          const previewG = getPooledGraphics();
          previewG.moveTo(isoX, isoY)
            .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
            .lineTo(isoX + ISO_TILE_WIDTH, isoY)
            .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
            .lineTo(isoX, isoY);
          
          // プレビューステータスを決定
          const tileKey = `${x}-${y}`;
          const canAfford = (moneyRef.current ?? 0) >= facilityData.cost;
          const isOccupied = facilityMap.has(tileKey);
          
          // 色を決定
          let color = 0x00ff00; // デフォルト緑
          let alpha = 0.3;
          
          if (canAfford && !isOccupied) {
            // 施設カテゴリ別
            const facilityData = FACILITY_DATA[currentType];
            switch (facilityData.category) {
              case 'residential': color = 0x86efac; break;      // 緑（住宅）
              case 'commercial': color = 0x93c5fd; break;       // 青（商業）
              case 'industrial': color = 0xfef08a; break;       // 黄（工業）
              case 'infrastructure': color = 0x9ca3af; break;   // グレー（インフラ）
              case 'government': color = 0xc4b5fd; break;       // 紫（公共）
              case 'others': color = 0xf0abfc; break;           // ピンク（その他）
              default: color = 0x86efac; break;                 // デフォルト
            }
          }
          else {
            color = 0xfca5a5; // 赤（建設不可）
          }
          
          previewG.fill({ color, alpha });
          previewG.stroke({ color: 0xffffff, width: 1 });
          layer.addChild(previewG);
        }
      }
    }
  };

  // 効果範囲プレビュー描画関数
  const drawEffectPreview = () => {
    if (!effectPreviewLayerRef.current || !isInitializedRef.current) return;
    
    const currentType = selectedFacilityTypeRef.current;
    if (!currentType || !hoverRef.current) return;
    
    // マウス位置の変更チェック
    const currentMousePos = hoverRef.current;
    if (currentMousePos && lastMousePositionRef.current &&
        currentMousePos.x === lastMousePositionRef.current.x &&
        currentMousePos.y === lastMousePositionRef.current.y) {
      return; // マウス位置が変わっていない場合はスキップ
    }
    
    const layer = effectPreviewLayerRef.current;
    
    // 既存のGraphicsオブジェクトをプールに戻す
    layer.children.forEach(child => {
      if (child instanceof Graphics) {
        returnGraphics(child);
      }
    });
    layer.removeChildren();
    
    const { offsetX, offsetY } = offsetsRef.current;
    const facilityData = FACILITY_DATA[currentType];
    const effectRadius = facilityData.effectRadius ?? 0;
    
    if (effectRadius <= 0) return;
    
    const center = hoverRef.current;
    
    // 効果範囲を描画
    for (let dx = -effectRadius; dx <= effectRadius; dx++) {
      for (let dy = -effectRadius; dy <= effectRadius; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= effectRadius) {
          const x = center.x + dx;
          const y = center.y + dy;
          
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
            const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
            
            const effectG = getPooledGraphics();
            effectG.moveTo(isoX, isoY)
              .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
              .lineTo(isoX + ISO_TILE_WIDTH, isoY)
              .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
              .lineTo(isoX, isoY);
            
            // 効果範囲の色（施設タイプ別）
            let color = 0x90EE90; // デフォルト緑
            switch (currentType) {
              case 'police': color = 0x87CEEB; break; // スカイブルー
              case 'hospital': color = 0xFFB6C1; break; // ライトピンク
              case 'park': color = 0x90EE90; break; // ライトグリーン
              case 'city_hall': color = 0xDDA0DD; break; // プラム
              default: color = 0x90EE90; break;
            }
            
            effectG.fill({ color, alpha: 0.3 });
            effectG.stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
            layer.addChild(effectG);
          }
        }
      }
    }
  };

  // 道路ドラッグ範囲描画関数
  const drawRoadDragRange = () => {
    if (!previewLayerRef.current || !isInitializedRef.current) return;
    
    const layer = previewLayerRef.current;

    // 既存のGraphicsオブジェクトをプールに戻す
    const existingChildren = layer.children.filter(child => child.name !== 'road-drag');
    existingChildren.forEach(child => {
      if (child instanceof Graphics) {
        returnGraphics(child);
      }
    });
    layer.removeChildren();
    
    const currentType = selectedFacilityTypeRef.current;
    if (!currentType || !roadDragRef.current.isPlacing || !roadDragRef.current.startTile || !roadDragRef.current.endTile) return;
    
    if (currentType !== 'road') return;
    
    const { offsetX, offsetY } = offsetsRef.current;
    const startTile = roadDragRef.current.startTile;
    const endTile = roadDragRef.current.endTile;
    
    // 直線一列のみの敷設
    const dx = Math.abs(endTile.x - startTile.x);
    const dy = Math.abs(endTile.y - startTile.y);
    
    let tiles: { x: number; y: number }[] = [];
    
    // X軸方向の直線
    if (dx > dy) {
      const startX = Math.min(startTile.x, endTile.x);
      const endX = Math.max(startTile.x, endTile.x);
      const y = startTile.y;
      
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.push({ x, y });
        }
      }
    }
    // Y軸方向の直線
    else {
      const startY = Math.min(startTile.y, endTile.y);
      const endY = Math.max(startTile.y, endTile.y);
      const x = startTile.x;
      
      for (let y = startY; y <= endY; y++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.push({ x, y });
        }
      }
    }
    
    // 施設マップを作成（既存施設の占有タイル）
    const facilityMap = new Map<string, Facility>();
    const facilitiesNow = facilitiesRef.current ?? [];
    facilitiesNow.forEach(facility => {
      facility.occupiedTiles.forEach(tile => {
        facilityMap.set(`${tile.x}-${tile.y}`, facility);
      });
    });
    
    // 道路のコストを取得
    const roadData = FACILITY_DATA['road'];
    
    // ドラッグ範囲を描画
    tiles.forEach(({ x, y }) => {
      const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
      const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
      
      const dragG = getPooledGraphics();
      dragG.name = 'road-drag';
      dragG.moveTo(isoX, isoY)
        .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
        .lineTo(isoX + ISO_TILE_WIDTH, isoY)
        .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
        .lineTo(isoX, isoY);
      
      // プレビューステータスを決定
      const tileKey = `${x}-${y}`;
      const canAfford = (moneyRef.current ?? 0) >= roadData.cost;
      const isOccupied = facilityMap.has(tileKey);
      
      // 色を決定（CanvasGridと同じ金色系）
      let color = 0xFFD700; // 金色（デフォルト）
      let alpha = 0.7;
      let strokeColor = 0xFFA500; // オレンジ色の境界線
      
      if (!canAfford || isOccupied) {
        color = 0xfca5a5; // 赤（建設不可）
        alpha = 0.7;
        strokeColor = 0xff0000; // 赤い境界線
      }
      
      dragG.fill({ color, alpha });
      dragG.stroke({ color: strokeColor, width: 2 });
      layer.addChild(dragG);
    });
  };

  // onTileClickRefを最新の値に更新
  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);

  // 地形描画の更新（地形データが変更された時のみ）
  useEffect(() => {
    if (isInitializedRef.current) {
      drawTerrain();
    }
  }, [terrainMap]);

  // 施設描画の更新（施設データが変更された時のみ）
  useEffect(() => {
    if (isInitializedRef.current) {
      drawFacilities();
    }
  }, [facilities]);

  // プレビュー描画の更新
  useEffect(() => {
    if (isInitializedRef.current) {
      drawPreview();
      drawEffectPreview();
    }
  }, [selectedFacilityType, money, facilities]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !size.width || !size.height) return;


    let didInit = false;
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const init = async () => {
      const app = new Application();
      const width = Math.min(window.innerWidth, 1280);
      const height = Math.min(window.innerHeight, 720);
      await app.init({ canvas, width, height, backgroundAlpha: 1, background: 0x111827 }); // gray-900
      
      appRef.current = app;
      didInit = true;

      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      const g = new Graphics();
      world.addChild(g);
      
      // ホバー表示用レイヤ
      const hoverG = new Graphics();
      world.addChild(hoverG);

      const offsetX = width / 2;
      const offsetY = 120;
      offsetsRef.current = { offsetX, offsetY };
      const maxX = Math.min(size.width, 120);
      const maxY = Math.min(size.height, 120);

      g.rect(0, 0, width, height).fill({ color: 0x111827 });

      for (let y = 0; y < maxY; y++) {
        for (let x = 0; x < maxX; x++) {
          const isoX = (x - y) * (ISO_TILE_WIDTH / 2);
          const isoY = (x + y) * (ISO_TILE_HEIGHT / 2);
          const cx = isoX + offsetX;
          const cy = isoY + offsetY;

          g.moveTo(cx, cy)
            .lineTo(cx + ISO_TILE_WIDTH / 2, cy - ISO_TILE_HEIGHT / 2)
            .lineTo(cx + ISO_TILE_WIDTH, cy)
            .lineTo(cx + ISO_TILE_WIDTH / 2, cy + ISO_TILE_HEIGHT / 2)
            .lineTo(cx, cy)
            .fill({ color: 0x3b82f6, alpha: 0.15 })
            .stroke({ color: 0x666666, width: 1 });
        }
      }

      // 初期カメラ適用
      world.position.set(cameraRef.current.x, cameraRef.current.y);
      world.scale.set(cameraRef.current.scale);

      // ステージにイベント設定（パン用）
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.cursor = 'grab';

      const onPointerDown = (e: any) => {
        const isSpacePressed = !!(keysRef.current['Space']);
        const isLeft = e.button === 0;
        // 左クリックは建設用。パンは右/中ボタン、またはSpace+左で開始
        const shouldDrag = !isLeft || isSpacePressed;
        
        dragRef.current.dragging = shouldDrag;
        dragRef.current.moved = false;
        dragRef.current.startX = e.global.x;
        dragRef.current.startY = e.global.y;
        dragRef.current.downX = e.global.x;
        dragRef.current.downY = e.global.y;
        dragRef.current.button = e.button;
        
        if (shouldDrag) {
          app.stage.cursor = 'grabbing';
        } 
        else if (isLeft && selectedFacilityTypeRef.current) {
          // 道路のドラッグ開始処理
          if (selectedFacilityTypeRef.current === 'road') {
            const local = world.toLocal(new Point(e.global.x, e.global.y));
            const isoX = (local.x - offsetX);
            const isoY = (local.y - offsetY);
            const tile = fromIsometric(isoX, isoY);
            
            if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
              roadDragRef.current.isPlacing = true;
              roadDragRef.current.startTile = { x: tile.x, y: tile.y };
              roadDragRef.current.endTile = { x: tile.x, y: tile.y };
              drawRoadDragRange();
            }
          }
        }
      };

      const onPointerMove = (e: any) => {
        // 最新のグローバル座標を保存（ホイール時のズーム原点に使用）
        lastPointerGlobalRef.current = new Point(e.global.x, e.global.y);
        
        if (dragRef.current.dragging) {
          const dx = e.global.x - dragRef.current.startX;
          const dy = e.global.y - dragRef.current.startY;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
          dragRef.current.startX = e.global.x;
          dragRef.current.startY = e.global.y;
          cameraRef.current.x += dx;
          cameraRef.current.y += dy;
          world.position.set(cameraRef.current.x, cameraRef.current.y);
          return;
        }

        // 道路ドラッグ更新処理
        if (roadDragRef.current.isPlacing) {
          const local = world.toLocal(new Point(e.global.x, e.global.y));
          const isoX = (local.x - offsetX);
          const isoY = (local.y - offsetY);
          const tile = fromIsometric(isoX, isoY);
          
          if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
            roadDragRef.current.endTile = { x: tile.x, y: tile.y };
            drawRoadDragRange();
          }
          return;
        }

         // ホバー更新（ドラッグしていない時）
         const local = world.toLocal(new Point(e.global.x, e.global.y));
         const isoX = (local.x - offsetX);
         const isoY = (local.y - offsetY);
         const tile = fromIsometric(isoX, isoY);
         
         if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
           const changed = !hoverRef.current || hoverRef.current.x !== tile.x || hoverRef.current.y !== tile.y;
           if (changed) {
             hoverRef.current = { x: tile.x, y: tile.y };
             // 再描画
             hoverG.clear();
             const hIsoX = (tile.x - tile.y) * (ISO_TILE_WIDTH / 2) + offsetX;
             const hIsoY = (tile.x + tile.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
             hoverG.moveTo(hIsoX, hIsoY)
               .lineTo(hIsoX + ISO_TILE_WIDTH / 2, hIsoY - ISO_TILE_HEIGHT / 2)
               .lineTo(hIsoX + ISO_TILE_WIDTH, hIsoY)
               .lineTo(hIsoX + ISO_TILE_WIDTH / 2, hIsoY + ISO_TILE_HEIGHT / 2)
               .lineTo(hIsoX, hIsoY)
               .fill({ color: 0xf59e0b, alpha: 0.2 })
               .stroke({ color: 0xf59e0b, width: 2 });
             
             // プレビューも更新
             drawPreview();
             drawEffectPreview();
           }
         }
        else {
          hoverRef.current = null;
          hoverG.clear();
          // プレビューもクリア
          drawPreview();
          drawEffectPreview();
        }
      };

      const onPointerUp = (e: any) => {
        lastPointerGlobalRef.current = new Point(e.global.x, e.global.y);
        const wasDragging = dragRef.current.dragging;
        // const moved = dragRef.current.moved;
        const pressedButton = dragRef.current.button;
        
        dragRef.current.dragging = false;
        app.stage.cursor = 'grab';

        // 道路ドラッグ確定処理
        if (roadDragRef.current.isPlacing && onTileClickRef.current) {
          const startTile = roadDragRef.current.startTile;
          const endTile = roadDragRef.current.endTile;
          
          if (startTile && endTile) {
            const dx = Math.abs(endTile.x - startTile.x);
            const dy = Math.abs(endTile.y - startTile.y);
            
            // X軸方向の直線
            if (dx > dy) {
              const startX = Math.min(startTile.x, endTile.x);
              const endX = Math.max(startTile.x, endTile.x);
              const y = startTile.y;
              
              for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
                  onTileClickRef.current({ x, y });
                }
              }
            }
            // Y軸方向の直線
            else {
              const startY = Math.min(startTile.y, endTile.y);
              const endY = Math.max(startTile.y, endTile.y);
              const x = startTile.x;
              
              for (let y = startY; y <= endY; y++) {
                if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
                  onTileClickRef.current({ x, y });
                }
              }
            }
          }
          
          // 道路ドラッグ状態をリセット
          roadDragRef.current.isPlacing = false;
          roadDragRef.current.startTile = null;
          roadDragRef.current.endTile = null;
          drawPreview(); // 通常のプレビューに戻す
          drawEffectPreview();
        }
        // 左クリックかつドラッグ開始ではない、かつ移動が小さい → クリック扱い
        else if (onTileClickRef.current && pressedButton === 0 && !wasDragging) {
          const distSq = (e.global.x - dragRef.current.downX) ** 2 + (e.global.y - dragRef.current.downY) ** 2;
          if (distSq <= 25) { // 5px以内
            const local = world.toLocal(new Point(e.global.x, e.global.y));
            const isoX = (local.x - offsetX);
            const isoY = (local.y - offsetY);
            const tile = fromIsometric(isoX, isoY);
            if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
              onTileClickRef.current({ x: tile.x, y: tile.y });
            }
          }
        }
      };

      app.stage.on('pointerdown', onPointerDown);
      app.stage.on('pointermove', onPointerMove);
      app.stage.on('pointerup', onPointerUp);
      app.stage.on('pointerleave', () => { hoverRef.current = null; hoverG.clear(); });

      // 地形用レイヤ（最下層）
      const terrainLayer = new Container();
      terrainLayer.sortableChildren = true;
      world.addChild(terrainLayer);
      terrainLayerRef.current = terrainLayer;

      // 施設用レイヤ
      const facilitiesLayer = new Container();
      facilitiesLayer.sortableChildren = true;
      world.addChild(facilitiesLayer);
      facilitiesLayerRef.current = facilitiesLayer;

      // プレビュー用レイヤ（施設レイヤーの上）
      const previewLayer = new Container();
      previewLayer.sortableChildren = true;
      world.addChild(previewLayer);
      previewLayerRef.current = previewLayer;

      // 効果範囲プレビュー用レイヤ（プレビューレイヤーの上）
      const effectPreviewLayer = new Container();
      effectPreviewLayer.sortableChildren = true;
      world.addChild(effectPreviewLayer);
      effectPreviewLayerRef.current = effectPreviewLayer;

      // 施設テクスチャのプリロード
      const uniquePaths = Array.from(new Set(
        Object.values(FACILITY_DATA)
          .flatMap(f => f.imgPaths ?? [])
      ));
      
      if (uniquePaths.length > 0) {
        try {
          await Assets.load(uniquePaths);
          uniquePaths.forEach((p) => {
            const tex = Assets.get<Texture>(p);
            if (tex) texturesRef.current.set(p, tex);
          });
        }
        catch {
          // 読み込み失敗は無視（スプライトが出ないだけ）
        }
      }

      // 初期化完了フラグを設定
      isInitializedRef.current = true;
      
      // 初期化完了後に描画を更新
      drawTerrain();
      drawFacilities();
      drawPreview();
      drawEffectPreview();

      // ホイールでズーム（カーソル位置を基準に）
      const onWheel = (ev: WheelEvent) => {
        ev.preventDefault();
        // 直近のポインタ位置を優先してグローバル座標とする（Pixiの座標系）
        let globalPt: Point;
        if (lastPointerGlobalRef.current) {
          globalPt = lastPointerGlobalRef.current.clone();
        } else {
          const rect = (app.renderer.canvas as HTMLCanvasElement).getBoundingClientRect();
          const cssX = ev.clientX - rect.left;
          const cssY = ev.clientY - rect.top;
          const resolution = (app.renderer as any).resolution ?? 1;
          globalPt = new Point(cssX * resolution, cssY * resolution);
        }

        // ズーム前にカーソル直下のワールド座標を取得
        const beforeLocal = world.toLocal(globalPt);

        // スケール更新
        const delta = ev.deltaY > 0 ? -0.1 : 0.1;
        const oldScale = cameraRef.current.scale;
        const newScale = Math.max(0.5, Math.min(3, oldScale + delta));
        if (newScale === oldScale) return;
        cameraRef.current.scale = newScale;
        world.scale.set(newScale);

        // ズーム後に同じローカル点がどこに表示されるかを取得し、差分だけカメラ位置を補正
        const afterGlobal = world.toGlobal(beforeLocal);
        const dx = afterGlobal.x - globalPt.x;
        const dy = afterGlobal.y - globalPt.y;
        cameraRef.current.x -= dx;
        cameraRef.current.y -= dy;
        world.position.set(cameraRef.current.x, cameraRef.current.y);
      };
      canvas.addEventListener('wheel', onWheel, { passive: false });

      // WASD/矢印キーでパン
      const onKeyDown = (e: KeyboardEvent) => {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
          keysRef.current[e.code] = true;
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
          keysRef.current[e.code] = false;
        }
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      const panSpeed = 8;
      const tickerFn = (ticker: any) => {
        const delta = ticker.deltaTime ?? 1;
        let dx = 0;
        let dy = 0;
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dy += panSpeed * delta;
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dy += -panSpeed * delta;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dx += panSpeed * delta;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dx += -panSpeed * delta;
        if (dx !== 0 || dy !== 0) {
          cameraRef.current.x += dx;
          cameraRef.current.y += dy;
          world.position.set(cameraRef.current.x, cameraRef.current.y);
        }
      };
      app.ticker.add(tickerFn);

      const handleResize = () => {
        const w = Math.min(window.innerWidth, 1280);
        const h = Math.min(window.innerHeight, 720);
        app.renderer.resize(w, h);
      };
      window.addEventListener('resize', handleResize);
      
      // クリーンアップで外せるように、関数をref経由で保持
      (app as any).__handleResize = handleResize;
      (app as any).__wheel = onWheel;
      (app as any).__ptrDown = onPointerDown;
      (app as any).__ptrMove = onPointerMove;
      (app as any).__ptrUp = onPointerUp;
      (app as any).__ptrLeave = () => { hoverRef.current = null; hoverG.clear(); };
      (app as any).__keyDown = onKeyDown;
      (app as any).__keyUp = onKeyUp;
      (app as any).__tickerFn = tickerFn;
    };

    init();

    return () => {
      const app = appRef.current;
      appRef.current = null;
      isInitializedRef.current = false;
      
      // init 完了していない場合は destroy を呼ばない
      if (didInit && app) {
        try {
          const handler = (app as any).__handleResize as (() => void) | undefined;
          if (handler) window.removeEventListener('resize', handler);
          
          const wheel = (app as any).__wheel as ((e: WheelEvent) => void) | undefined;
          if (wheel) (app.renderer.canvas as HTMLCanvasElement)?.removeEventListener('wheel', wheel as any);

          const pd = (app as any).__ptrDown as any;
          const pm = (app as any).__ptrMove as any;
          const pu = (app as any).__ptrUp as any;
          const pl = (app as any).__ptrLeave as any;
          if (pd) app.stage.off('pointerdown', pd);
          if (pm) app.stage.off('pointermove', pm);
          if (pu) app.stage.off('pointerup', pu);
          if (pl) app.stage.off('pointerleave', pl);

          const kd = (app as any).__keyDown as any;
          const ku = (app as any).__keyUp as any;
          if (kd) window.removeEventListener('keydown', kd);
          if (ku) window.removeEventListener('keyup', ku);
          const tf = (app as any).__tickerFn as ((t: any) => void) | undefined;
          if (tf) app.ticker.remove(tf);
          app.destroy(true);
        }
        catch {
          // 破棄中例外は無視（未初期化や二重破棄対策）
        }
      }
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  }, [size.width, size.height]);

  return (
    <div ref={containerRef} className="relative overflow-hidden border-2 border-blue-500" style={{ width: '100%', height: '100%' }} />
  );
};

export default PixiGrid;
