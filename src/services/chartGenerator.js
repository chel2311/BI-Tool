/**
 * EChartsチャート生成サービス
 */

// 基本カラーパレット
const colorPalette = [
  '#005BAB', '#FF961C', '#00A86B', '#E63946', '#457B9D',
  '#2A9D8F', '#E9C46A', '#F4A261', '#264653', '#A8DADC'
]

/**
 * 集計関数
 * @param {Array} rows - 集計対象の行
 * @param {string} column - 集計対象のカラム
 * @param {string} aggregation - 集計方法 ('sum', 'count', 'avg', 'max', 'min')
 * @returns {number} - 集計結果
 */
export function aggregate(rows, column, aggregation = 'sum') {
  if (rows.length === 0) return 0

  switch (aggregation) {
    case 'count':
      return rows.length

    case 'sum':
      return rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0)

    case 'avg':
      const sum = rows.reduce((s, row) => s + (Number(row[column]) || 0), 0)
      return rows.length > 0 ? sum / rows.length : 0

    case 'max':
      const maxValues = rows.map(row => Number(row[column]) || 0)
      return Math.max(...maxValues)

    case 'min':
      const minValues = rows.map(row => Number(row[column]) || 0)
      return Math.min(...minValues)

    case 'distinct':
      return new Set(rows.map(row => row[column])).size

    default:
      return rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0)
  }
}

/**
 * 集計方法の日本語ラベル
 */
export const aggregationLabels = {
  sum: '合計',
  count: 'カウント',
  avg: '平均',
  max: '最大',
  min: '最小',
  distinct: 'ユニーク数'
}

/**
 * ソート関数
 * @param {Array} categories - カテゴリ配列
 * @param {Array} values - 値配列（categoriesと同じ順序）
 * @param {string} sortBy - ソート方法 ('none', 'value_asc', 'value_desc', 'label_asc', 'label_desc')
 * @returns {Object} - { sortedCategories, sortedValues }
 */
function sortData(categories, values, sortBy = 'none') {
  if (sortBy === 'none' || !sortBy) {
    return { sortedCategories: categories, sortedValues: values }
  }

  const pairs = categories.map((cat, i) => ({ cat, val: values[i] }))

  switch (sortBy) {
    case 'value_asc':
      pairs.sort((a, b) => a.val - b.val)
      break
    case 'value_desc':
      pairs.sort((a, b) => b.val - a.val)
      break
    case 'label_asc':
      pairs.sort((a, b) => String(a.cat).localeCompare(String(b.cat), 'ja'))
      break
    case 'label_desc':
      pairs.sort((a, b) => String(b.cat).localeCompare(String(a.cat), 'ja'))
      break
  }

  return {
    sortedCategories: pairs.map(p => p.cat),
    sortedValues: pairs.map(p => p.val)
  }
}

/**
 * 棒グラフオプション生成
 * @param {Object} config - 設定
 * @param {string} config.xAxis - X軸カラム
 * @param {string} config.yAxis - Y軸カラム（集計対象）
 * @param {string} config.groupBy - グループ化カラム（系列分割）
 * @param {string} config.stackMode - 積み上げモード ('none', 'stacked', 'percent')
 * @param {string} config.sortBy - ソート方法
 * @param {boolean} config.enableZoom - ズーム有効化
 * @param {Array} data - データ
 */
export function generateBarOptions(config, data) {
  const { xAxis, yAxis, title, horizontal = false, aggregation = 'sum', groupBy = '', stackMode = 'none', sortBy = 'none', enableZoom = false } = config

  // X軸のユニーク値を取得
  let categories = [...new Set(data.map(row => row[xAxis]))]

  // タイトル生成
  const aggLabel = aggregationLabels[aggregation] || aggregation

  // グループ化がある場合
  if (groupBy && groupBy !== '') {
    const groups = [...new Set(data.map(row => row[groupBy]))]
    const chartTitle = title || `${yAxis}の${aggLabel} (${xAxis}別・${groupBy}分類)`

    // 各グループごとにシリーズを作成
    const series = groups.map(group => {
      const values = categories.map(cat => {
        const rows = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        return aggregate(rows, yAxis, aggregation)
      })
      return {
        name: String(group),
        type: 'bar',
        data: values,
        stack: stackMode !== 'none' ? 'total' : undefined
      }
    })

    // 100%積み上げの場合、値を割合に変換
    if (stackMode === 'percent') {
      categories.forEach((_, catIndex) => {
        const total = series.reduce((sum, s) => sum + (s.data[catIndex] || 0), 0)
        if (total > 0) {
          series.forEach(s => {
            s.data[catIndex] = (s.data[catIndex] / total) * 100
          })
        }
      })
    }

    const option = {
      title: {
        text: chartTitle,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          let result = params[0].name + '<br/>'
          params.forEach(p => {
            const formattedValue = typeof p.value === 'number'
              ? p.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
              : p.value
            const suffix = stackMode === 'percent' ? '%' : ''
            result += `${p.marker}${p.seriesName}: ${formattedValue}${suffix}<br/>`
          })
          return result
        }
      },
      legend: {
        data: groups.map(String),
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      color: colorPalette,
      toolbox: {
        feature: {
          saveAsImage: { title: '画像保存' }
        }
      },
      xAxis: horizontal ? { type: 'value' } : { type: 'category', data: categories },
      yAxis: horizontal
        ? { type: 'category', data: categories }
        : { type: 'value', axisLabel: stackMode === 'percent' ? { formatter: '{value}%' } : undefined },
      series
    }

    return option
  }

  // グループ化なしの場合（従来の処理）
  let values = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return aggregate(rows, yAxis, aggregation)
  })

  // ソート適用
  const sorted = sortData(categories, values, sortBy)
  categories = sorted.sortedCategories
  values = sorted.sortedValues

  const chartTitle = title || `${yAxis}の${aggLabel} (${xAxis}別)`

  const option = {
    title: {
      text: chartTitle,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        const formattedValue = typeof p.value === 'number'
          ? p.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
          : p.value
        return `${p.name}<br/>${aggLabel}: ${formattedValue}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: enableZoom ? '15%' : '3%',
      containLabel: true
    },
    color: colorPalette,
    toolbox: {
      feature: {
        saveAsImage: { title: '画像保存' },
        dataZoom: enableZoom ? { title: { zoom: 'ズーム', back: 'リセット' } } : undefined,
        restore: { title: 'リセット' }
      }
    }
  }

  // ズーム機能
  if (enableZoom) {
    option.dataZoom = [
      { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100 },
      { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
    ]
  }

  if (horizontal) {
    option.xAxis = { type: 'value' }
    option.yAxis = { type: 'category', data: categories }
    option.series = [{ type: 'bar', data: values }]
  } else {
    option.xAxis = { type: 'category', data: categories }
    option.yAxis = { type: 'value' }
    option.series = [{ type: 'bar', data: values }]
  }

  return option
}

/**
 * 折れ線グラフオプション生成
 * @param {Object} config - 設定
 * @param {string} config.groupBy - グループ化カラム（系列分割）
 * @param {string} config.sortBy - ソート方法
 * @param {boolean} config.enableZoom - ズーム有効化
 */
export function generateLineOptions(config, data) {
  const { xAxis, yAxis, title, smooth = true, aggregation = 'sum', groupBy = '', sortBy = 'none', enableZoom = false } = config

  let categories = [...new Set(data.map(row => row[xAxis]))]
  const aggLabel = aggregationLabels[aggregation] || aggregation

  // グループ化がある場合
  if (groupBy && groupBy !== '') {
    const groups = [...new Set(data.map(row => row[groupBy]))]
    const chartTitle = title || `${yAxis}の${aggLabel} (${xAxis}別・${groupBy}分類)`

    const series = groups.map(group => {
      const values = categories.map(cat => {
        const rows = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        return aggregate(rows, yAxis, aggregation)
      })
      return {
        name: String(group),
        type: 'line',
        data: values,
        smooth,
        areaStyle: config.area ? {} : undefined
      }
    })

    return {
      title: {
        text: chartTitle,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let result = params[0].name + '<br/>'
          params.forEach(p => {
            const formattedValue = typeof p.value === 'number'
              ? p.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
              : p.value
            result += `${p.marker}${p.seriesName}: ${formattedValue}<br/>`
          })
          return result
        }
      },
      legend: {
        data: groups.map(String),
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      color: colorPalette,
      toolbox: {
        feature: {
          saveAsImage: { title: '画像保存' }
        }
      },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: false
      },
      yAxis: {
        type: 'value'
      },
      series
    }
  }

  // グループ化なしの場合（従来の処理）
  let values = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return aggregate(rows, yAxis, aggregation)
  })

  // ソート適用
  const sorted = sortData(categories, values, sortBy)
  categories = sorted.sortedCategories
  values = sorted.sortedValues

  const chartTitle = title || `${yAxis}の${aggLabel} (${xAxis}別)`

  const option = {
    title: {
      text: chartTitle,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        const formattedValue = typeof p.value === 'number'
          ? p.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
          : p.value
        return `${p.name}<br/>${aggLabel}: ${formattedValue}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: enableZoom ? '15%' : '3%',
      containLabel: true
    },
    color: colorPalette,
    toolbox: {
      feature: {
        saveAsImage: { title: '画像保存' },
        dataZoom: enableZoom ? { title: { zoom: 'ズーム', back: 'リセット' } } : undefined,
        restore: { title: 'リセット' }
      }
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      type: 'line',
      data: values,
      smooth,
      areaStyle: config.area ? {} : undefined
    }]
  }

  // ズーム機能
  if (enableZoom) {
    option.dataZoom = [
      { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100 },
      { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
    ]
  }

  return option
}

/**
 * 円グラフオプション生成
 */
export function generatePieOptions(config, data) {
  const { category, value, title, donut = false, aggregation = 'sum' } = config

  // カテゴリ別に集計
  const categories = [...new Set(data.map(row => row[category]))]
  const pieData = categories.map(cat => {
    const rows = data.filter(row => row[category] === cat)
    return {
      name: cat,
      value: aggregate(rows, value, aggregation)
    }
  })

  const aggLabel = aggregationLabels[aggregation] || aggregation
  const chartTitle = title || `${value}の${aggLabel} (${category}別)`

  return {
    title: {
      text: chartTitle,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const formattedValue = typeof params.value === 'number'
          ? params.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
          : params.value
        return `${params.name}<br/>${aggLabel}: ${formattedValue} (${params.percent}%)`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    color: colorPalette,
    toolbox: {
      feature: {
        saveAsImage: { title: '画像保存' }
      }
    },
    series: [{
      type: 'pie',
      radius: donut ? ['40%', '70%'] : '70%',
      data: pieData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        formatter: '{b}: {d}%'
      }
    }]
  }
}

/**
 * 散布図オプション生成
 */
export function generateScatterOptions(config, data) {
  const { xAxis, yAxis, title, category } = config

  let series = []

  if (category) {
    // カテゴリ別に分ける
    const categories = [...new Set(data.map(row => row[category]))]
    series = categories.map(cat => ({
      name: cat,
      type: 'scatter',
      data: data
        .filter(row => row[category] === cat)
        .map(row => [Number(row[xAxis]) || 0, Number(row[yAxis]) || 0])
    }))
  } else {
    series = [{
      type: 'scatter',
      data: data.map(row => [Number(row[xAxis]) || 0, Number(row[yAxis]) || 0])
    }]
  }

  return {
    title: {
      text: title || `${yAxis} vs ${xAxis}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => `${params.seriesName || ''}<br/>${xAxis}: ${params.data[0]}<br/>${yAxis}: ${params.data[1]}`
    },
    legend: category ? {
      data: [...new Set(data.map(row => row[category]))],
      top: 30
    } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    color: colorPalette,
    toolbox: {
      feature: {
        saveAsImage: { title: '画像保存' }
      }
    },
    xAxis: {
      type: 'value',
      name: xAxis
    },
    yAxis: {
      type: 'value',
      name: yAxis
    },
    series
  }
}

/**
 * 組合せチャートオプション生成
 */
export function generateComboOptions(config, data) {
  const { xAxis, barAxis, lineAxis, title, aggregation = 'sum' } = config

  const categories = [...new Set(data.map(row => row[xAxis]))]

  const barValues = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return aggregate(rows, barAxis, aggregation)
  })

  const lineValues = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return aggregate(rows, lineAxis, aggregation)
  })

  const aggLabel = aggregationLabels[aggregation] || aggregation

  return {
    title: {
      text: title || `${barAxis} & ${lineAxis}の${aggLabel} (${xAxis}別)`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        let result = params[0].name + '<br/>'
        params.forEach(p => {
          const formattedValue = typeof p.value === 'number'
            ? p.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
            : p.value
          result += `${p.seriesName}: ${formattedValue}<br/>`
        })
        return result
      }
    },
    legend: {
      data: [barAxis, lineAxis],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    color: colorPalette,
    toolbox: {
      feature: {
        saveAsImage: { title: '画像保存' }
      }
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: [
      {
        type: 'value',
        name: barAxis,
        position: 'left'
      },
      {
        type: 'value',
        name: lineAxis,
        position: 'right'
      }
    ],
    series: [
      {
        name: barAxis,
        type: 'bar',
        data: barValues
      },
      {
        name: lineAxis,
        type: 'line',
        yAxisIndex: 1,
        data: lineValues,
        smooth: true
      }
    ]
  }
}

/**
 * チャートタイプに応じたオプション生成
 */
export function generateChartOptions(chartType, config, data) {
  switch (chartType) {
    case 'bar':
      return generateBarOptions(config, data)
    case 'line':
      return generateLineOptions(config, data)
    case 'pie':
      return generatePieOptions(config, data)
    case 'scatter':
      return generateScatterOptions(config, data)
    case 'combo':
      return generateComboOptions(config, data)
    case 'area':
      return generateLineOptions({ ...config, area: true }, data)
    default:
      return generateBarOptions(config, data)
  }
}
