import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChartStore = defineStore('chart', () => {
  // 状態
  const charts = ref([])
  const activeChartId = ref(null)

  // チャート種別定義
  const chartTypes = [
    { value: 'bar', label: '棒グラフ', icon: 'bar-chart' },
    { value: 'line', label: '折れ線グラフ', icon: 'line-chart' },
    { value: 'pie', label: '円グラフ', icon: 'pie-chart' },
    { value: 'scatter', label: '散布図', icon: 'scatter-chart' },
    { value: 'area', label: '面グラフ', icon: 'area-chart' },
    { value: 'combo', label: '組合せチャート', icon: 'combo-chart' }
  ]

  // ゲッター
  const activeChart = computed(() => {
    if (!activeChartId.value) return null
    return charts.value.find(c => c.id === activeChartId.value)
  })

  const chartById = computed(() => {
    return (id) => charts.value.find(c => c.id === id)
  })

  // アクション
  function addChart(config) {
    const id = `chart_${Date.now()}`
    const newChart = {
      id,
      type: config.type || 'bar',
      title: config.title || '新規チャート',
      xAxis: config.xAxis || null,
      yAxis: config.yAxis || null,
      series: config.series || [],
      options: config.options || {},
      createdAt: new Date().toISOString()
    }
    charts.value.push(newChart)
    activeChartId.value = id
    return id
  }

  function updateChart(id, updates) {
    const chart = charts.value.find(c => c.id === id)
    if (chart) {
      Object.assign(chart, updates)
    }
  }

  function removeChart(id) {
    const index = charts.value.findIndex(c => c.id === id)
    if (index !== -1) {
      charts.value.splice(index, 1)
      if (activeChartId.value === id) {
        activeChartId.value = charts.value[0]?.id || null
      }
    }
  }

  function duplicateChart(id) {
    const chart = charts.value.find(c => c.id === id)
    if (chart) {
      const newChart = {
        ...JSON.parse(JSON.stringify(chart)),
        id: `chart_${Date.now()}`,
        title: `${chart.title} (コピー)`,
        createdAt: new Date().toISOString()
      }
      charts.value.push(newChart)
      return newChart.id
    }
    return null
  }

  function setActiveChart(id) {
    activeChartId.value = id
  }

  function clearAll() {
    charts.value = []
    activeChartId.value = null
  }

  return {
    // 状態
    charts,
    activeChartId,
    chartTypes,
    // ゲッター
    activeChart,
    chartById,
    // アクション
    addChart,
    updateChart,
    removeChart,
    duplicateChart,
    setActiveChart,
    clearAll
  }
})
