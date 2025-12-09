# ブラウザBIツール システム仕様書

## 1. システム概要

### 1.1 システム名
**Browser BI Tool**

### 1.2 システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser BI Tool                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │   View Layer │   │  Controller  │   │    Model Layer   │    │
│  │   (HTML/CSS) │◄──┤   (Vue.js)   │──►│    (Pinia)       │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│          │                  │                    │              │
│          │          ┌──────┴──────┐             │              │
│          │          ▼             ▼             ▼              │
│  ┌───────┴──────────────┬─────────────┬─────────────────┐      │
│  │   UI Components      │   Services   │    Stores       │      │
│  │  - ChartPanel        │  - DataProc  │  - DataStore    │      │
│  │  - FilterPanel       │  - Exporter  │  - ChartStore   │      │
│  │  - DashboardGrid     │  - ChartGen  │  - FilterStore  │      │
│  │  - ExportPanel       │             │  - UIStore      │      │
│  └──────────────────────┴─────────────┴─────────────────┘      │
│                               │                                 │
│  ┌────────────────────────────┴────────────────────────────┐   │
│  │                   External Libraries                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐    │   │
│  │  │ ECharts │ │ SheetJS │ │pptxgenjs │ │ TailwindCSS│    │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Local Storage                              │
│  - Dashboard Settings  - User Preferences  - Cached Data        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ディレクトリ構成

```
browser-bi-tool/
├── index.html                    # エントリーポイント
├── README.md                     # プロジェクト説明
├── package.json                  # 依存関係（Vite使用時）
├── vite.config.js               # Vite設定
│
├── docs/                         # ドキュメント
│   ├── requirements.md          # 要件定義書
│   └── system-specification.md  # システム仕様書（本書）
│
├── public/                       # 静的ファイル
│   ├── favicon.ico
│   └── sample-data/             # サンプルデータ
│       ├── sales.csv
│       └── inventory.xlsx
│
├── src/                          # ソースコード
│   ├── main.js                  # アプリエントリー
│   ├── App.vue                  # ルートコンポーネント
│   │
│   ├── assets/                  # 静的アセット
│   │   ├── styles/
│   │   │   ├── main.css        # グローバルスタイル
│   │   │   ├── variables.css   # CSS変数
│   │   │   └── components.css  # コンポーネントスタイル
│   │   └── images/
│   │
│   ├── components/              # UIコンポーネント
│   │   ├── common/             # 汎用コンポーネント
│   │   │   ├── Button.vue
│   │   │   ├── Modal.vue
│   │   │   ├── Dropdown.vue
│   │   │   └── Slider.vue
│   │   │
│   │   ├── data/               # データ関連コンポーネント
│   │   │   ├── FileUploader.vue
│   │   │   ├── DataPreview.vue
│   │   │   └── DataTable.vue
│   │   │
│   │   ├── charts/             # チャートコンポーネント
│   │   │   ├── BaseChart.vue
│   │   │   ├── BarChart.vue
│   │   │   ├── LineChart.vue
│   │   │   ├── PieChart.vue
│   │   │   ├── ComboChart.vue
│   │   │   └── ChartConfig.vue
│   │   │
│   │   ├── filters/            # フィルターコンポーネント
│   │   │   ├── FilterPanel.vue
│   │   │   ├── DropdownFilter.vue
│   │   │   ├── RangeSlider.vue
│   │   │   ├── DateRangePicker.vue
│   │   │   └── MultiSelect.vue
│   │   │
│   │   ├── dashboard/          # ダッシュボードコンポーネント
│   │   │   ├── DashboardGrid.vue
│   │   │   ├── ChartWidget.vue
│   │   │   └── WidgetToolbar.vue
│   │   │
│   │   └── export/             # エクスポートコンポーネント
│   │       ├── ExportPanel.vue
│   │       ├── ExcelExport.vue
│   │       └── PowerPointExport.vue
│   │
│   ├── views/                   # ページコンポーネント
│   │   ├── HomeView.vue        # ホーム（ファイルアップロード）
│   │   ├── AnalysisView.vue    # 分析画面
│   │   └── DashboardView.vue   # ダッシュボード画面
│   │
│   ├── stores/                  # Pinia ストア
│   │   ├── index.js            # ストア初期化
│   │   ├── dataStore.js        # データセット管理
│   │   ├── chartStore.js       # チャート設定管理
│   │   ├── filterStore.js      # フィルター状態管理
│   │   ├── dashboardStore.js   # ダッシュボード管理
│   │   └── uiStore.js          # UI状態管理
│   │
│   ├── services/                # ビジネスロジック
│   │   ├── dataProcessor.js    # データ解析・変換
│   │   ├── chartGenerator.js   # EChartsオプション生成
│   │   ├── filterEngine.js     # フィルタリング処理
│   │   ├── excelExporter.js    # Excel出力
│   │   ├── pptxExporter.js     # PowerPoint出力
│   │   └── storageManager.js   # ローカルストレージ管理
│   │
│   ├── utils/                   # ユーティリティ
│   │   ├── formatters.js       # 数値・日付フォーマット
│   │   ├── validators.js       # バリデーション
│   │   └── constants.js        # 定数定義
│   │
│   └── router/                  # Vue Router
│       └── index.js
│
└── tests/                        # テスト
    ├── unit/
    └── e2e/
```

---

## 3. モジュール設計

### 3.1 データ処理サービス (dataProcessor.js)

#### 3.1.1 責務
- ファイル読み込み（CSV, Excel, JSON）
- データ型自動検出
- データ変換・正規化

#### 3.1.2 主要関数

```javascript
/**
 * CSVファイルを解析
 * @param {File} file - アップロードされたファイル
 * @returns {Promise<{columns: Array, data: Array, types: Object}>}
 */
async function parseCSV(file) { }

/**
 * Excelファイルを解析
 * @param {File} file - アップロードされたファイル
 * @param {string} sheetName - シート名（省略時は最初のシート）
 * @returns {Promise<{columns: Array, data: Array, types: Object, sheets: Array}>}
 */
async function parseExcel(file, sheetName) { }

/**
 * データ型を自動検出
 * @param {Array} columnData - カラムデータの配列
 * @returns {string} - 'number' | 'date' | 'string' | 'boolean'
 */
function detectDataType(columnData) { }

/**
 * データを正規化（数値変換、日付パース等）
 * @param {Array} data - 生データ
 * @param {Object} types - カラム型定義
 * @returns {Array} - 正規化されたデータ
 */
function normalizeData(data, types) { }
```

### 3.2 チャート生成サービス (chartGenerator.js)

#### 3.2.1 責務
- EChartsオプションオブジェクトの生成
- チャート種別ごとの設定変換

#### 3.2.2 主要関数

```javascript
/**
 * チャートオプションを生成
 * @param {string} chartType - チャート種別
 * @param {Object} config - チャート設定
 * @param {Array} data - 表示データ
 * @returns {Object} - EChartsオプション
 */
function generateChartOptions(chartType, config, data) { }

/**
 * 棒グラフオプション生成
 */
function generateBarOptions(config, data) { }

/**
 * 折れ線グラフオプション生成
 */
function generateLineOptions(config, data) { }

/**
 * 組合せチャートオプション生成
 */
function generateComboOptions(config, data) { }
```

### 3.3 フィルターエンジン (filterEngine.js)

#### 3.3.1 責務
- フィルター条件の適用
- 複合フィルターの処理

#### 3.3.2 主要関数

```javascript
/**
 * データにフィルターを適用
 * @param {Array} data - 元データ
 * @param {Array} filters - フィルター条件配列
 * @returns {Array} - フィルター後データ
 */
function applyFilters(data, filters) { }

/**
 * 単一フィルター条件を評価
 * @param {Object} row - データ行
 * @param {Object} filter - フィルター条件
 * @returns {boolean}
 */
function evaluateFilter(row, filter) { }

/**
 * フィルター用の選択肢リストを生成
 * @param {Array} data - データ配列
 * @param {string} column - カラム名
 * @returns {Array} - ユニーク値の配列
 */
function getUniqueValues(data, column) { }
```

### 3.4 エクスポートサービス

#### 3.4.1 Excelエクスポート (excelExporter.js)

```javascript
/**
 * データをExcelファイルとして出力
 * @param {Array} data - データ配列
 * @param {Array} columns - カラム定義
 * @param {string} filename - ファイル名
 */
function exportToExcel(data, columns, filename) { }

/**
 * チャート画像をExcelに埋め込み
 * @param {string} chartImage - Base64エンコード画像
 * @param {Object} workbook - SheetJSワークブック
 */
function embedChartImage(chartImage, workbook) { }
```

#### 3.4.2 PowerPointエクスポート (pptxExporter.js)

```javascript
/**
 * チャートをPowerPointスライドとして出力
 * @param {Array} charts - チャート画像配列
 * @param {Object} options - エクスポートオプション
 * @param {string} filename - ファイル名
 */
function exportToPowerPoint(charts, options, filename) { }

/**
 * ダッシュボード全体をPowerPointに出力
 * @param {Object} dashboard - ダッシュボード設定
 */
function exportDashboardToPPTX(dashboard) { }
```

---

## 4. 状態管理設計

### 4.1 データストア (dataStore.js)

```javascript
export const useDataStore = defineStore('data', {
  state: () => ({
    // 読み込んだデータセット
    datasets: [],
    // 現在アクティブなデータセット
    activeDatasetId: null,
    // データ読み込み状態
    isLoading: false,
    // エラー情報
    error: null
  }),

  getters: {
    activeDataset: (state) => { },
    columns: (state) => { },
    filteredData: (state) => { }
  },

  actions: {
    async loadFile(file) { },
    setActiveDataset(id) { },
    removeDataset(id) { }
  }
})
```

### 4.2 チャートストア (chartStore.js)

```javascript
export const useChartStore = defineStore('chart', {
  state: () => ({
    // チャート設定リスト
    charts: [],
    // 選択中のチャート
    activeChartId: null
  }),

  getters: {
    activeChart: (state) => { },
    chartById: (state) => (id) => { }
  },

  actions: {
    addChart(config) { },
    updateChart(id, config) { },
    removeChart(id) { },
    duplicateChart(id) { }
  }
})
```

### 4.3 フィルターストア (filterStore.js)

```javascript
export const useFilterStore = defineStore('filter', {
  state: () => ({
    // アクティブなフィルター
    filters: [],
    // フィルター履歴
    history: []
  }),

  getters: {
    hasActiveFilters: (state) => { },
    filterSummary: (state) => { }
  },

  actions: {
    addFilter(filter) { },
    updateFilter(id, filter) { },
    removeFilter(id) { },
    clearAllFilters() { },
    applyFiltersToData(data) { }
  }
})
```

### 4.4 ダッシュボードストア (dashboardStore.js)

```javascript
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // ウィジェットレイアウト
    layout: [],
    // ダッシュボード設定
    settings: {
      name: '',
      theme: 'light',
      gridSize: 12
    }
  }),

  actions: {
    updateLayout(layout) { },
    addWidget(widget) { },
    removeWidget(id) { },
    saveDashboard() { },
    loadDashboard(config) { },
    exportDashboardConfig() { }
  }
})
```

---

## 5. データフロー

### 5.1 ファイルインポートフロー

```
┌──────────┐     ┌───────────────┐     ┌─────────────┐
│ ユーザー  │────►│ FileUploader  │────►│ dataProcessor│
│ ファイル  │     │ コンポーネント │     │ .parseCSV() │
└──────────┘     └───────────────┘     └──────┬──────┘
                                               │
     ┌─────────────────────────────────────────┘
     │
     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ detectDataType│────►│ normalizeData│────►│  dataStore   │
│ (型検出)      │     │ (正規化)     │     │ .loadFile()  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 5.2 チャート描画フロー

```
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│  dataStore   │────►│ filterStore  │────►│ chartGenerator│
│ (元データ)   │     │ (フィルタ適用)│     │ (オプション生成)│
└──────────────┘     └──────────────┘     └───────┬───────┘
                                                   │
     ┌─────────────────────────────────────────────┘
     │
     ▼
┌──────────────┐     ┌──────────────┐
│ EChartsライブラリ│────►│ 画面描画    │
│ (レンダリング) │     │             │
└──────────────┘     └──────────────┘
```

### 5.3 エクスポートフロー

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ ExportPanel  │────►│ チャート画像取得│────►│ excelExporter│
│ (UI操作)     │     │ (getDataURL) │     │ or pptxExporter│
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
     ┌────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────┐
│ ファイルダウンロード（Blob → URL → download trigger）│
└──────────────────────────────────────────────────────┘
```

---

## 6. 画面設計

### 6.1 画面一覧

| 画面ID | 画面名 | 説明 |
|--------|--------|------|
| SCR-001 | ホーム画面 | ファイルアップロード、サンプルデータ選択 |
| SCR-002 | データプレビュー | インポートデータの確認・編集 |
| SCR-003 | 分析画面 | チャート作成・設定 |
| SCR-004 | ダッシュボード | 複数チャートのレイアウト |
| SCR-005 | エクスポート | 出力設定・実行 |

### 6.2 画面遷移図

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌─────────┐      ┌───────────────┐      ┌─────────────┐ │
│    │  ホーム  │─────►│ データプレビュー│─────►│   分析画面   │ │
│    │         │      │               │      │            │ │
│    └─────────┘      └───────────────┘      └──────┬──────┘ │
│          │                                        │        │
│          │              ┌─────────────────────────┘        │
│          │              │                                  │
│          │              ▼                                  │
│          │        ┌──────────────┐       ┌──────────────┐  │
│          └───────►│ ダッシュボード │◄─────►│  エクスポート │  │
│                   │              │       │              │  │
│                   └──────────────┘       └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 画面レイアウト（分析画面）

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Browser BI Tool        [Home] [Dashboard] [Export] [?] │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌─────────────────────────────────────────┐   │
│ │ データソース   │ │                                         │   │
│ │ ┌───────────┐ │ │                                         │   │
│ │ │ sales.csv │ │ │                                         │   │
│ │ └───────────┘ │ │           チャートエリア                 │   │
│ ├───────────────┤ │                                         │   │
│ │ フィルター     │ │         (EChartsレンダリング)            │   │
│ │ ┌───────────┐ │ │                                         │   │
│ │ │ 地域 ▼    │ │ │                                         │   │
│ │ └───────────┘ │ │                                         │   │
│ │ ┌───────────┐ │ │                                         │   │
│ │ │ 期間 ─○─ │ │ │                                         │   │
│ │ └───────────┘ │ └─────────────────────────────────────────┘   │
│ ├───────────────┤ ┌─────────────────────────────────────────┐   │
│ │ チャート設定   │ │ チャート設定パネル                       │   │
│ │ ┌───────────┐ │ │ 種別: [棒グラフ ▼]  X軸: [月 ▼]        │   │
│ │ │ 種別 ▼    │ │ │ Y軸: [売上 ▼]      色: [カテゴリ ▼]    │   │
│ │ │ X軸 ▼     │ │ │ [プレビュー更新]  [ダッシュボードに追加] │   │
│ │ │ Y軸 ▼     │ │ └─────────────────────────────────────────┘   │
│ │ └───────────┘ │                                               │
│ └───────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. API仕様（サービス関数）

### 7.1 dataProcessor API

| 関数名 | 引数 | 戻り値 | 説明 |
|--------|------|--------|------|
| `parseCSV` | `File` | `Promise<DataSet>` | CSV解析 |
| `parseExcel` | `File, string?` | `Promise<DataSet>` | Excel解析 |
| `parseJSON` | `File` | `Promise<DataSet>` | JSON解析 |
| `detectDataType` | `Array` | `string` | 型検出 |
| `normalizeData` | `Array, Object` | `Array` | 正規化 |

### 7.2 chartGenerator API

| 関数名 | 引数 | 戻り値 | 説明 |
|--------|------|--------|------|
| `generateChartOptions` | `string, Object, Array` | `Object` | EChartsオプション生成 |
| `getChartTypes` | - | `Array` | 利用可能チャート種別 |
| `getDefaultConfig` | `string` | `Object` | デフォルト設定取得 |

### 7.3 filterEngine API

| 関数名 | 引数 | 戻り値 | 説明 |
|--------|------|--------|------|
| `applyFilters` | `Array, Array` | `Array` | フィルター適用 |
| `getUniqueValues` | `Array, string` | `Array` | ユニーク値取得 |
| `getMinMax` | `Array, string` | `{min, max}` | 範囲取得 |

### 7.4 exporter API

| 関数名 | 引数 | 戻り値 | 説明 |
|--------|------|--------|------|
| `exportToExcel` | `Array, Array, string` | `void` | Excel出力 |
| `exportToPowerPoint` | `Array, Object, string` | `void` | PPTX出力 |
| `exportChartAsPNG` | `EChartsInstance, string` | `void` | PNG出力 |
| `exportChartAsSVG` | `EChartsInstance, string` | `void` | SVG出力 |

---

## 8. エラーハンドリング

### 8.1 エラー種別

| エラーコード | エラー名 | 説明 | ユーザーメッセージ |
|--------------|----------|------|-------------------|
| E001 | FileReadError | ファイル読み込み失敗 | ファイルを読み込めませんでした |
| E002 | InvalidFileFormat | 非対応ファイル形式 | 対応していないファイル形式です |
| E003 | DataParseError | データ解析失敗 | データの解析に失敗しました |
| E004 | ChartRenderError | チャート描画失敗 | チャートの表示に失敗しました |
| E005 | ExportError | エクスポート失敗 | ファイルの出力に失敗しました |
| E006 | StorageQuotaExceeded | ストレージ容量超過 | 保存容量を超えました |

### 8.2 エラー処理フロー

```javascript
try {
  // 処理実行
} catch (error) {
  // 1. エラーログ記録
  console.error(`[${error.code}] ${error.message}`)

  // 2. ユーザー通知
  uiStore.showNotification({
    type: 'error',
    message: ERROR_MESSAGES[error.code]
  })

  // 3. 状態リセット（必要に応じて）
  dataStore.resetLoadingState()
}
```

---

## 9. 外部ライブラリバージョン

| ライブラリ | バージョン | 用途 |
|------------|-----------|------|
| Vue.js | ^3.4 | UIフレームワーク |
| Pinia | ^2.1 | 状態管理 |
| Vue Router | ^4.2 | ルーティング |
| ECharts | ^5.5 | チャート描画 |
| SheetJS (xlsx) | ^0.20 | Excel読み書き |
| pptxgenjs | ^3.12 | PowerPoint生成 |
| TailwindCSS | ^3.4 | スタイリング |
| Vite | ^5.0 | ビルドツール |

---

## 10. デプロイ設定（GitHub Pages）

### 10.1 ビルドコマンド

```bash
npm run build
```

### 10.2 GitHub Actions設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 10.3 Vite設定（GitHub Pages用）

```javascript
// vite.config.js
export default defineConfig({
  base: '/browser-bi-tool/',  // リポジトリ名
  build: {
    outDir: 'dist'
  }
})
```

---

## 11. 更新履歴

| 日付 | 版 | 更新内容 |
|------|-----|----------|
| 2025-12-09 | 1.0 | 初版作成 |
