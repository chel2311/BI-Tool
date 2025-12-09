/**
 * エクスポートサービス
 * Excel/CSV/PowerPointエクスポート機能
 */

import * as XLSX from 'xlsx'
import pptxgen from 'pptxgenjs'

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
 * チャートをPowerPointにエクスポート
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
