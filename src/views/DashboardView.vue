<template>
  <div class="space-y-4">
    <!-- ヘッダー -->
    <div class="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">ダッシュボード</h2>
        <p class="text-sm text-gray-500">複数のチャートを配置して分析</p>
      </div>
      <div class="flex space-x-2">
        <button @click="addChart" class="btn-primary text-sm" :disabled="!activeDataset">
          + チャート追加
        </button>
        <button @click="exportDashboardPNG" class="btn-secondary text-sm" :disabled="charts.length === 0">
          PNG一括出力
        </button>
        <button @click="saveDashboard" class="btn-accent text-sm" :disabled="charts.length === 0">
          保存
        </button>
      </div>
    </div>

    <!-- データソース表示 -->
    <div v-if="!activeDataset" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
      <p class="text-yellow-700">
        まずデータをアップロードしてください。
        <router-link to="/" class="text-primary-500 hover:underline">ホームに戻る</router-link>
      </p>
    </div>

    <!-- チャートグリッド -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="(chart, index) in charts"
        :key="chart.id"
        class="bg-white rounded-lg shadow-md p-4 relative"
      >
        <!-- チャートヘッダー -->
        <div class="flex items-center justify-between mb-3 border-b pb-2">
          <input
            v-model="chart.title"
            class="text-lg font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1"
            placeholder="チャートタイトル"
          />
          <div class="flex space-x-1">
            <button @click="toggleSettings(index)" class="text-gray-400 hover:text-gray-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button @click="removeChart(index)" class="text-red-400 hover:text-red-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 設定パネル -->
        <div v-if="chart.showSettings" class="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">チャート種別</label>
              <select v-model="chart.type" class="select-box text-sm">
                <option value="bar">棒グラフ</option>
                <option value="line">折れ線グラフ</option>
                <option value="pie">円グラフ</option>
                <option value="scatter">散布図</option>
                <option value="area">面グラフ</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">集計方法</label>
              <select v-model="chart.aggregation" class="select-box text-sm">
                <option value="sum">合計</option>
                <option value="count">カウント</option>
                <option value="avg">平均</option>
                <option value="max">最大</option>
                <option value="min">最小</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">X軸 / カテゴリ</label>
              <select v-model="chart.xAxis" class="select-box text-sm">
                <option value="">選択</option>
                <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Y軸 / 値</label>
              <select v-model="chart.yAxis" class="select-box text-sm">
                <option value="">選択</option>
                <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            <div v-if="chart.type === 'bar' || chart.type === 'line' || chart.type === 'area'">
              <label class="block text-xs font-medium text-gray-600 mb-1">グループ化</label>
              <select v-model="chart.groupBy" class="select-box text-sm">
                <option value="">なし</option>
                <option v-for="col in columns.filter(c => c !== chart.xAxis)" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            <div v-if="chart.type === 'bar' && chart.groupBy">
              <label class="block text-xs font-medium text-gray-600 mb-1">表示モード</label>
              <select v-model="chart.stackMode" class="select-box text-sm">
                <option value="none">並列</option>
                <option value="stacked">積み上げ</option>
                <option value="percent">100%積み上げ</option>
              </select>
            </div>
          </div>
        </div>

        <!-- チャートエリア -->
        <div
          v-if="chart.xAxis && chart.yAxis"
          :ref="el => setChartRef(el, index)"
          class="w-full"
          style="height: 280px;"
        ></div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400">
          設定アイコンをクリックして軸を選択
        </div>
      </div>

      <!-- 空のプレースホルダー -->
      <div
        v-if="charts.length === 0"
        class="lg:col-span-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
      >
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-500 mb-4">チャートがありません</p>
        <button @click="addChart" class="btn-primary">最初のチャートを追加</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { generateChartOptions } from '@/services/chartGenerator'
import * as echarts from 'echarts'

const dataStore = useDataStore()

// チャートインスタンス管理
const chartRefs = ref([])
const chartInstances = ref([])

// ダッシュボード内チャート
const charts = ref([])
let chartIdCounter = 0

// データ
const activeDataset = computed(() => dataStore.activeDataset)
const columns = computed(() => activeDataset.value?.columns || [])
const filteredData = computed(() => activeDataset.value?.data || [])

// チャートref設定
function setChartRef(el, index) {
  chartRefs.value[index] = el
}

// チャート追加
function addChart() {
  const newChart = {
    id: ++chartIdCounter,
    title: `チャート ${chartIdCounter}`,
    type: 'bar',
    xAxis: columns.value[0] || '',
    yAxis: columns.value[1] || '',
    aggregation: 'sum',
    groupBy: '',
    stackMode: 'none',
    showSettings: true
  }
  charts.value.push(newChart)
  nextTick(() => updateChart(charts.value.length - 1))
}

// チャート削除
function removeChart(index) {
  // インスタンス破棄
  if (chartInstances.value[index]) {
    chartInstances.value[index].dispose()
    chartInstances.value[index] = null
  }
  charts.value.splice(index, 1)
  chartInstances.value.splice(index, 1)
  chartRefs.value.splice(index, 1)
}

// 設定パネル切り替え
function toggleSettings(index) {
  charts.value[index].showSettings = !charts.value[index].showSettings
}

// チャート更新
function updateChart(index) {
  const chart = charts.value[index]
  const container = chartRefs.value[index]
  if (!container || !chart.xAxis || !chart.yAxis) return

  // インスタンス作成
  if (!chartInstances.value[index]) {
    chartInstances.value[index] = echarts.init(container)
  }

  const config = {
    xAxis: chart.xAxis,
    yAxis: chart.yAxis,
    category: chart.xAxis,
    value: chart.yAxis,
    title: chart.title,
    aggregation: chart.aggregation,
    groupBy: chart.groupBy,
    stackMode: chart.stackMode
  }

  const options = generateChartOptions(chart.type, config, filteredData.value)
  chartInstances.value[index].setOption(options, true)
}

// 全チャート更新
function updateAllCharts() {
  charts.value.forEach((_, index) => {
    nextTick(() => updateChart(index))
  })
}

// PNG一括出力
function exportDashboardPNG() {
  charts.value.forEach((chart, index) => {
    const instance = chartInstances.value[index]
    if (instance) {
      const url = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      const link = document.createElement('a')
      link.href = url
      link.download = `${chart.title || 'chart'}_${Date.now()}.png`
      link.click()
    }
  })
}

// ダッシュボード保存（LocalStorage）
function saveDashboard() {
  const dashboardData = charts.value.map(chart => ({
    id: chart.id,
    title: chart.title,
    type: chart.type,
    xAxis: chart.xAxis,
    yAxis: chart.yAxis,
    aggregation: chart.aggregation,
    groupBy: chart.groupBy,
    stackMode: chart.stackMode
  }))
  localStorage.setItem('bi-dashboard', JSON.stringify(dashboardData))
  alert('ダッシュボードを保存しました')
}

// ダッシュボード読み込み
function loadDashboard() {
  const saved = localStorage.getItem('bi-dashboard')
  if (saved) {
    const dashboardData = JSON.parse(saved)
    charts.value = dashboardData.map(data => ({
      ...data,
      showSettings: false
    }))
    chartIdCounter = Math.max(...dashboardData.map(d => d.id), 0)
    nextTick(updateAllCharts)
  }
}

// リサイズ対応
function handleResize() {
  chartInstances.value.forEach(instance => instance?.resize())
}

// ウォッチ
watch(charts, () => {
  nextTick(updateAllCharts)
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadDashboard()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.value.forEach(instance => instance?.dispose())
})
</script>
