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
          @click="exportCSV"
          class="p-1 text-gray-500 hover:text-green-600 transition-colors"
          title="CSV出力"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        <!-- グループ化カラム -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">グループ化</label>
          <select v-model="localPanel.groupBy" @change="emitUpdate" class="select-box text-sm">
            <option value="">選択</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- 集計対象カラム -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">集計対象</label>
          <select v-model="localPanel.valueColumn" @change="emitUpdate" class="select-box text-sm">
            <option value="">選択</option>
            <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- 並び順 -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">並び順</label>
          <select v-model="localPanel.sortBy" @change="emitUpdate" class="select-box text-sm">
            <option value="count_desc">カウント降順</option>
            <option value="count_asc">カウント昇順</option>
            <option value="sum_desc">合計降順</option>
            <option value="sum_asc">合計昇順</option>
            <option value="label_asc">ラベル昇順</option>
            <option value="label_desc">ラベル降順</option>
          </select>
        </div>

        <!-- 表示上限 -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">表示上限</label>
          <select v-model.number="localPanel.limit" @change="emitUpdate" class="select-box text-sm">
            <option :value="10">10件</option>
            <option :value="20">20件</option>
            <option :value="50">50件</option>
            <option :value="100">100件</option>
            <option :value="0">全件</option>
          </select>
        </div>
      </div>

      <!-- フィルター -->
      <div class="mt-3">
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-medium text-gray-600">フィルター</label>
          <button
            @click="addFilter"
            class="text-xs text-primary-600 hover:text-primary-800"
          >
            + 追加
          </button>
        </div>
        <div v-if="localPanel.filters.length === 0" class="text-xs text-gray-400 text-center py-1 border border-dashed rounded">
          フィルターなし
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="(filter, index) in localPanel.filters"
            :key="index"
            class="flex items-center gap-1 text-xs"
          >
            <select v-model="filter.column" @change="emitUpdate" class="select-box text-xs flex-1">
              <option value="">カラム</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
            <select v-model="filter.operator" @change="emitUpdate" class="select-box text-xs w-16">
              <option value="eq">=</option>
              <option value="ne">≠</option>
              <option value="contains">含</option>
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
            </select>
            <input
              v-model="filter.value"
              @change="emitUpdate"
              type="text"
              class="input-field text-xs flex-1"
              placeholder="値"
            />
            <button @click="removeFilter(index)" class="text-red-400 hover:text-red-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表示エリア -->
    <div class="p-2">
      <!-- 未設定状態 -->
      <div
        v-if="!localPanel.groupBy"
        class="h-64 flex items-center justify-center text-gray-400"
      >
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm">グループ化カラムを選択してください</p>
        </div>
      </div>

      <!-- テーブル表示 -->
      <div v-else class="overflow-x-auto max-h-72 overflow-y-auto">
        <table class="w-full text-xs">
          <thead class="sticky top-0 bg-gray-50">
            <tr class="border-b">
              <th class="px-2 py-1.5 text-left font-medium text-gray-700">{{ localPanel.groupBy }}</th>
              <th class="px-2 py-1.5 text-right font-medium text-gray-700">カウント</th>
              <th v-if="localPanel.valueColumn" class="px-2 py-1.5 text-right font-medium text-gray-700">合計</th>
              <th v-if="localPanel.valueColumn" class="px-2 py-1.5 text-right font-medium text-gray-700">平均</th>
              <th class="px-2 py-1.5 text-right font-medium text-gray-700">割合</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in analysisResult"
              :key="index"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="px-2 py-1.5 text-gray-800">{{ row.label }}</td>
              <td class="px-2 py-1.5 text-right text-gray-600">{{ formatNumber(row.count) }}</td>
              <td v-if="localPanel.valueColumn" class="px-2 py-1.5 text-right text-gray-600">{{ formatNumber(row.sum) }}</td>
              <td v-if="localPanel.valueColumn" class="px-2 py-1.5 text-right text-gray-600">{{ formatNumber(row.avg, 2) }}</td>
              <td class="px-2 py-1.5 text-right">
                <div class="flex items-center justify-end">
                  <div class="w-12 bg-gray-200 rounded-full h-1.5 mr-1">
                    <div
                      class="bg-primary-500 h-1.5 rounded-full"
                      :style="{ width: row.percent + '%' }"
                    ></div>
                  </div>
                  <span class="text-gray-600 w-10 text-right">{{ row.percent.toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="totalRow" class="bg-gray-100 font-medium sticky bottom-0">
            <tr>
              <td class="px-2 py-1.5 text-gray-800">合計</td>
              <td class="px-2 py-1.5 text-right text-gray-800">{{ formatNumber(totalRow.count) }}</td>
              <td v-if="localPanel.valueColumn" class="px-2 py-1.5 text-right text-gray-800">{{ formatNumber(totalRow.sum) }}</td>
              <td v-if="localPanel.valueColumn" class="px-2 py-1.5 text-right text-gray-800">{{ formatNumber(totalRow.avg, 2) }}</td>
              <td class="px-2 py-1.5 text-right text-gray-800">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const emit = defineEmits(['update', 'remove'])

// ローカル状態（props.panelのコピー）
const localPanel = ref({ ...props.panel })

// パネルプロパティが変更されたら同期
watch(() => props.panel, (newPanel) => {
  localPanel.value = { ...newPanel }
}, { deep: true })

// 数値カラムを検出
const numericColumns = computed(() => {
  if (!props.data?.length) return []
  const firstRow = props.data[0]
  return props.columns.filter(col => {
    const val = firstRow[col]
    return typeof val === 'number' || !isNaN(parseFloat(val))
  })
})

// フィルター適用後のデータ
const filteredData = computed(() => {
  if (!props.data.length) return []
  if (!localPanel.value.filters?.length) return props.data

  return props.data.filter(row => {
    return localPanel.value.filters.every(filter => {
      if (!filter.column) return true

      const cellValue = row[filter.column]
      const filterValue = filter.value

      switch (filter.operator) {
        case 'eq':
          return String(cellValue) === String(filterValue)
        case 'ne':
          return String(cellValue) !== String(filterValue)
        case 'contains':
          return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase())
        case 'gt':
          return Number(cellValue) > Number(filterValue)
        case 'lt':
          return Number(cellValue) < Number(filterValue)
        default:
          return true
      }
    })
  })
})

// 分析結果
const analysisResult = computed(() => {
  if (!localPanel.value.groupBy || !filteredData.value.length) return []

  const groups = new Map()

  // グループ化
  filteredData.value.forEach(row => {
    const key = String(row[localPanel.value.groupBy] ?? '(空白)')
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(row)
  })

  const totalCount = filteredData.value.length
  const valueCol = localPanel.value.valueColumn

  // 集計
  const result = Array.from(groups.entries()).map(([label, rows]) => {
    const count = rows.length
    let sum = 0

    if (valueCol) {
      rows.forEach(row => {
        const val = parseFloat(row[valueCol]) || 0
        sum += val
      })
    }

    return {
      label,
      count,
      sum: valueCol ? sum : 0,
      avg: valueCol && count > 0 ? sum / count : 0,
      percent: totalCount > 0 ? (count / totalCount) * 100 : 0
    }
  })

  // ソート
  const sortFn = {
    label_asc: (a, b) => a.label.localeCompare(b.label),
    label_desc: (a, b) => b.label.localeCompare(a.label),
    count_desc: (a, b) => b.count - a.count,
    count_asc: (a, b) => a.count - b.count,
    sum_desc: (a, b) => b.sum - a.sum,
    sum_asc: (a, b) => a.sum - b.sum
  }

  const sorted = result.sort(sortFn[localPanel.value.sortBy] || sortFn.count_desc)

  // 表示上限
  const limit = localPanel.value.limit || 0
  return limit > 0 ? sorted.slice(0, limit) : sorted
})

// 合計行
const totalRow = computed(() => {
  if (!analysisResult.value.length) return null

  const count = analysisResult.value.reduce((s, r) => s + r.count, 0)
  const sum = analysisResult.value.reduce((s, r) => s + r.sum, 0)

  return {
    count,
    sum,
    avg: count > 0 ? sum / count : 0
  }
})

// 設定切り替え
function toggleSettings() {
  localPanel.value.showSettings = !localPanel.value.showSettings
  emitUpdate()
}

// 親コンポーネントに更新を通知
function emitUpdate() {
  emit('update', { ...localPanel.value })
}

// フィルター追加
function addFilter() {
  if (!localPanel.value.filters) {
    localPanel.value.filters = []
  }
  localPanel.value.filters.push({
    column: '',
    operator: 'eq',
    value: ''
  })
  emitUpdate()
}

// フィルター削除
function removeFilter(index) {
  localPanel.value.filters.splice(index, 1)
  emitUpdate()
}

// 数値フォーマット
function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// CSV出力
function exportCSV() {
  if (!analysisResult.value.length) return

  const headers = [localPanel.value.groupBy, 'カウント']
  if (localPanel.value.valueColumn) {
    headers.push('合計', '平均')
  }
  headers.push('割合(%)')

  const rows = analysisResult.value.map(row => {
    const cells = [row.label, row.count]
    if (localPanel.value.valueColumn) {
      cells.push(row.sum, row.avg.toFixed(2))
    }
    cells.push(row.percent.toFixed(1))
    return cells.join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${localPanel.value.title || 'table'}_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>
