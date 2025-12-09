<template>
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- サイドパネル -->
    <aside class="lg:w-80 flex-shrink-0 space-y-4">
      <!-- データソース -->
      <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="font-semibold text-gray-800 mb-3">データソース</h3>
        <div v-if="activeDataset" class="text-sm">
          <p class="font-medium text-primary-600">{{ activeDataset.name }}</p>
          <p class="text-gray-500">{{ activeDataset.rowCount }}行 × {{ activeDataset.columns.length }}列</p>
        </div>
        <div v-else class="text-gray-500 text-sm">
          <router-link to="/" class="text-primary-500 hover:underline">
            データをアップロード
          </router-link>
        </div>
      </div>

      <!-- チャート設定 -->
      <div class="bg-white rounded-lg shadow-md p-4" v-if="activeDataset">
        <h3 class="font-semibold text-gray-800 mb-3">チャート設定</h3>

        <div class="space-y-3">
          <!-- チャート種別 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">チャート種別</label>
            <select v-model="chartConfig.type" class="select-box">
              <option value="bar">棒グラフ</option>
              <option value="line">折れ線グラフ</option>
              <option value="pie">円グラフ</option>
              <option value="scatter">散布図</option>
              <option value="area">面グラフ</option>
              <option value="combo">組合せチャート</option>
            </select>
          </div>

          <!-- X軸 / カテゴリ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ chartConfig.type === 'pie' ? 'カテゴリ' : 'X軸' }}
            </label>
            <select v-model="chartConfig.xAxis" class="select-box">
              <option value="">選択してください</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>

          <!-- 日付単位変換（X軸選択時のみ） -->
          <div v-if="chartConfig.xAxis && isDateColumn(chartConfig.xAxis)">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              日付単位
              <span class="text-xs text-gray-500">（時系列集計）</span>
            </label>
            <select v-model="chartConfig.xAxisDateUnit" class="select-box">
              <option v-for="(label, key) in dateUnitLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>

          <!-- Y軸 / 値 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ chartConfig.type === 'pie' ? '値' : 'Y軸' }}
            </label>
            <select v-model="chartConfig.yAxis" class="select-box">
              <option value="">選択してください</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>

          <!-- 集計方法 -->
          <div v-if="chartConfig.type !== 'scatter'">
            <label class="block text-sm font-medium text-gray-700 mb-1">集計方法</label>
            <select v-model="chartConfig.aggregation" class="select-box">
              <option value="sum">合計</option>
              <option value="count">カウント</option>
              <option value="avg">平均</option>
              <option value="max">最大</option>
              <option value="min">最小</option>
              <option value="distinct">ユニーク数</option>
            </select>
          </div>

          <!-- グループ化（系列分割） -->
          <div v-if="chartConfig.type === 'bar' || chartConfig.type === 'line' || chartConfig.type === 'area'">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              グループ化
              <span class="text-xs text-gray-500">（系列分割）</span>
            </label>
            <select v-model="chartConfig.groupBy" class="select-box">
              <option value="">なし</option>
              <option v-for="col in columns.filter(c => c !== chartConfig.xAxis)" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>

          <!-- 積み上げモード（棒グラフ＋グループ化時のみ） -->
          <div v-if="chartConfig.type === 'bar' && chartConfig.groupBy">
            <label class="block text-sm font-medium text-gray-700 mb-1">表示モード</label>
            <select v-model="chartConfig.stackMode" class="select-box">
              <option value="none">並列（グループ化）</option>
              <option value="stacked">積み上げ</option>
              <option value="percent">100%積み上げ</option>
            </select>
          </div>

          <!-- 組合せチャート用 -->
          <div v-if="chartConfig.type === 'combo'">
            <label class="block text-sm font-medium text-gray-700 mb-1">折れ線（Y軸2）</label>
            <select v-model="chartConfig.lineAxis" class="select-box">
              <option value="">選択してください</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>

          <!-- ソート -->
          <div v-if="chartConfig.type !== 'pie' && chartConfig.type !== 'scatter' && !chartConfig.groupBy">
            <label class="block text-sm font-medium text-gray-700 mb-1">並び順</label>
            <select v-model="chartConfig.sortBy" class="select-box">
              <option value="none">データ順</option>
              <option value="value_desc">値（大→小）</option>
              <option value="value_asc">値（小→大）</option>
              <option value="label_asc">ラベル（昇順）</option>
              <option value="label_desc">ラベル（降順）</option>
            </select>
          </div>

          <!-- ズーム有効化 -->
          <div v-if="chartConfig.type !== 'pie' && chartConfig.type !== 'scatter'" class="flex items-center">
            <input
              type="checkbox"
              id="enableZoom"
              v-model="chartConfig.enableZoom"
              class="h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
            <label for="enableZoom" class="ml-2 text-sm text-gray-700">ズーム有効</label>
          </div>

          <!-- タイトル -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input
              v-model="chartConfig.title"
              type="text"
              class="select-box"
              placeholder="チャートタイトル（自動生成）"
            />
          </div>
        </div>
      </div>

      <!-- フィルター -->
      <div class="bg-white rounded-lg shadow-md p-4" v-if="activeDataset">
        <h3 class="font-semibold text-gray-800 mb-3">フィルター</h3>

        <div class="space-y-3">
          <div v-for="(filter, index) in filters" :key="index" class="border-b pb-3">
            <div class="flex items-center justify-between mb-2">
              <select v-model="filter.column" class="select-box text-sm flex-1 mr-2">
                <option value="">カラム選択</option>
                <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
              </select>
              <button @click="removeFilter(index)" class="text-red-500 hover:text-red-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <select v-if="filter.column" v-model="filter.value" class="select-box text-sm">
              <option value="">全て</option>
              <option v-for="val in getUniqueValues(filter.column)" :key="val" :value="val">
                {{ val }}
              </option>
            </select>
          </div>

          <button @click="addFilter" class="text-sm text-primary-500 hover:text-primary-700 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            フィルター追加
          </button>
        </div>
      </div>

      <!-- エクスポート -->
      <div class="bg-white rounded-lg shadow-md p-4" v-if="activeDataset">
        <h3 class="font-semibold text-gray-800 mb-3">エクスポート</h3>
        <div class="space-y-2">
          <button @click="exportPNG" class="btn-primary w-full text-sm">
            PNG画像として保存
          </button>
          <button @click="handleExportPPT" class="btn-accent w-full text-sm">
            PowerPointに出力
          </button>
          <button @click="handleExportExcel" class="btn-secondary w-full text-sm">
            集計データをExcel出力
          </button>
          <button @click="handleExportCSV" class="btn-secondary w-full text-sm">
            フィルタ済みデータをCSV出力
          </button>
        </div>
      </div>
    </aside>

    <!-- メインエリア -->
    <main class="flex-1">
      <!-- チャートエリア -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <div v-if="!activeDataset" class="text-center py-16 text-gray-500">
          <p>データをアップロードしてください</p>
          <router-link to="/" class="text-primary-500 hover:underline mt-2 inline-block">
            ホームに戻る
          </router-link>
        </div>
        <div v-else-if="!chartConfig.xAxis || !chartConfig.yAxis" class="text-center py-16 text-gray-500">
          <p>左のパネルでチャート設定を行ってください</p>
        </div>
        <div v-else ref="chartContainer" class="w-full" style="height: 450px;"></div>
      </div>

      <!-- データプレビュー -->
      <div class="bg-white rounded-lg shadow-md p-4" v-if="activeDataset">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">データプレビュー</h3>
          <span class="text-sm text-gray-500">
            {{ filteredData.length }} / {{ activeDataset.rowCount }} 行
          </span>
        </div>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="data-table">
            <thead class="sticky top-0">
              <tr>
                <th v-for="col in columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewData" :key="index">
                <td v-for="col in columns" :key="col">{{ formatValue(row[col]) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { generateChartOptions, dateUnitLabels, applyDateUnitConversion } from '@/services/chartGenerator'
import { exportToExcel, exportToCSV, exportAggregatedToExcel, exportChartToPowerPoint } from '@/services/exportService'
import * as echarts from 'echarts'

const dataStore = useDataStore()
const chartContainer = ref(null)
let chartInstance = null

// チャート設定
const chartConfig = ref({
  type: 'bar',
  xAxis: '',
  yAxis: '',
  lineAxis: '',
  title: '',
  aggregation: 'sum',
  groupBy: '',
  stackMode: 'none',
  sortBy: 'none',
  enableZoom: false,
  xAxisDateUnit: 'none'  // 日付単位変換
})

// フィルター
const filters = ref([])

// データ取得
const activeDataset = computed(() => dataStore.activeDataset)
const columns = computed(() => activeDataset.value?.columns || [])

// フィルター適用後データ
const filteredData = computed(() => {
  if (!activeDataset.value) return []
  let data = [...activeDataset.value.data]

  filters.value.forEach(filter => {
    if (filter.column && filter.value) {
      data = data.filter(row => String(row[filter.column]) === String(filter.value))
    }
  })

  return data
})

// プレビュー用データ（最大100行）
const previewData = computed(() => filteredData.value.slice(0, 100))

// 日付カラムかどうか判定
function isDateColumn(column) {
  if (!activeDataset.value?.types) return false
  return activeDataset.value.types[column] === 'date'
}

// 日付単位変換を適用したデータ
const chartData = computed(() => {
  let data = filteredData.value
  if (chartConfig.value.xAxisDateUnit && chartConfig.value.xAxisDateUnit !== 'none' && chartConfig.value.xAxis) {
    data = applyDateUnitConversion(data, chartConfig.value.xAxis, chartConfig.value.xAxisDateUnit)
  }
  return data
})

// ユニーク値取得
function getUniqueValues(column) {
  if (!activeDataset.value) return []
  const values = activeDataset.value.data.map(row => row[column])
  return [...new Set(values)].filter(v => v !== null && v !== '').slice(0, 100)
}

// フィルター操作
function addFilter() {
  filters.value.push({ column: '', value: '' })
}

function removeFilter(index) {
  filters.value.splice(index, 1)
}

// 値フォーマット
function formatValue(value) {
  if (value === null || value === undefined) return '-'
  if (value instanceof Date) {
    return value.toLocaleDateString('ja-JP')
  }
  if (typeof value === 'number') {
    return value.toLocaleString('ja-JP')
  }
  return String(value)
}

// チャート更新
function updateChart() {
  if (!chartContainer.value || !activeDataset.value) return
  if (!chartConfig.value.xAxis || !chartConfig.value.yAxis) return

  // インスタンス作成
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }

  // オプション生成
  const config = {
    xAxis: chartConfig.value.xAxis,
    yAxis: chartConfig.value.yAxis,
    category: chartConfig.value.xAxis,
    value: chartConfig.value.yAxis,
    barAxis: chartConfig.value.yAxis,
    lineAxis: chartConfig.value.lineAxis || chartConfig.value.yAxis,
    title: chartConfig.value.title,
    aggregation: chartConfig.value.aggregation,
    groupBy: chartConfig.value.groupBy,
    stackMode: chartConfig.value.stackMode,
    sortBy: chartConfig.value.sortBy,
    enableZoom: chartConfig.value.enableZoom
  }

  const options = generateChartOptions(chartConfig.value.type, config, chartData.value)
  chartInstance.setOption(options, true)
}

// PNG出力
function exportPNG() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })
  const link = document.createElement('a')
  link.href = url
  link.download = `chart_${Date.now()}.png`
  link.click()
}

// Excel出力（集計データ）
function handleExportExcel() {
  if (!chartConfig.value.xAxis || !chartConfig.value.yAxis) {
    alert('チャート設定を完了してください')
    return
  }
  exportAggregatedToExcel(chartConfig.value, filteredData.value, `aggregated_${Date.now()}`)
}

// CSV出力（フィルタ済みデータ）
function handleExportCSV() {
  if (!activeDataset.value) return
  exportToCSV(filteredData.value, columns.value, `data_${Date.now()}`)
}

// PowerPoint出力
function handleExportPPT() {
  if (!chartConfig.value.xAxis || !chartConfig.value.yAxis) {
    alert('チャート設定を完了してください')
    return
  }
  exportChartToPowerPoint(chartInstance, chartConfig.value, filteredData.value, `chart_${Date.now()}`)
}

// リサイズ対応
function handleResize() {
  chartInstance?.resize()
}

// ウォッチ
watch([chartConfig, chartData], () => {
  nextTick(updateChart)
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (activeDataset.value && columns.value.length > 0) {
    // デフォルト設定
    chartConfig.value.xAxis = columns.value[0]
    if (columns.value.length > 1) {
      chartConfig.value.yAxis = columns.value[1]
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>
