/**
 * エクスポートサービス
 * Excel/CSV/PowerPointエクスポート機能
 */

import * as XLSX from 'xlsx'
import pptxgen from 'pptxgenjs'
import ExcelJS from 'exceljs'

/**
 * データをExcelファイルとしてエクスポート
 * @param {Array} data - エクスポートするデータ
 * @param {Array} columns - カラム名配列
 * @param {string} filename - ファイル名（拡張子なし）
 * @param {Object} options - オプション
 */
export function exportToExcel(data, columns, filename = 'export', options = {}) {
  const { sheetName = 'データ', includeHeader = true } = options

  // ワークブック作成
  const workbook = XLSX.utils.book_new()

  // データ配列を作成
  const rows = []
  if (includeHeader) {
    rows.push(columns)
  }

  data.forEach(row => {
    const rowData = columns.map(col => {
      const value = row[col]
      // 日付の場合は文字列に変換
      if (value instanceof Date) {
        return value.toLocaleDateString('ja-JP')
      }
      return value
    })
    rows.push(rowData)
  })

  // ワークシート作成
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // 列幅を自動調整
  const colWidths = columns.map((col, i) => {
    let maxLen = col.length
    data.forEach(row => {
      const val = String(row[col] ?? '')
      if (val.length > maxLen) maxLen = val.length
    })
    return { wch: Math.min(maxLen + 2, 50) }
  })
  worksheet['!cols'] = colWidths

  // ワークブックに追加
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // ファイルダウンロード
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * データをCSVファイルとしてエクスポート
 * @param {Array} data - エクスポートするデータ
 * @param {Array} columns - カラム名配列
 * @param {string} filename - ファイル名（拡張子なし）
 */
export function exportToCSV(data, columns, filename = 'export') {
  // ヘッダー行
  const rows = [columns.join(',')]

  // データ行
  data.forEach(row => {
    const rowData = columns.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return ''
      if (value instanceof Date) {
        return value.toLocaleDateString('ja-JP')
      }
      // カンマや改行を含む場合はクォート
      const str = String(value)
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    rows.push(rowData.join(','))
  })

  // BOM付きUTF-8でダウンロード
  const bom = '\uFEFF'
  const csv = bom + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 集計データをExcelにエクスポート
 * @param {Object} chartConfig - チャート設定
 * @param {Array} data - フィルタ済みデータ
 * @param {string} filename - ファイル名
 */
export function exportAggregatedToExcel(chartConfig, data, filename = 'aggregated') {
  const { xAxis, yAxis, aggregation = 'sum', groupBy = '' } = chartConfig

  // カテゴリ取得
  const categories = [...new Set(data.map(row => row[xAxis]))]

  const workbook = XLSX.utils.book_new()

  if (groupBy) {
    // グループ化あり：ピボットテーブル形式
    const groups = [...new Set(data.map(row => row[groupBy]))]

    const rows = []
    // ヘッダー
    rows.push([xAxis, ...groups])

    // データ
    categories.forEach(cat => {
      const rowData = [cat]
      groups.forEach(group => {
        const filtered = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        const value = aggregate(filtered, yAxis, aggregation)
        rowData.push(value)
      })
      rows.push(rowData)
    })

    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, '集計データ')
  } else {
    // グループ化なし：シンプルな2列
    const rows = [[xAxis, `${yAxis}（${getAggLabel(aggregation)}）`]]

    categories.forEach(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      const value = aggregate(filtered, yAxis, aggregation)
      rows.push([cat, value])
    })

    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, '集計データ')
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// 集計関数（chartGenerator.jsと同じロジック）
function aggregate(rows, column, aggregation) {
  if (rows.length === 0) return 0

  switch (aggregation) {
    case 'count':
      return rows.length
    case 'sum':
      return rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0)
    case 'avg':
      const sum = rows.reduce((s, row) => s + (Number(row[column]) || 0), 0)
      return rows.length > 0 ? Math.round(sum / rows.length * 100) / 100 : 0
    case 'max':
      return Math.max(...rows.map(row => Number(row[column]) || 0))
    case 'min':
      return Math.min(...rows.map(row => Number(row[column]) || 0))
    case 'distinct':
      return new Set(rows.map(row => row[column])).size
    default:
      return rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0)
  }
}

function getAggLabel(agg) {
  const labels = {
    sum: '合計',
    count: 'カウント',
    avg: '平均',
    max: '最大',
    min: '最小',
    distinct: 'ユニーク数'
  }
  return labels[agg] || agg
}

/**
 * チャートをPowerPointにエクスポート（ネイティブチャート版 - 編集可能）
 * @param {Object} chartConfig - チャート設定
 * @param {Array} data - フィルタ済みデータ
 * @param {string} chartType - チャートタイプ（bar, line, pie, area, scatter）
 * @param {string} filename - ファイル名
 */
export function exportToPowerPointNative(chartConfig, data, chartType = 'bar', filename = 'chart') {
  const pptx = new pptxgen()

  // プレゼンテーション設定
  pptx.author = 'Browser BI Tool'
  pptx.title = chartConfig.title || 'チャート'
  pptx.subject = 'データ分析レポート'
  pptx.company = ''

  // コーポレートカラー
  const primaryColor = '005BAB'
  const accentColor = 'FF961C'

  // 集計データを取得
  const { xAxis, yAxis, aggregation = 'sum', groupBy = '' } = chartConfig
  const categories = [...new Set(data.map(row => row[xAxis]))]

  // タイトルスライド
  const titleSlide = pptx.addSlide()
  titleSlide.addText(chartConfig.title || 'データ分析レポート', {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1.5,
    fontSize: 36,
    fontFace: 'Meiryo',
    color: primaryColor,
    align: 'center',
    bold: true
  })
  titleSlide.addText(`${xAxis} × ${yAxis}`, {
    x: 0.5,
    y: 3.5,
    w: '90%',
    h: 0.5,
    fontSize: 18,
    fontFace: 'Meiryo',
    color: '666666',
    align: 'center'
  })
  titleSlide.addText(new Date().toLocaleDateString('ja-JP'), {
    x: 0.5,
    y: 4.5,
    w: '90%',
    h: 0.5,
    fontSize: 14,
    fontFace: 'Meiryo',
    color: '999999',
    align: 'center'
  })

  // ネイティブチャートスライド
  const chartSlide = pptx.addSlide()
  chartSlide.addText(chartConfig.title || 'チャート', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    fontFace: 'Meiryo',
    color: primaryColor,
    bold: true
  })

  // pptxgenjsのチャートタイプをマッピング
  const pptxChartTypeMap = {
    bar: pptx.ChartType.bar,
    line: pptx.ChartType.line,
    pie: pptx.ChartType.pie,
    area: pptx.ChartType.area,
    scatter: pptx.ChartType.scatter
  }
  const pptxChartType = pptxChartTypeMap[chartType] || pptx.ChartType.bar

  // チャートデータを構築
  let chartData = []

  if (groupBy) {
    // グループ化あり：複数シリーズ
    const groups = [...new Set(data.map(row => row[groupBy]))]
    groups.forEach(group => {
      const values = categories.map(cat => {
        const filtered = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        return aggregate(filtered, yAxis, aggregation)
      })
      chartData.push({
        name: String(group),
        labels: categories.map(c => String(c)),
        values
      })
    })
  } else {
    // グループ化なし：単一シリーズ
    const values = categories.map(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      return aggregate(filtered, yAxis, aggregation)
    })
    chartData.push({
      name: `${yAxis}（${getAggLabel(aggregation)}）`,
      labels: categories.map(c => String(c)),
      values
    })
  }

  // カラーパレット
  const colorPalette = [
    '005BAB', 'FF961C', '28A745', 'DC3545', '6F42C1',
    '17A2B8', 'FFC107', '6C757D', '343A40', '007BFF'
  ]

  // チャートオプション
  const chartOptions = {
    x: 0.5,
    y: 1,
    w: 9,
    h: 5.5,
    chartColors: chartData.map((_, i) => colorPalette[i % colorPalette.length]),
    showTitle: false,
    showLegend: chartData.length > 1,
    legendPos: 'b',
    catAxisTitle: xAxis,
    valAxisTitle: yAxis,
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    dataLabelFontSize: 8,
    showValue: chartType === 'pie',
    showPercent: chartType === 'pie'
  }

  // 棒グラフの場合の追加オプション
  if (chartType === 'bar') {
    chartOptions.barDir = 'col'
    chartOptions.barGapWidthPct = 50
    chartOptions.catGridLine = { style: 'none' }
    chartOptions.valGridLine = { color: 'D9D9D9', style: 'solid', size: 0.5 }
  }

  // 折れ線グラフの場合の追加オプション
  if (chartType === 'line') {
    chartOptions.lineSmooth = false
    chartOptions.lineDataSymbol = 'circle'
    chartOptions.lineDataSymbolSize = 6
    chartOptions.catGridLine = { style: 'none' }
    chartOptions.valGridLine = { color: 'D9D9D9', style: 'solid', size: 0.5 }
  }

  // 散布図の場合、データ形式を変換
  if (chartType === 'scatter') {
    // 散布図は特別な形式が必要
    const scatterData = categories.map(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      return {
        x: parseFloat(cat) || 0,
        y: aggregate(filtered, yAxis, aggregation)
      }
    })
    chartData = [{
      name: yAxis,
      values: scatterData.map(d => d.y)
    }]
    chartOptions.catAxisLabelPos = 'low'
  }

  // チャートを追加
  try {
    chartSlide.addChart(pptxChartType, chartData, chartOptions)
  } catch (e) {
    console.error('Chart creation error:', e)
    // フォールバック：テキストで通知
    chartSlide.addText('チャートの作成中にエラーが発生しました', {
      x: 0.5,
      y: 3,
      w: 9,
      h: 1,
      fontSize: 14,
      color: 'CC0000',
      align: 'center'
    })
  }

  // データテーブルスライド
  const dataSlide = pptx.addSlide()
  dataSlide.addText('集計データ', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    fontFace: 'Meiryo',
    color: primaryColor,
    bold: true
  })

  if (groupBy) {
    // グループ化あり：ピボット形式
    const groups = [...new Set(data.map(row => row[groupBy]))]
    const tableRows = [[xAxis, ...groups]]

    categories.slice(0, 15).forEach(cat => {
      const rowData = [String(cat)]
      groups.forEach(group => {
        const filtered = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        const value = aggregate(filtered, yAxis, aggregation)
        rowData.push(String(value))
      })
      tableRows.push(rowData)
    })

    dataSlide.addTable(tableRows, {
      x: 0.5,
      y: 1,
      w: 9,
      fontFace: 'Meiryo',
      fontSize: 10,
      color: '333333',
      border: { pt: 0.5, color: 'CCCCCC' },
      fill: { color: 'FFFFFF' },
      colW: Array(groups.length + 1).fill(9 / (groups.length + 1)),
      rowH: 0.4,
      autoPage: true,
      firstRow: {
        fill: { color: primaryColor },
        color: 'FFFFFF',
        bold: true
      }
    })
  } else {
    // グループ化なし：2列
    const tableRows = [[xAxis, `${yAxis}（${getAggLabel(aggregation)}）`]]

    categories.slice(0, 20).forEach(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      const value = aggregate(filtered, yAxis, aggregation)
      tableRows.push([String(cat), String(value)])
    })

    dataSlide.addTable(tableRows, {
      x: 0.5,
      y: 1,
      w: 9,
      fontFace: 'Meiryo',
      fontSize: 12,
      color: '333333',
      border: { pt: 0.5, color: 'CCCCCC' },
      fill: { color: 'FFFFFF' },
      colW: [4.5, 4.5],
      rowH: 0.4,
      autoPage: true,
      firstRow: {
        fill: { color: primaryColor },
        color: 'FFFFFF',
        bold: true
      }
    })
  }

  // 補足情報
  dataSlide.addText(`データ件数: ${data.length}件  |  集計方法: ${getAggLabel(aggregation)}  |  ※チャートは編集可能です`, {
    x: 0.5,
    y: 6.5,
    w: 9,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Meiryo',
    color: '999999'
  })

  // ファイルダウンロード
  pptx.writeFile({ fileName: `${filename}.pptx` })
}

/**
 * チャートをPowerPointにエクスポート（画像版 - 互換性用）
 * @param {Object} chartConfig - チャート設定
 * @param {Array} data - フィルタ済みデータ
 * @param {string} chartImageBase64 - チャート画像（base64）
 * @param {string} filename - ファイル名
 */
export function exportToPowerPoint(chartConfig, data, chartImageBase64, filename = 'chart') {
  const pptx = new pptxgen()

  // プレゼンテーション設定
  pptx.author = 'Browser BI Tool'
  pptx.title = chartConfig.title || 'チャート'
  pptx.subject = 'データ分析レポート'
  pptx.company = ''

  // コーポレートカラー
  const primaryColor = '005BAB'
  const accentColor = 'FF961C'

  // タイトルスライド
  const titleSlide = pptx.addSlide()
  titleSlide.addText(chartConfig.title || 'データ分析レポート', {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1.5,
    fontSize: 36,
    fontFace: 'Meiryo',
    color: primaryColor,
    align: 'center',
    bold: true
  })
  titleSlide.addText(`${chartConfig.xAxis} × ${chartConfig.yAxis}`, {
    x: 0.5,
    y: 3.5,
    w: '90%',
    h: 0.5,
    fontSize: 18,
    fontFace: 'Meiryo',
    color: '666666',
    align: 'center'
  })
  titleSlide.addText(new Date().toLocaleDateString('ja-JP'), {
    x: 0.5,
    y: 4.5,
    w: '90%',
    h: 0.5,
    fontSize: 14,
    fontFace: 'Meiryo',
    color: '999999',
    align: 'center'
  })

  // チャートスライド
  const chartSlide = pptx.addSlide()
  chartSlide.addText(chartConfig.title || 'チャート', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    fontFace: 'Meiryo',
    color: primaryColor,
    bold: true
  })

  // チャート画像を追加
  if (chartImageBase64) {
    chartSlide.addImage({
      data: chartImageBase64,
      x: 0.5,
      y: 1,
      w: 9,
      h: 5.5
    })
  }

  // データテーブルスライド
  const dataSlide = pptx.addSlide()
  dataSlide.addText('集計データ', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    fontFace: 'Meiryo',
    color: primaryColor,
    bold: true
  })

  // 集計データを取得
  const { xAxis, yAxis, aggregation = 'sum', groupBy = '' } = chartConfig
  const categories = [...new Set(data.map(row => row[xAxis]))]

  if (groupBy) {
    // グループ化あり：ピボット形式
    const groups = [...new Set(data.map(row => row[groupBy]))]
    const tableRows = [[xAxis, ...groups]]

    categories.slice(0, 15).forEach(cat => {
      const rowData = [String(cat)]
      groups.forEach(group => {
        const filtered = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        const value = aggregate(filtered, yAxis, aggregation)
        rowData.push(String(value))
      })
      tableRows.push(rowData)
    })

    dataSlide.addTable(tableRows, {
      x: 0.5,
      y: 1,
      w: 9,
      fontFace: 'Meiryo',
      fontSize: 10,
      color: '333333',
      border: { pt: 0.5, color: 'CCCCCC' },
      fill: { color: 'FFFFFF' },
      colW: Array(groups.length + 1).fill(9 / (groups.length + 1)),
      rowH: 0.4,
      autoPage: true,
      firstRow: {
        fill: { color: primaryColor },
        color: 'FFFFFF',
        bold: true
      }
    })
  } else {
    // グループ化なし：2列
    const tableRows = [[xAxis, `${yAxis}（${getAggLabel(aggregation)}）`]]

    categories.slice(0, 20).forEach(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      const value = aggregate(filtered, yAxis, aggregation)
      tableRows.push([String(cat), String(value)])
    })

    dataSlide.addTable(tableRows, {
      x: 0.5,
      y: 1,
      w: 9,
      fontFace: 'Meiryo',
      fontSize: 12,
      color: '333333',
      border: { pt: 0.5, color: 'CCCCCC' },
      fill: { color: 'FFFFFF' },
      colW: [4.5, 4.5],
      rowH: 0.4,
      autoPage: true,
      firstRow: {
        fill: { color: primaryColor },
        color: 'FFFFFF',
        bold: true
      }
    })
  }

  // 補足情報
  dataSlide.addText(`データ件数: ${data.length}件  |  集計方法: ${getAggLabel(aggregation)}`, {
    x: 0.5,
    y: 6.5,
    w: 9,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Meiryo',
    color: '999999'
  })

  // ファイルダウンロード
  pptx.writeFile({ fileName: `${filename}.pptx` })
}

/**
 * EChartsインスタンスからPowerPointにエクスポート
 * @param {Object} chartInstance - EChartsインスタンス
 * @param {Object} chartConfig - チャート設定
 * @param {Array} data - フィルタ済みデータ
 * @param {string} filename - ファイル名
 */
export function exportChartToPowerPoint(chartInstance, chartConfig, data, filename = 'chart') {
  if (!chartInstance) {
    alert('チャートが表示されていません')
    return
  }

  // チャート画像を取得
  const chartImageBase64 = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })

  exportToPowerPoint(chartConfig, data, chartImageBase64, filename)
}

/**
 * 集計データをExcelにエクスポート（グラフ画像付き）
 * ExcelJSを使用してスタイル付きデータ + チャート画像を生成
 * ※ブラウザJSではExcelネイティブチャート作成は技術的に困難なため、
 *   チャート画像埋め込み + グラフ作成手順を提供
 *
 * @param {Object} chartConfig - チャート設定
 * @param {Array} data - フィルタ済みデータ
 * @param {string} chartType - チャートタイプ（bar, line, pie, etc.）
 * @param {string} filename - ファイル名
 * @param {string} chartImageBase64 - チャート画像（オプション、base64形式）
 */
export async function exportToExcelWithChart(chartConfig, data, chartType = 'bar', filename = 'chart_export', chartImageBase64 = null) {
  const { xAxis, yAxis, aggregation = 'sum', groupBy = '' } = chartConfig

  // カテゴリ取得
  const categories = [...new Set(data.map(row => row[xAxis]))]

  // ExcelJSワークブック作成
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Browser BI Tool'
  workbook.created = new Date()

  // データシート作成
  const dataSheet = workbook.addWorksheet('集計データ')

  if (groupBy) {
    // グループ化あり：ピボットテーブル形式
    const groups = [...new Set(data.map(row => row[groupBy]))]

    // ヘッダー行
    dataSheet.addRow([xAxis, ...groups])

    // ヘッダーのスタイル
    const headerRow = dataSheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF005BAB' }
    }
    headerRow.alignment = { horizontal: 'center' }

    // データ行
    categories.forEach(cat => {
      const rowData = [cat]
      groups.forEach(group => {
        const filtered = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        const value = aggregate(filtered, yAxis, aggregation)
        rowData.push(value)
      })
      dataSheet.addRow(rowData)
    })

    // 列幅自動調整
    dataSheet.columns.forEach((col, i) => {
      col.width = i === 0 ? 20 : 15
    })

  } else {
    // グループ化なし：シンプルな2列
    const aggLabel = getAggLabel(aggregation)

    // ヘッダー行
    dataSheet.addRow([xAxis, `${yAxis}（${aggLabel}）`])

    // ヘッダーのスタイル
    const headerRow = dataSheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF005BAB' }
    }
    headerRow.alignment = { horizontal: 'center' }

    // データ行
    categories.forEach(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      const value = aggregate(filtered, yAxis, aggregation)
      dataSheet.addRow([cat, value])
    })

    // 列幅自動調整
    dataSheet.getColumn(1).width = 25
    dataSheet.getColumn(2).width = 20
  }

  // テーブルスタイルを適用（Excelでグラフ挿入しやすい形式）
  // テーブルとして定義
  const tableEndRow = categories.length + 1
  const tableEndCol = groupBy
    ? [...new Set(data.map(row => row[groupBy]))].length + 1
    : 2

  // チャート画像がある場合は「チャート」シートを追加
  if (chartImageBase64) {
    const chartSheet = workbook.addWorksheet('チャート')

    // タイトル
    chartSheet.addRow([chartConfig.title || 'チャート'])
    chartSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF005BAB' } }
    chartSheet.addRow([])

    // base64からバイナリデータを抽出
    const base64Data = chartImageBase64.replace(/^data:image\/\w+;base64,/, '')

    // 画像を追加
    const imageId = workbook.addImage({
      base64: base64Data,
      extension: 'png'
    })

    chartSheet.addImage(imageId, {
      tl: { col: 0, row: 2 },
      ext: { width: 600, height: 400 }
    })

    // 列幅調整
    chartSheet.getColumn(1).width = 100
  }

  // 注釈シートにグラフ作成手順を追加
  const helpSheet = workbook.addWorksheet('グラフ作成手順')
  helpSheet.addRow(['Excelでネイティブグラフを作成する手順'])
  helpSheet.addRow([])
  helpSheet.addRow(['【手順】'])
  helpSheet.addRow(['1. 「集計データ」シートを選択'])
  helpSheet.addRow(['2. データ範囲（A1から最終行まで）を選択'])
  helpSheet.addRow(['3. 「挿入」タブ→「グラフ」→「おすすめグラフ」を選択'])
  helpSheet.addRow(['4. お好みのグラフタイプを選択してOK'])
  helpSheet.addRow([])
  helpSheet.addRow(['【推奨グラフタイプ】'])
  helpSheet.addRow([`  ${chartType === 'bar' ? '→ 棒グラフ（現在の表示タイプ）' : '・棒グラフ'}`])
  helpSheet.addRow([`  ${chartType === 'line' ? '→ 折れ線グラフ（現在の表示タイプ）' : '・折れ線グラフ'}`])
  helpSheet.addRow([`  ${chartType === 'pie' ? '→ 円グラフ（現在の表示タイプ）' : '・円グラフ'}`])
  helpSheet.addRow([`  ${chartType === 'area' ? '→ 面グラフ（現在の表示タイプ）' : '・面グラフ'}`])
  helpSheet.addRow([])
  if (chartImageBase64) {
    helpSheet.addRow(['※「チャート」シートに現在表示中のグラフ画像も添付済みです'])
  }
  helpSheet.getColumn(1).width = 60
  helpSheet.getRow(1).font = { bold: true, size: 14 }
  helpSheet.getRow(3).font = { bold: true }

  // 交互行の背景色
  dataSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        }
      })
    }
  })

  // 罫線追加
  const lastRow = dataSheet.lastRow.number
  const lastCol = groupBy
    ? [...new Set(data.map(row => row[groupBy]))].length + 1
    : 2

  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = dataSheet.getCell(r, c)
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      }
    }
  }

  // 数値列のフォーマット
  dataSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1 && typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00'
          cell.alignment = { horizontal: 'right' }
        }
      })
    }
  })

  // 集計情報シート
  const infoSheet = workbook.addWorksheet('情報')
  infoSheet.addRow(['項目', '値'])
  infoSheet.addRow(['X軸', xAxis])
  infoSheet.addRow(['Y軸', yAxis])
  infoSheet.addRow(['集計方法', getAggLabel(aggregation)])
  if (groupBy) {
    infoSheet.addRow(['グループ化', groupBy])
  }
  infoSheet.addRow(['データ件数', data.length])
  infoSheet.addRow(['出力日時', new Date().toLocaleString('ja-JP')])

  // 情報シートのスタイル
  infoSheet.getColumn(1).width = 15
  infoSheet.getColumn(2).width = 30
  infoSheet.getRow(1).font = { bold: true }

  // ファイルダウンロード
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xlsx`
  link.click()

  URL.revokeObjectURL(url)
}
