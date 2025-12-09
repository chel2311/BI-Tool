/**
 * EChartsチャート生成サービス
 */

// 基本カラーパレット
const colorPalette = [
  '#005BAB', '#FF961C', '#00A86B', '#E63946', '#457B9D',
  '#2A9D8F', '#E9C46A', '#F4A261', '#264653', '#A8DADC'
]

/**
 * 棒グラフオプション生成
 */
export function generateBarOptions(config, data) {
  const { xAxis, yAxis, title, horizontal = false } = config

  // X軸のユニーク値を取得
  const categories = [...new Set(data.map(row => row[xAxis]))]

  // Y軸の値を集計
  const values = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return rows.reduce((sum, row) => sum + (Number(row[yAxis]) || 0), 0)
  })

  const option = {
    title: {
      text: title || `${yAxis} by ${xAxis}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
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
    }
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
 */
export function generateLineOptions(config, data) {
  const { xAxis, yAxis, title, smooth = true } = config

  const categories = [...new Set(data.map(row => row[xAxis]))]
  const values = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return rows.reduce((sum, row) => sum + (Number(row[yAxis]) || 0), 0)
  })

  return {
    title: {
      text: title || `${yAxis} by ${xAxis}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
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
}

/**
 * 円グラフオプション生成
 */
export function generatePieOptions(config, data) {
  const { category, value, title, donut = false } = config

  // カテゴリ別に集計
  const aggregated = {}
  data.forEach(row => {
    const cat = row[category]
    const val = Number(row[value]) || 0
    aggregated[cat] = (aggregated[cat] || 0) + val
  })

  const pieData = Object.entries(aggregated).map(([name, value]) => ({
    name,
    value
  }))

  return {
    title: {
      text: title || `${value} by ${category}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
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
  const { xAxis, barAxis, lineAxis, title } = config

  const categories = [...new Set(data.map(row => row[xAxis]))]

  const barValues = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return rows.reduce((sum, row) => sum + (Number(row[barAxis]) || 0), 0)
  })

  const lineValues = categories.map(cat => {
    const rows = data.filter(row => row[xAxis] === cat)
    return rows.reduce((sum, row) => sum + (Number(row[lineAxis]) || 0), 0)
  })

  return {
    title: {
      text: title || `${barAxis} & ${lineAxis} by ${xAxis}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
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
