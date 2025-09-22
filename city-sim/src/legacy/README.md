# Legacy Canvas Implementation

このディレクトリには、Pixi.jsベースの実装に移行する前のCanvasAPIベースの実装が保存されています。

## 移動されたファイル

### Components
- `CanvasGrid.tsx` - Canvas APIを使用したグリッド描画コンポーネント
- `grid.tsx` - 古いグリッドコンポーネント

### Hooks
- `useCamera.ts` - カメラ制御フック
- `useMouseDrag.ts` - マウスドラッグ処理フック
- `useGridCoordinates.ts` - グリッド座標変換フック
- `useFacilityPlacement.ts` - 施設配置フック
- `useFacilityPreview.ts` - 施設プレビュー表示フック
- `useFacilityDisplay.ts` - 施設表示フック
- `useHover.ts` - ホバー状態管理フック
- `useGridConstants.ts` - グリッド定数フック
- `useMouseEvents.ts` - マウスイベント処理フック
- `useTileInteraction.ts` - タイルインタラクション処理フック

### Utils
- `drawingUtils.ts` - Canvas描画ユーティリティ関数

## 注意事項

これらのファイルは現在使用されていません。Pixi.jsベースの実装（`MapGrid.tsx`、`usePixiDrawing.ts`など）に完全に置き換えられています。

参考用として保持されていますが、将来的に削除される可能性があります。
