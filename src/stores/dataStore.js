import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDataStore = defineStore('data', () => {
  // 状態
  const datasets = ref([])
  const activeDatasetId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // ゲッター
  const activeDataset = computed(() => {
    if (!activeDatasetId.value) return null
    return datasets.value.find(d => d.id === activeDatasetId.value)
  })

  const columns = computed(() => {
    if (!activeDataset.value) return []
    return activeDataset.value.columns
  })

  const data = computed(() => {
    if (!activeDataset.value) return []
    return activeDataset.value.data
  })

  // フィルター適用後のデータ
  const filteredData = computed(() => {
    if (!activeDataset.value) return []
    // フィルターストアと連携予定
    return activeDataset.value.data
  })

  // アクション
  function addDataset(dataset) {
    const id = `dataset_${Date.now()}`
    datasets.value.push({
      id,
      ...dataset,
      createdAt: new Date().toISOString()
    })
    activeDatasetId.value = id
    return id
  }

  function setActiveDataset(id) {
    if (datasets.value.find(d => d.id === id)) {
      activeDatasetId.value = id
    }
  }

  function removeDataset(id) {
    const index = datasets.value.findIndex(d => d.id === id)
    if (index !== -1) {
      datasets.value.splice(index, 1)
      if (activeDatasetId.value === id) {
        activeDatasetId.value = datasets.value[0]?.id || null
      }
    }
  }

  function clearAll() {
    datasets.value = []
    activeDatasetId.value = null
    error.value = null
  }

  function setLoading(loading) {
    isLoading.value = loading
  }

  function setError(err) {
    error.value = err
  }

  return {
    // 状態
    datasets,
    activeDatasetId,
    isLoading,
    error,
    // ゲッター
    activeDataset,
    columns,
    data,
    filteredData,
    // アクション
    addDataset,
    setActiveDataset,
    removeDataset,
    clearAll,
    setLoading,
    setError
  }
})
