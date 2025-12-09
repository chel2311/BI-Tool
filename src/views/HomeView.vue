<template>
  <div class="max-w-4xl mx-auto">
    <!-- ヒーローセクション -->
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-gray-800 mb-4">
        データを可視化しよう
      </h2>
      <p class="text-gray-600">
        CSV/Excelファイルをアップロードして、豊富なチャートでデータを分析できます
      </p>
    </div>

    <!-- ファイルアップロードエリア -->
    <div
      class="drop-zone cursor-pointer mb-8"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="handleDrop"
      @click="$refs.fileInput.click()"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="!isLoading" class="space-y-4">
        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div>
          <p class="text-lg font-medium text-gray-700">
            ファイルをドラッグ&ドロップ
          </p>
          <p class="text-sm text-gray-500 mt-1">
            または クリックしてファイルを選択
          </p>
        </div>
        <p class="text-xs text-gray-400">
          対応形式: CSV, Excel (.xlsx, .xls), JSON
        </p>
      </div>

      <div v-else class="flex flex-col items-center space-y-4">
        <div class="spinner"></div>
        <p class="text-gray-600">ファイルを読み込み中...</p>
      </div>
    </div>

    <!-- Excel設定モーダル -->
    <div v-if="showExcelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b">
          <h3 class="text-xl font-semibold text-gray-800">Excelファイル設定</h3>
          <p class="text-sm text-gray-500 mt-1">{{ excelInfo?.fileName }}</p>
        </div>

        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <!-- シート選択 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">シートを選択</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                v-for="sheet in excelInfo?.sheets"
                :key="sheet.name"
                @click="selectedSheet = sheet"
                class="p-3 border rounded-lg text-left transition-all"
                :class="selectedSheet?.name === sheet.name
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <p class="font-medium truncate">{{ sheet.name }}</p>
                <p class="text-xs text-gray-500">
                  {{ sheet.rowCount }}行 × {{ sheet.colCount }}列
                </p>
              </button>
            </div>
          </div>

          <!-- ヘッダー行選択 -->
          <div v-if="selectedSheet" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ヘッダー行を選択
              <span class="text-xs text-gray-500 ml-2">
                (自動検出: {{ selectedSheet.headerRow + 1 }}行目)
              </span>
            </label>
            <select v-model="selectedHeaderRow" class="select-box">
              <option v-for="i in Math.min(selectedSheet.rowCount, 20)" :key="i" :value="i - 1">
                {{ i }}行目
              </option>
            </select>
          </div>

          <!-- プレビュー -->
          <div v-if="selectedSheet" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">プレビュー</label>
            <div class="overflow-x-auto border rounded-lg">
              <table class="min-w-full text-xs">
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in selectedSheet.preview"
                    :key="rowIndex"
                    class="border-b"
                    :class="{
                      'bg-primary-100 font-semibold': rowIndex === selectedHeaderRow,
                      'bg-gray-50': rowIndex < selectedHeaderRow
                    }"
                  >
                    <td class="px-2 py-1 text-gray-400 border-r bg-gray-100">{{ rowIndex + 1 }}</td>
                    <td
                      v-for="(cell, colIndex) in row"
                      :key="colIndex"
                      class="px-2 py-1 border-r truncate max-w-[150px]"
                      :class="{
                        'text-gray-400': rowIndex < selectedHeaderRow
                      }"
                    >
                      {{ cell !== null && cell !== undefined ? cell : '' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              <span class="inline-block w-3 h-3 bg-primary-100 mr-1"></span>ヘッダー行
              <span class="inline-block w-3 h-3 bg-gray-50 ml-3 mr-1"></span>スキップされる行
            </p>
          </div>
        </div>

        <div class="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            @click="cancelExcelModal"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            @click="confirmExcelImport"
            :disabled="!selectedSheet"
            class="btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !selectedSheet }"
          >
            インポート
          </button>
        </div>
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="text-red-700">{{ error }}</span>
      </div>
    </div>

    <!-- 読み込み済みデータセット一覧 -->
    <div v-if="datasets.length > 0" class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">読み込み済みデータ</h3>
      <div class="space-y-3">
        <div
          v-for="dataset in datasets"
          :key="dataset.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          :class="{ 'border-primary-500 bg-primary-50': dataset.id === activeDatasetId }"
        >
          <div class="flex items-center space-x-3">
            <svg class="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p class="font-medium text-gray-800">{{ dataset.name }}</p>
              <p class="text-sm text-gray-500">
                {{ dataset.rowCount }}行 × {{ dataset.columns.length }}列
                <span v-if="dataset.currentSheet" class="ml-2 text-xs bg-gray-100 px-1 rounded">
                  {{ dataset.currentSheet }}
                </span>
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="selectDataset(dataset.id)"
              class="btn-primary text-sm"
            >
              分析開始
            </button>
            <button
              @click="removeDataset(dataset.id)"
              class="text-red-500 hover:text-red-700 p-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 機能紹介 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <div class="bg-white rounded-lg shadow-md p-6 text-center">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 class="font-semibold text-gray-800 mb-2">豊富なチャート</h4>
        <p class="text-sm text-gray-600">棒グラフ、折れ線、円グラフなど多彩な可視化</p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 text-center">
        <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 class="font-semibold text-gray-800 mb-2">フィルター機能</h4>
        <p class="text-sm text-gray-600">インタラクティブなデータ絞り込み</p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 text-center">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <h4 class="font-semibold text-gray-800 mb-2">エクスポート</h4>
        <p class="text-sm text-gray-600">PNG、Excel、PowerPointへ出力</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { parseFile, getExcelSheetInfo, isExcelFile } from '@/services/dataProcessor'

const router = useRouter()
const dataStore = useDataStore()

const isDragOver = ref(false)
const isLoading = computed(() => dataStore.isLoading)
const error = computed(() => dataStore.error)
const datasets = computed(() => dataStore.datasets)
const activeDatasetId = computed(() => dataStore.activeDatasetId)

// Excel設定用の状態
const showExcelModal = ref(false)
const excelInfo = ref(null)
const selectedSheet = ref(null)
const selectedHeaderRow = ref(0)
const pendingFile = ref(null)

// シート選択時にヘッダー行を自動設定
watch(selectedSheet, (sheet) => {
  if (sheet) {
    selectedHeaderRow.value = sheet.headerRow
  }
})

async function processFile(file) {
  // Excelファイルの場合は設定モーダルを表示
  if (isExcelFile(file)) {
    dataStore.setLoading(true)
    dataStore.setError(null)

    try {
      const info = await getExcelSheetInfo(file)
      excelInfo.value = info
      pendingFile.value = file

      // 最初のシートを選択
      if (info.sheets.length > 0) {
        selectedSheet.value = info.sheets[0]
        selectedHeaderRow.value = info.sheets[0].headerRow
      }

      showExcelModal.value = true
    } catch (err) {
      dataStore.setError(err.message)
    } finally {
      dataStore.setLoading(false)
    }
    return
  }

  // CSV/JSONの場合は直接処理
  dataStore.setLoading(true)
  dataStore.setError(null)

  try {
    const result = await parseFile(file)
    dataStore.addDataset(result)
  } catch (err) {
    dataStore.setError(err.message)
  } finally {
    dataStore.setLoading(false)
  }
}

async function confirmExcelImport() {
  if (!pendingFile.value || !selectedSheet.value) return

  dataStore.setLoading(true)
  dataStore.setError(null)
  showExcelModal.value = false

  try {
    const result = await parseFile(pendingFile.value, {
      sheetName: selectedSheet.value.name,
      headerRow: selectedHeaderRow.value
    })
    dataStore.addDataset(result)
  } catch (err) {
    dataStore.setError(err.message)
  } finally {
    dataStore.setLoading(false)
    resetExcelModal()
  }
}

function cancelExcelModal() {
  showExcelModal.value = false
  resetExcelModal()
}

function resetExcelModal() {
  excelInfo.value = null
  selectedSheet.value = null
  selectedHeaderRow.value = 0
  pendingFile.value = null
}

function handleDrop(event) {
  isDragOver.value = false
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

function handleFileSelect(event) {
  const files = event.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
  event.target.value = ''
}

function selectDataset(id) {
  dataStore.setActiveDataset(id)
  router.push('/analysis')
}

function removeDataset(id) {
  dataStore.removeDataset(id)
}
</script>
