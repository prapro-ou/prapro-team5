# 開発ガイドライン

## Git ブランチ

### ブランチ構成
- **main**: 本番環境用（常に動作する状態を保つ）
- **dev**: 開発統合用（機能統合テスト）
- **feat/機能名**: 各機能開発用

### ブランチ運用ルール
1. 新機能開発時は `dev` から `feat/機能名` ブランチを作成
2. 作業完了後、プルリクエストで `dev` にマージ
3. レビュー必須（最低1名の承認が必要）

### コミットメッセージ規約
日本語で端的に

## 作業分担

### 担当領域
追記予定

## 開発環境セットアップ
Windows11のVSCodeで作業
### 初回セットアップ
```bash
# リポジトリクローン
git clone [リポジトリURL]
cd prapro-team5

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### 日常の作業フロー
```bash
# 最新の dev を取得
git checkout dev
git pull origin dev

# 新しい feat ブランチ作成
git checkout -b feat/grid-system

# 作業・コミット
git add .
git commit -m "グリッドコンポーネントの実装"

# リモートにプッシュ
git push origin feat/grid-system

# プルリクエスト作成（GitHub上で）
```

## コーディング規約
追記予定

### ファイル構成
```
src/
├── components/     # 再利用可能なコンポーネント
├── pages/          # ページコンポーネント（ページ全体）
├── hooks/          # カスタムフック
├── types/          # 型定義
├── utils/          # ユーティリティ関数
├── stores/         # グローバルの状態管理
└── styles/         # 共通スタイルファイル
```

## 定例ミーティング
追記予定

## トラブルシューティング
あれば追加
