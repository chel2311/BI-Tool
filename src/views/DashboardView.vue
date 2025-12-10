<template>
  <div class="space-y-4">
    <!-- ヘッダー -->
    <div class="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">ダッシュボード</h2>
        <p class="text-sm text-gray-500">
          複数のチャートを配置して分析
          <span v-if="activeDataset" class="text-primary-600">
            （{{ activeDataset.name }} - {{ dataRows.length }}行）
          </span>
        </p>
      </div>
      <div class="flex space-x-2">
        <button @click="addChart" class="btn-primary text-sm" :disabled="!activeDataset">
          + チャート
        </button>
        <button @click="addTable" class="btn-secondary text-sm" :disabled="!activeDataset">
          + 表分析
        </button>
        <button @click="exportDashboardPNG" class="btn-secondary text-sm" :disabled="chartPanels.length === 0">
          PNG出力
        </button>
        <button @click="saveDashboard" class="btn-accent text-sm" :disabled="chartPanels.length === 0 && tablePanels.length === 0">
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
      <!-- 各チャートパネル -->
      <DashboardChartPanel
        v-for="panel in chartPanels"
        :key="'chart-' + panel.id"
        :panel="panel"
        :columns="columnList"
        :data="dataRows"
        @update="handleChartPanelUpdate"
        @remove="handleChartPanelRemove"
        @chart-ready="handleChartReady"
      />

      <!-- 各表分析パネル -->
      <DashboardTablePanel
        v-for="panel in tablePanels"
        :key="'table-' + panel.id"
        :panel="panel"
        :columns="columnList"
        :data="dataRows"
        @update="handleTablePanelUpdate"
        @remove="handleTablePanelRemove"
      />

      <!-- 空のプレースホルダー -->
      <div
        v-if="chartPanels.length === 0 && tablePanels.length === 0"
        class="lg:col-span-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
      >
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-500 mb-4">パネルがありません</p>
        <div class="space-x-2">
          <button @click="addChart" class="btn-primary">チャート追加</button>
          <button @click="addTable" class="btn-secondary">表分析追加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import DashboardChartPanel from '@/components/DashboardChartPanel.vue'
import DashboardTablePanel from '@/components/DashboardTablePanel.vue'

const dataStore = useDataStore()

// チャートパネル管理
const chartPanels = ref([])
// 表分析パネル管理
const tablePanels = ref([])
let panelIdCounter = 0

// チャートインスタンスのマップ（ID -> instance）
const chartInstanceMap = new Map()

// データ取得（computed）
const activeDataset = computed(() => dataStore.activeDataset)
const columnList = computed(() => activeDataset.value?.columns || [])
const dataRows = computed(() => activeDataset.value?.data || [])

// チャート追加
function addChart() {
  if (!activeDataset.value) return

  const cols = columnList.value
  const xAxis = cols[0] || ''
  const yAxis = cols.length > 1 ? cols[1] : cols[0] || ''
  const sheetName = activeDataset.value.name || 'データ'

  const newPanel = {
    id: ++panelIdCounter,
    title: `${sheetName}_${yAxis}×${xAxis}`,
    type: 'bar',
    xAxis,
    yAxis,
    aggregation: 'sum',
    groupBy: '',
    stackMode: 'none',
    showSettings: true
  }
  chartPanels.value.push(newPanel)
}

// 表分析追加
function addTable() {
  if (!activeDataset.value) return

  const cols = columnList.value
  const groupBy = cols[0] || ''
  const valueColumn = cols.length > 1 ? cols[1] : ''
  const sheetName = activeDataset.value.name || 'データ'

  const newPanel = {
    id: ++panelIdCounter,
    title: `${sheetName}_${groupBy}集計`,
    groupBy,
    valueColumn,
    sortBy: 'count_desc',
    limit: 20,
    filters: [],
    showSettings: true
  }
  tablePanels.value.push(newPanel)
}

// チャートパネル更新
function handleChartPanelUpdate(updatedPanel) {
  const index = chartPanels.value.findIndex(p => p.id === updatedPanel.id)
  if (index !== -1) {
    chartPanels.value[index] = { ...updatedPanel }
  }
}

// チャートパネル削除
function handleChartPanelRemove(panelId) {
  const index = chartPanels.value.findIndex(p => p.id === panelId)
  if (index !== -1) {
    // インスタンス破棄
    const instance = chartInstanceMap.get(panelId)
    if (instance) {
      instance.dispose()
      chartInstanceMap.delete(panelId)
    }
    chartPanels.value.splice(index, 1)
  }
}

// 表分析パネル更新
function handleTablePanelUpdate(updatedPanel) {
  const index = tablePanels.value.findIndex(p => p.id === updatedPanel.id)
  if (index !== -1) {
    tablePanels.value[index] = { ...updatedPanel }
  }
}

// 表分析パネル削除
function handleTablePanelRemove(panelId) {
  const index = tablePanels.value.findIndex(p => p.id === panelId)
  if (index !== -1) {
    tablePanels.value.splice(index, 1)
  }
}

// チャートインスタンス登録
function handleChartReady({ panelId, instance }) {
  chartInstanceMap.set(panelId, instance)
}

// PNG一括出力
function exportDashboardPNG() {
  chartPanels.value.forEach(panel => {
    const instance = chartInstanceMap.get(panel.id)
    if (instance) {
      const url = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      const link = document.createElement('a')
      link.href = url
      link.download = `${panel.title || 'chart'}_${Date.now()}.png`
      link.click()
    }
  })
}

// ダッシュボード保存
function saveDashboard() {
  const dashboardData = {
    charts: chartPanels.value.map(panel => ({
      id: panel.id,
      title: panel.title,
      type: panel.type,
      xAxis: panel.xAxis,
      yAxis: panel.yAxis,
      aggregation: panel.aggregation,
      groupBy: panel.groupBy,
      stackMode: panel.stackMode
    })),
    tables: tablePanels.value.map(panel => ({
      id: panel.id,
      title: panel.title,
      groupBy: panel.groupBy,
      valueColumn: panel.valueColumn,
      sortBy: panel.sortBy,
      limit: panel.limit,
      filters: panel.filters || []
    }))
  }
  localStorage.setItem('bi-dashboard', JSON.stringify(dashboardData))
  alert('ダッシュボードを保存しました')
}

// ダッシュボード読み込み
function loadDashboard() {
  const saved = localStorage.getItem('bi-dashboard')
  if (!saved || !activeDataset.value) return

  try {
    const dashboardData = JSON.parse(saved)
    const cols = columnList.value

    // 旧形式（配列のみ）の場合の互換性対応
    if (Array.isArray(dashboardData)) {
      const validatedPanels = dashboardData.map(data => {
        const validXAxis = cols.includes(data.xAxis) ? data.xAxis : ''
        const validYAxis = cols.includes(data.yAxis) ? data.yAxis : ''
        const validGroupBy = data.groupBy && cols.includes(data.groupBy) ? data.groupBy : ''

        return {
          ...data,
          xAxis: validXAxis,
          yAxis: validYAxis,
          groupBy: validGroupBy,
          showSettings: !validXAxis || !validYAxis
        }
      })

      chartPanels.value = validatedPanels
      tablePanels.value = []
      panelIdCounter = Math.max(...dashboardData.map(d => d.id), 0)
      return
    }

    // 新形式（オブジェクト）の場合
    // チャートパネル
    if (dashboardData.charts) {
      const validatedCharts = dashboardData.charts.map(data => {
        const validXAxis = cols.includes(data.xAxis) ? data.xAxis : ''
        const validYAxis = cols.includes(data.yAxis) ? data.yAxis : ''
        const validGroupBy = data.groupBy && cols.includes(data.groupBy) ? data.groupBy : ''

        return {
          ...data,
          xAxis: validXAxis,
          yAxis: validYAxis,
          groupBy: validGroupBy,
          showSettings: !validXAxis || !validYAxis
        }
      })
      chartPanels.value = validatedCharts
    }

    // 表分析パネル
    if (dashboardData.tables) {
      const validatedTables = dashboardData.tables.map(data => {
        const validGroupBy = cols.includes(data.groupBy) ? data.groupBy : ''
        const validValueColumn = data.valueColumn && cols.includes(data.valueColumn) ? data.valueColumn : ''

        return {
          ...data,
          groupBy: validGroupBy,
          valueColumn: validValueColumn,
          filters: data.filters || [],
          showSettings: !validGroupBy
        }
      })
      tablePanels.value = validatedTables
    }

    // IDカウンター更新
    const allIds = [
      ...(dashboardData.charts || []).map(d => d.id),
      ...(dashboardData.tables || []).map(d => d.id)
    ]
    panelIdCounter = Math.max(...allIds, 0)
  } catch (e) {
    console.error('Failed to load dashboard:', e)
  }
}

// データセット変更を監視
watch(
  () => dataStore.activeDatasetId,
  (newId) => {
    if (newId) {
      // 古いインスタンスを破棄
      chartInstanceMap.forEach(instance => instance?.dispose())
      chartInstanceMap.clear()
      chartPanels.value = []
      tablePanels.value = []

      // 少し待ってから読み込み
      setTimeout(() => loadDashboard(), 100)
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (activeDataset.value) {
    loadDashboard()
  }
})
</script>
