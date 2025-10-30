import { Graphics, Sprite, Texture, Container } from 'pixi.js';
import type { GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import type { HeightTerrainTile } from '../types/terrainWithHeight';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './coordinates';
import { getFacilityRegistry } from './facilityLoader';
import { getRoadConnectionType } from './roadConnection';
import { drawHeightTile } from './terrainDrawing';
import { HEIGHT_DRAWING_CONSTANTS } from '../constants/terrainDrawingConstants';

// 地形色の取得
export const getTerrainColor = (terrain: string): number => {
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
};

// プレビュー色の決定
export const getPreviewColor = (
  facilityType: FacilityType,
  canAfford: boolean,
  isOccupied: boolean
): { color: number; alpha: number } => {
  if (!canAfford || isOccupied) {
    return { color: 0xfca5a5, alpha: 0.9 }; // 赤（建設不可）
  }

  // 施設カテゴリ別の色
  const facilityData = getFacilityRegistry()[facilityType];
  let color = 0x86efac; // デフォルト緑

  switch (facilityData.category) {
    case 'residential': color = 0x86efac; break;      // 緑（住宅）
    case 'commercial': color = 0x93c5fd; break;       // 青（商業）
    case 'industrial': color = 0xfef08a; break;       // 黄（工業）
    case 'infrastructure': color = 0x9ca3af; break;   // グレー（インフラ）
    case 'government': color = 0xc4b5fd; break;       // 紫（公共）
    case 'others': color = 0xf0abfc; break;           // ピンク（その他）
    default: color = 0x86efac; break;                 // デフォルト
  }

  return { color, alpha: 0.9 };
};

// 効果範囲の色を取得
export const getEffectColor = (facilityType: FacilityType): number => {
  switch (facilityType) {
    case 'police': return 0x87CEEB;     // スカイブルー
    case 'hospital': return 0xFFB6C1;   // ライトピンク
    case 'park': return 0x90EE90;       // ライトグリーン
    case 'city_hall': return 0xDDA0DD;  // プラム
    default: return 0x90EE90;           // デフォルト緑
  }
};

// 道路ドラッグ色の取得
export const getRoadDragColor = (canAfford: boolean, isOccupied: boolean) => {
  if (!canAfford || isOccupied) {
    return {
      color: 0xfca5a5, // 赤（建設不可）
      alpha: 0.7,
      strokeColor: 0xff0000 // 赤い境界線
    };
  }

  return {
    color: 0xFFD700, // 金色（デフォルト）
    alpha: 0.7,
    strokeColor: 0xFFA500 // オレンジ色の境界線
  };
};

// 地形描画
export const drawTerrain = (
  layer: Container,
  _terrainMap: Map<string, string>,
  size: GridSize,
  offsetX: number,
  offsetY: number,
  getTerrainAt: (x: number, y: number) => string | undefined,
  getPooledGraphics: () => Graphics,
  returnGraphics: (g: Graphics) => void,
  heightTerrainMap: Map<string, HeightTerrainTile>
) => {
  // 既存のGraphicsオブジェクトをプールに戻す
  layer.children.forEach(child => {
    if (child instanceof Graphics) {
      returnGraphics(child);
    }
  });
  layer.removeChildren();

  // 見える範囲のタイルを描画
  const maxX = Math.min(size.width, 120);
  const maxY = Math.min(size.height, 120);

  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < maxX; x++) {
      const terrainG = getPooledGraphics();
      
      if (!heightTerrainMap || heightTerrainMap.size === 0) {
        throw new Error('高さマップが初期化されていません');
      }

      const heightTile = heightTerrainMap.get(`${x},${y}`);
      if (!heightTile) {
        continue;
      }

      drawHeightTile(terrainG, heightTile, x, y, offsetX, offsetY, heightTerrainMap, size, getTerrainAt);

      const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
      const heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[heightTile.height];
      terrainG.zIndex = baseIsoY + heightOffset;
      layer.addChild(terrainG);
    }
  }
};

// 施設描画
export const drawFacilities = (
  layer: Container,
  facilities: Facility[],
  offsetX: number,
  offsetY: number,
  textures: Map<string, Texture>,
  _getPooledGraphics: () => Graphics,
  returnGraphics: (g: Graphics) => void,
  heightTerrainMap?: Map<string, HeightTerrainTile>
) => {
  // 既存のGraphicsオブジェクトをプールに戻す
  layer.children.forEach(child => {
    if (child instanceof Graphics) {
      returnGraphics(child);
    }
  });
  layer.removeChildren();

  // 施設マップを作成（道路接続判定用）
  const facilityMap = new Map<string, Facility>();
  facilities.forEach(facility => {
    facility.occupiedTiles.forEach(tile => {
      facilityMap.set(`${tile.x}-${tile.y}`, facility);
    });
  });

  facilities.forEach(facility => {
    const facilityData = getFacilityRegistry()[facility.type];

    // 道路接続描画処理
    if (facility.type === 'road') {
      facility.occupiedTiles.forEach(tile => {
        const connection = getRoadConnectionType(facilityMap, tile.x, tile.y);
        const imgPath = facilityData.imgPaths?.[connection.variantIndex];
        if (!imgPath) return;

        const texture = textures.get(imgPath);
        if (!texture) return;

        const sprite = new Sprite(texture);
        const baseIsoX = (tile.x - tile.y) * (ISO_TILE_WIDTH / 2) + offsetX;
        const baseIsoY = (tile.x + tile.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
        
        // 高さオフセットを取得して適用
        let heightOffset = 0;
        if (heightTerrainMap && heightTerrainMap.size > 0) {
          const heightTile = heightTerrainMap.get(`${tile.x},${tile.y}`);
          if (heightTile) {
            heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[heightTile.height];
          }
        }
        
        const adjustedIsoY = baseIsoY - heightOffset;

        // 道路のサイズ設定
        const imgSize = facilityData.imgSizes?.[connection.variantIndex] ?? { width: 32, height: 16 };
        sprite.width = imgSize.width;
        sprite.height = imgSize.height;

        // 道路のみアンカーを中心に設定
        sprite.anchor.set(0.5, 0.5);

        // 位置設定
        sprite.x = baseIsoX + ISO_TILE_WIDTH / 2;
        sprite.y = adjustedIsoY;

        // 回転の適用
        sprite.rotation = (connection.rotation * Math.PI) / 180;

        // フリップの適用
        if (connection.flip) {
          sprite.scale.x *= -1;   // 水平反転
        }

        // Z-index（高さオフセットを適用）
        sprite.zIndex = baseIsoY + heightOffset;
        layer.addChild(sprite);
      });
    } else {
      // 通常の施設
      const imgPath = facilityData.imgPaths?.[0];
      if (!imgPath) return;

      const texture = textures.get(imgPath);
      if (!texture) return;

      const sprite = new Sprite(texture);
      const center = facility.position;
      const baseIsoX = (center.x - center.y) * (ISO_TILE_WIDTH / 2) + offsetX;
      const baseIsoY = (center.x + center.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
      
      // 高さオフセットを取得して適用
      let heightOffset = 0;
      if (heightTerrainMap && heightTerrainMap.size > 0) {
        const heightTile = heightTerrainMap.get(`${center.x},${center.y}`);
        if (heightTile) {
          heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[heightTile.height];
        }
      }
      
      const adjustedIsoY = baseIsoY - heightOffset;

      // 画像サイズが分かる場合は中央寄せ。なければそのまま
      const size = facilityData.imgSizes?.[0];
      if (size) {
        sprite.anchor.set(0.5, 1.0);
        sprite.x = baseIsoX + ISO_TILE_WIDTH / 2;
        sprite.y = adjustedIsoY + (ISO_TILE_HEIGHT / 2) + ISO_TILE_HEIGHT * Math.floor(facilityData.size / 2);
        sprite.width = size.width;
        sprite.height = size.height;
      } else {
        sprite.x = baseIsoX;
        sprite.y = adjustedIsoY;
      }

      // Z-index（高さオフセットを適用）
      sprite.zIndex = baseIsoY + heightOffset;
      layer.addChild(sprite);
    }
  });
};

// プレビュー描画
export const drawPreview = (
  layer: Container,
  selectedFacilityType: FacilityType | null,
  hoverPosition: { x: number; y: number } | null,
  size: GridSize,
  offsetX: number,
  offsetY: number,
  money: number,
  facilities: Facility[],
  getPooledGraphics: () => Graphics,
  returnGraphics: (g: Graphics) => void,
  heightTerrainMap?: Map<string, HeightTerrainTile>
) => {
  if (!selectedFacilityType || !hoverPosition) return;

  // 既存のGraphicsオブジェクトをプールに戻す
  layer.children.forEach(child => {
    if (child instanceof Graphics) {
      returnGraphics(child);
    }
  });
  layer.removeChildren();

  const facilityData = getFacilityRegistry()[selectedFacilityType];
  const radius = Math.floor(facilityData.size / 2);
  const center = hoverPosition;

  // 施設マップを作成（既存施設の占有タイル）
  const facilityMap = new Map<string, Facility>();
  facilities.forEach(facility => {
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
        const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
        const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
        
        // 高さオフセットを取得して適用
        let heightOffset = 0;
        if (heightTerrainMap && heightTerrainMap.size > 0) {
          const heightTile = heightTerrainMap.get(`${x},${y}`);
          if (heightTile) {
            heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[heightTile.height];
          }
        }
        const isoY = baseIsoY - heightOffset;
        const isoX = baseIsoX;

        const previewG = getPooledGraphics();
        previewG.moveTo(isoX, isoY)
          .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
          .lineTo(isoX + ISO_TILE_WIDTH, isoY)
          .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
          .lineTo(isoX, isoY);

        // プレビューステータスを決定
        const tileKey = `${x}-${y}`;
        const canAfford = money >= facilityData.cost;
        const isOccupied = facilityMap.has(tileKey);
        
        // 斜面チェック
        let isSlope = false;
        if (heightTerrainMap && heightTerrainMap.size > 0) {
          const heightTile = heightTerrainMap.get(`${x},${y}`);
          if (heightTile && heightTile.isSlope) {
            isSlope = true;
          }
        }

        const { color, alpha } = getPreviewColor(selectedFacilityType, canAfford, isOccupied || isSlope);

        previewG.fill({ color, alpha });
        previewG.stroke({ color: 0xffffff, width: 1 });
        layer.addChild(previewG);
      }
    }
  }
};

// 効果範囲プレビュー描画
export const drawEffectPreview = (
  layer: Container,
  selectedFacilityType: FacilityType | null,
  hoverPosition: { x: number; y: number } | null,
  size: GridSize,
  offsetX: number,
  offsetY: number,
  getPooledGraphics: () => Graphics,
  returnGraphics: (g: Graphics) => void,
  heightTerrainMap?: Map<string, HeightTerrainTile>
) => {
  if (!selectedFacilityType || !hoverPosition) return;

  // 既存のGraphicsオブジェクトをプールに戻す
  layer.children.forEach(child => {
    if (child instanceof Graphics) {
      returnGraphics(child);
    }
  });
  layer.removeChildren();

  const facilityData = getFacilityRegistry()[selectedFacilityType];
  const effectRadius = facilityData.effectRadius ?? 0;

  if (effectRadius <= 0) return;

  const center = hoverPosition;

  // 効果範囲を描画
  for (let dx = -effectRadius; dx <= effectRadius; dx++) {
    for (let dy = -effectRadius; dy <= effectRadius; dy++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= effectRadius) {
        const x = center.x + dx;
        const y = center.y + dy;

        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
          const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
          
          // 高さオフセットを取得して適用
          let heightOffset = 0;
          if (heightTerrainMap && heightTerrainMap.size > 0) {
            const heightTile = heightTerrainMap.get(`${x},${y}`);
            if (heightTile) {
              heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[heightTile.height];
            }
          }
          const isoY = baseIsoY - heightOffset;
          const isoX = baseIsoX;

          const effectG = getPooledGraphics();
          effectG.moveTo(isoX, isoY)
            .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
            .lineTo(isoX + ISO_TILE_WIDTH, isoY)
            .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
            .lineTo(isoX, isoY);

          const color = getEffectColor(selectedFacilityType);

          effectG.fill({ color, alpha: 0.2 });
          effectG.stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
          layer.addChild(effectG);
        }
      }
    }
  }
};

// 道路ドラッグ範囲描画
export const drawRoadDragRange = (
  layer: Container,
  selectedFacilityType: FacilityType | null,
  isPlacing: boolean,
  startTile: { x: number; y: number } | null,
  endTile: { x: number; y: number } | null,
  size: GridSize,
  offsetX: number,
  offsetY: number,
  money: number,
  facilities: Facility[],
  getPooledGraphics: () => Graphics,
  returnGraphics: (g: Graphics) => void,
  heightTerrainMap?: Map<string, HeightTerrainTile>
) => {
  if (!isPlacing || !startTile || !endTile || selectedFacilityType !== 'road') return;

  // 既存のGraphicsオブジェクトをプールに戻す
  const existingChildren = layer.children.filter(child => child.name !== 'road-drag');
  existingChildren.forEach(child => {
    if (child instanceof Graphics) {
      returnGraphics(child);
    }
  });
  layer.removeChildren();

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
  facilities.forEach(facility => {
    facility.occupiedTiles.forEach(tile => {
      facilityMap.set(`${tile.x}-${tile.y}`, facility);
    });
  });

  // 道路のコストを取得
  const roadData = getFacilityRegistry()['road'];

  // ドラッグ範囲を描画
  tiles.forEach(({ x, y }) => {
    const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
    const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
    
    // 高さオフセットを取得して適用
    let heightOffset = 0;
    if (heightTerrainMap && heightTerrainMap.size > 0) {
      const heightTile = heightTerrainMap.get(`${x},${y}`);
      if (heightTile) {
        heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[heightTile.height];
      }
    }
    const isoY = baseIsoY - heightOffset;
    const isoX = baseIsoX;

    const dragG = getPooledGraphics();
    dragG.name = 'road-drag';
    dragG.moveTo(isoX, isoY)
      .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY - ISO_TILE_HEIGHT / 2)
      .lineTo(isoX + ISO_TILE_WIDTH, isoY)
      .lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2)
      .lineTo(isoX, isoY);

    // プレビューステータスを決定
    const tileKey = `${x}-${y}`;
    const canAfford = money >= roadData.cost;
    const isOccupied = facilityMap.has(tileKey);
    
    // 斜面チェック
    let isSlope = false;
    if (heightTerrainMap && heightTerrainMap.size > 0) {
      const heightTile = heightTerrainMap.get(`${x},${y}`);
      if (heightTile && heightTile.isSlope) {
        isSlope = true;
      }
    }

    const { color, alpha, strokeColor } = getRoadDragColor(canAfford, isOccupied || isSlope);

    dragG.fill({ color, alpha });
    dragG.stroke({ color: strokeColor, width: 2 });
    layer.addChild(dragG);
  });
};
