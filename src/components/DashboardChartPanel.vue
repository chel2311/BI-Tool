<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <!-- パネルヘッダー -->
    <div class="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
      <input
        v-model="localPanel.title"
        type="text"
        class="bg-transparent border-none font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1"
        @blur="emitUpdate"
      />
      <div class="flex items-center space-x-2">
        <button
          @click="toggleSettings"
          class="p-1 text-gray-500 hover:text-primary-600 transition-colors"
          :title="localPanel.showSettings ? '設定を閉じる' : '設定を開く'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          @click="exportPNG"
          class="p-1 text-gray-500 hover:text-green-600 transition-colors"
          title="PNG出力"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          @click="$emit('remove', panel.id)"
          class="p-1 text-gray-500 hover:text-red-600 transition-colors"
          title="削除"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 設定パネル -->
    <div v-show="localPanel.showSettings" class="border-b bg-gray-50 p-3">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- チャート種別 -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">種別</label>
          <select v-model="localPanel.type" @change="emitUpdate" class="select-box text-sm">
            <option value="bar">棒グラフ</option>
            <option value="line">折れ線</option>
            <option value="pie">円グラフ</option>
            <option value="scatter">散布図</option>
            <option value="area">面グラフ</option>
          </select>
        </div>

        <!-- X軸 -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">
            {{ localPanel.type === 'pie' ? 'カテゴリ' : 'X軸' }}
          </label>
          <select v-model="localPanel.xAxis" @change="emitUpdate" class="select-box text-sm">
            <option value="">選択</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- Y軸 -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">
            {{ localPanel.type === 'pie' ? '値' : 'Y軸' }}
          </label>
          <select v-model="localPanel.yAxis" @change="emitUpdate" class="select-box text-sm">
            <option value="">選択</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- 集計方法 -->
        <div v-if="localPanel.type !== 'scatter'">
          <label class="block text-xs font-medium text-gray-600 mb-1">集計</label>
          <select v-model="localPanel.aggregation" @change="emitUpdate" class="select-box text-sm">
            <option value="sum">合計</option>
            <option value="count">カウント</option>
            <option value="avg">平均</option>
            <option value="max">最大</option>
            <option value="min">最小</option>
          </select>
        </div>

        <!-- グループ化（棒グラフ・折れ線・面グラフ用） -->
        <div v-if="['bar', 'line', 'area'].includes(localPanel.type)">
          <label class="block text-xs font-medium text-gray-600 mb-1">グループ化</label>
          <select v-model="localPanel.groupBy" @change="emitUpdate" class="select-box text-sm">
            <option value="">なし</option>
            <option v-for="col in filteredGroupByColumns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- 積み上げモード（棒グラフ + グループ化時） -->
        <div v-if="localPanel.type === 'bar' && localPanel.groupBy">
          <label class="block text-xs font-medium text-gray-600 mb-1">表示モード</label>
          <select v-model="localPanel.stackMode" @change="emitUpdate" class="select-box text-sm">
            <option value="none">並列</option>
            <option value="stacked">積み上げ</option>
            <option value="percent">100%積上</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ユニーク数警告 -->
    <div v-if="groupByWarning" class="bg-yellow-50 border-b border-yellow-200 px-3 py-2 text-sm text-yellow-700">
      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {{ groupByWarning }}
    </div>

    <!-- チャート表示エリア -->
    <div class="p-2 relative">
      <!-- 未設定状態 -->
      <div
        v-if="!localPanel.xAxis || !localPanel.yAxis"
        class="h-64 flex items-center justify-center text-gray-400"
      >
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="text-sm">X軸とY軸を選択してください</p>
        </div>
      </div>
      <!-- チャート描画エリア -->
      <div v-else class="relative">
        <!-- ローディングオーバーレイ -->
        <div
          v-if="isLoading"
          class="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10"
        >
          <div class="text-center">
            <svg class="animate-spin w-8 h-8 mx-auto mb-2 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm text-gray-600">チャート作成中...</p>
          </div>
        </div>
        <div
          ref="chartContainer"
          class="h-64 w-full"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { generateChartOptions } from '@/services/chartGenerator'

const props = defineProps({
  panel: {
    type: Object,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update', 'remove', 'chart-ready'])

// ローカル状態（props.panelのコピー）
const localPanel = ref({ ...props.panel })

// チャートコンテナ参照
const chartContainer = ref(null)

// チャートインスタンス
let chartInstance = null

// デバウンスタイマー
let updateTimer = null

// ローディング状態
const isLoading = ref(false)

// グループ化で選択可能なカラム（X軸と同じものは除外）
const filteredGroupByColumns = computed(() => {
  return props.columns.filter(c => c !== localPanel.value.xAxis)
})

// ユニーク数警告（20以上で警告）
const groupByWarning = computed(() => {
  if (!localPanel.value.groupBy || !props.data.length) return ''
  const uniqueValues = new Set(props.data.map(row => row[localPanel.value.groupBy]))
  const count = uniqueValues.size
  if (count > 50) {
    return `グループ数が ${count} 件と非常に多いです。処理に時間がかかる場合があります。`
  } else if (count > 20) {
    return `グループ数が ${count} 件あります。表示が複雑になる可能性があります。`
  }
  return ''
})

// パネルプロパティが変更されたら同期
watch(() => props.panel, (newPanel) => {
  localPanel.value = { ...newPanel }
}, { deep: true })

// 設定切り替え
function toggleSettings() {
  localPanel.value.showSettings = !localPanel.value.showSettings
  emitUpdate()
}

// 親コンポーネントに更新を通知
function emitUpdate() {
  emit('update', { ...localPanel.value })
}

// チャート更新
function updateChart() {
  if (!chartContainer.value) return
  if (!localPanel.value.xAxis || !localPanel.value.yAxis) {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    return
  }
  if (!props.data || props.data.length === 0) return

  // インスタンスがなければ作成
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
    // 親に通知
    emit('chart-ready', { panelId: props.panel.id, instance: chartInstance })
  }

  // オプション生成
  const config = {
    xAxis: localPanel.value.xAxis,
    yAxis: localPanel.value.yAxis,
    category: localPanel.value.xAxis,
    value: localPanel.value.yAxis,
    title: localPanel.value.title,
    aggregation: localPanel.value.aggregation || 'sum',
    groupBy: localPanel.value.groupBy || '',
    stackMode: localPanel.value.stackMode || 'none',
    sortBy: 'none',
    enableZoom: false
  }

  try {
    const options = generateChartOptions(localPanel.value.type, config, props.data)
    chartInstance.setOption(options, true)
  } catch (e) {
    console.error('Chart generation error:', e)
  }
}

// デバウンス付きチャート更新
function scheduleChartUpdate() {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  isLoading.value = true
  updateTimer = setTimeout(() => {
    nextTick(() => {
      updateChart()
      isLoading.value = false
    })
    updateTimer = null
  }, 150)
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
  link.download = `${localPanel.value.title || 'chart'}_${Date.now()}.png`
  link.click()
}

// リサイズハンドラ
function handleResize() {
  chartInstance?.resize()
}

// 設定変更を監視
watch(
  () => [
    localPanel.value.type,
    localPanel.value.xAxis,
    localPanel.value.yAxis,
    localPanel.value.aggregation,
    localPanel.value.groupBy,
    localPanel.value.stackMode
  ],
  () => {
    scheduleChartUpdate()
  }
)

// データ変更を監視
watch(
  () => props.data,
  () => {
    scheduleChartUpdate()
  },
  { deep: true }
)

// マウント時
onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    if (localPanel.value.xAxis && localPanel.value.yAxis) {
      updateChart()
    }
  })
})

// アンマウント時
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>
