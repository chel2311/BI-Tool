<template>
  <div class="space-y-4">
    <!-- ヘッダー -->
    <div class="bg-white rounded-lg shadow-md p-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-800">表形式分析</h2>
          <p class="text-sm text-gray-500">
            データを集計・分析
            <span v-if="activeDataset" class="text-primary-600">
              （{{ activeDataset.name }} - {{ filteredRows.length }}/{{ dataRows.length }}行）
            </span>
          </p>
        </div>
        <button
          @click="exportTableCSV"
          class="btn-primary text-sm"
          :disabled="!analysisResult.length"
        >
          CSV出力
        </button>
      </div>
    </div>

    <!-- データソースなし -->
    <div v-if="!activeDataset" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
      <p class="text-yellow-700">
        まずデータをアップロードしてください。
        <router-link to="/" class="text-primary-500 hover:underline">ホームに戻る</router-link>
      </p>
    </div>

    <!-- 分析設定 -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 設定パネル -->
      <div class="bg-white rounded-lg shadow-md p-4 space-y-4">
        <!-- フィルター設定 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-gray-800">フィルター条件</h3>
            <button
              @click="addFilter"
              class="text-xs text-primary-600 hover:text-primary-800 flex items-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              追加
            </button>
          </div>

          <div v-if="filters.length === 0" class="text-sm text-gray-400 py-2 text-center border border-dashed rounded">
            フィルターなし（全データ対象）
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(filter, index) in filters"
              :key="index"
              class="bg-gray-50 rounded p-2 text-sm"
            >
              <div class="flex items-center gap-2 mb-1">
                <select v-model="filter.column" class="select-box text-xs flex-1">
                  <option value="">カラム選択</option>
                  <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
                </select>
                <button
                  @click="removeFilter(index)"
                  class="text-red-400 hover:text-red-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="flex items-center gap-2">
                <select v-model="filter.operator" class="select-box text-xs w-24">
                  <option value="eq">=</option>
                  <option value="ne">≠</option>
                  <option value="contains">含む</option>
                  <option value="not_contains">含まない</option>
                  <option value="gt">&gt;</option>
                  <option value="gte">≥</option>
                  <option value="lt">&lt;</option>
                  <option value="lte">≤</option>
                  <option value="empty">空</option>
                  <option value="not_empty">空でない</option>
                </select>
                <input
                  v-if="!['empty', 'not_empty'].includes(filter.operator)"
                  v-model="filter.value"
                  type="text"
                  class="input-field text-xs flex-1"
                  placeholder="値"
                />
              </div>
            </div>
          </div>

          <!-- フィルター結果 -->
          <div v-if="filters.length > 0" class="mt-2 text-xs text-gray-500">
            {{ filteredRows.length }} / {{ dataRows.length }} 件がマッチ
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- 集計設定 -->
        <div>
          <h3 class="font-semibold text-gray-800 mb-3">集計設定</h3>

          <div class="space-y-3">
            <!-- グループ化カラム -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">グループ化</label>
              <select v-model="config.groupBy" class="select-box">
                <option value="">選択してください</option>
                <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>

            <!-- 集計対象カラム -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">集計対象カラム</label>
              <select v-model="config.valueColumn" class="select-box">
                <option value="">選択してください</option>
                <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>

            <!-- 表示する集計 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">表示する集計</label>
              <div class="space-y-1">
                <label class="flex items-center">
                  <input type="checkbox" v-model="config.showCount" class="rounded text-primary-600 mr-2" />
                  <span class="text-sm">カウント</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="config.showSum" class="rounded text-primary-600 mr-2" />
                  <span class="text-sm">合計</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="config.showAvg" class="rounded text-primary-600 mr-2" />
                  <span class="text-sm">平均</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="config.showMin" class="rounded text-primary-600 mr-2" />
                  <span class="text-sm">最小</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="config.showMax" class="rounded text-primary-600 mr-2" />
                  <span class="text-sm">最大</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="config.showPercent" class="rounded text-primary-600 mr-2" />
                  <span class="text-sm">割合（%）</span>
                </label>
              </div>
            </div>

            <!-- ソート -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">並び順</label>
              <select v-model="config.sortBy" class="select-box">
                <option value="label_asc">ラベル（昇順）</option>
                <option value="label_desc">ラベル（降順）</option>
                <option value="count_desc">カウント（多い順）</option>
                <option value="count_asc">カウント（少ない順）</option>
                <option value="sum_desc">合計（大きい順）</option>
                <option value="sum_asc">合計（小さい順）</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 結果テーブル -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
        <h3 class="font-semibold text-gray-800 mb-3">
          分析結果
          <span v-if="analysisResult.length" class="text-sm font-normal text-gray-500">
            （{{ analysisResult.length }} グループ）
          </span>
        </h3>

        <div v-if="!config.groupBy" class="text-center text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>グループ化するカラムを選択してください</p>
        </div>

        <div v-else-if="analysisResult.length === 0" class="text-center text-gray-400 py-8">
          データがありません
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="px-3 py-2 text-left font-medium text-gray-700">{{ config.groupBy }}</th>
                <th v-if="config.showCount" class="px-3 py-2 text-right font-medium text-gray-700">カウント</th>
                <th v-if="config.showSum && config.valueColumn" class="px-3 py-2 text-right font-medium text-gray-700">合計</th>
                <th v-if="config.showAvg && config.valueColumn" class="px-3 py-2 text-right font-medium text-gray-700">平均</th>
                <th v-if="config.showMin && config.valueColumn" class="px-3 py-2 text-right font-medium text-gray-700">最小</th>
                <th v-if="config.showMax && config.valueColumn" class="px-3 py-2 text-right font-medium text-gray-700">最大</th>
                <th v-if="config.showPercent" class="px-3 py-2 text-right font-medium text-gray-700">割合</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in analysisResult"
                :key="index"
                class="border-b hover:bg-gray-50 transition-colors"
              >
                <td class="px-3 py-2 text-gray-800">{{ row.label }}</td>
                <td v-if="config.showCount" class="px-3 py-2 text-right text-gray-600">
                  {{ formatNumber(row.count) }}
                </td>
                <td v-if="config.showSum && config.valueColumn" class="px-3 py-2 text-right text-gray-600">
                  {{ formatNumber(row.sum) }}
                </td>
                <td v-if="config.showAvg && config.valueColumn" class="px-3 py-2 text-right text-gray-600">
                  {{ formatNumber(row.avg, 2) }}
                </td>
                <td v-if="config.showMin && config.valueColumn" class="px-3 py-2 text-right text-gray-600">
                  {{ formatNumber(row.min) }}
                </td>
                <td v-if="config.showMax && config.valueColumn" class="px-3 py-2 text-right text-gray-600">
                  {{ formatNumber(row.max) }}
                </td>
                <td v-if="config.showPercent" class="px-3 py-2 text-right">
                  <div class="flex items-center justify-end">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="bg-primary-500 h-2 rounded-full"
                        :style="{ width: row.percent + '%' }"
                      ></div>
                    </div>
                    <span class="text-gray-600 w-12 text-right">{{ row.percent.toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="totalRow" class="bg-gray-100 font-medium">
              <tr>
                <td class="px-3 py-2 text-gray-800">合計</td>
                <td v-if="config.showCount" class="px-3 py-2 text-right text-gray-800">
                  {{ formatNumber(totalRow.count) }}
                </td>
                <td v-if="config.showSum && config.valueColumn" class="px-3 py-2 text-right text-gray-800">
                  {{ formatNumber(totalRow.sum) }}
                </td>
                <td v-if="config.showAvg && config.valueColumn" class="px-3 py-2 text-right text-gray-800">
                  {{ formatNumber(totalRow.avg, 2) }}
                </td>
                <td v-if="config.showMin && config.valueColumn" class="px-3 py-2 text-right text-gray-800">
                  {{ formatNumber(totalRow.min) }}
                </td>
                <td v-if="config.showMax && config.valueColumn" class="px-3 py-2 text-right text-gray-800">
                  {{ formatNumber(totalRow.max) }}
                </td>
                <td v-if="config.showPercent" class="px-3 py-2 text-right text-gray-800">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()

// フィルター設定
const filters = ref([])

// フィルター追加
function addFilter() {
  filters.value.push({
    column: '',
    operator: 'eq',
    value: ''
  })
}

// フィルター削除
function removeFilter(index) {
  filters.value.splice(index, 1)
}

// 集計設定
const config = ref({
  groupBy: '',
  valueColumn: '',
  showCount: true,
  showSum: true,
  showAvg: true,
  showMin: false,
  showMax: false,
  showPercent: true,
  sortBy: 'count_desc'
})

// データ取得
const activeDataset = computed(() => dataStore.activeDataset)
const columns = computed(() => activeDataset.value?.columns || [])
const dataRows = computed(() => activeDataset.value?.data || [])

// フィルター適用後のデータ
const filteredRows = computed(() => {
  if (!dataRows.value.length) return []
  if (!filters.value.length) return dataRows.value

  return dataRows.value.filter(row => {
    return filters.value.every(filter => {
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
        case 'not_contains':
          return !String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase())
        case 'gt':
          return Number(cellValue) > Number(filterValue)
        case 'gte':
          return Number(cellValue) >= Number(filterValue)
        case 'lt':
          return Number(cellValue) < Number(filterValue)
        case 'lte':
          return Number(cellValue) <= Number(filterValue)
        case 'empty':
          return cellValue === null || cellValue === undefined || cellValue === ''
        case 'not_empty':
          return cellValue !== null && cellValue !== undefined && cellValue !== ''
        default:
          return true
      }
    })
  })
})

// 数値カラムを検出
const numericColumns = computed(() => {
  if (!activeDataset.value?.data?.length) return []
  const firstRow = activeDataset.value.data[0]
  return columns.value.filter(col => {
    const val = firstRow[col]
    return typeof val === 'number' || !isNaN(parseFloat(val))
  })
})

// 分析結果
const analysisResult = computed(() => {
  if (!config.value.groupBy || !filteredRows.value.length) return []

  const groups = new Map()

  // グループ化
  filteredRows.value.forEach(row => {
    const key = String(row[config.value.groupBy] ?? '(空白)')
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(row)
  })

  const totalCount = filteredRows.value.length
  const valueCol = config.value.valueColumn

  // 集計
  const result = Array.from(groups.entries()).map(([label, rows]) => {
    const count = rows.length
    let sum = 0, min = Infinity, max = -Infinity

    if (valueCol) {
      rows.forEach(row => {
        const val = parseFloat(row[valueCol]) || 0
        sum += val
        if (val < min) min = val
        if (val > max) max = val
      })
    }

    return {
      label,
      count,
      sum: valueCol ? sum : 0,
      avg: valueCol && count > 0 ? sum / count : 0,
      min: valueCol && min !== Infinity ? min : 0,
      max: valueCol && max !== -Infinity ? max : 0,
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

  return result.sort(sortFn[config.value.sortBy] || sortFn.count_desc)
})

// 合計行
const totalRow = computed(() => {
  if (!analysisResult.value.length) return null

  const count = analysisResult.value.reduce((s, r) => s + r.count, 0)
  const sum = analysisResult.value.reduce((s, r) => s + r.sum, 0)
  const allValues = filteredRows.value.map(r => parseFloat(r[config.value.valueColumn]) || 0)

  return {
    count,
    sum,
    avg: count > 0 ? sum / count : 0,
    min: allValues.length ? Math.min(...allValues) : 0,
    max: allValues.length ? Math.max(...allValues) : 0
  }
})

// 数値フォーマット
function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// CSV出力
function exportTableCSV() {
  if (!analysisResult.value.length) return

  const headers = [config.value.groupBy]
  if (config.value.showCount) headers.push('カウント')
  if (config.value.showSum && config.value.valueColumn) headers.push('合計')
  if (config.value.showAvg && config.value.valueColumn) headers.push('平均')
  if (config.value.showMin && config.value.valueColumn) headers.push('最小')
  if (config.value.showMax && config.value.valueColumn) headers.push('最大')
  if (config.value.showPercent) headers.push('割合(%)')

  const rows = analysisResult.value.map(row => {
    const cells = [row.label]
    if (config.value.showCount) cells.push(row.count)
    if (config.value.showSum && config.value.valueColumn) cells.push(row.sum)
    if (config.value.showAvg && config.value.valueColumn) cells.push(row.avg.toFixed(2))
    if (config.value.showMin && config.value.valueColumn) cells.push(row.min)
    if (config.value.showMax && config.value.valueColumn) cells.push(row.max)
    if (config.value.showPercent) cells.push(row.percent.toFixed(1))
    return cells.join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `analysis_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>
