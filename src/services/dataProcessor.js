import * as XLSX from 'xlsx'

/**
 * データ型を自動検出
 * @param {Array} columnData - カラムデータの配列
 * @returns {string} - 'number' | 'date' | 'string' | 'boolean'
 */
export function detectDataType(columnData) {
  // 空でないデータのみ対象
  const nonEmpty = columnData.filter(v => v !== null && v !== undefined && v !== '')
  if (nonEmpty.length === 0) return 'string'

  // サンプリング（最大100件）
  const sample = nonEmpty.slice(0, 100)

  // boolean チェック
  const boolCount = sample.filter(v =>
    typeof v === 'boolean' ||
    v === 'true' || v === 'false' ||
    v === 'TRUE' || v === 'FALSE'
  ).length
  if (boolCount / sample.length > 0.9) return 'boolean'

  // number チェック
  const numCount = sample.filter(v => {
    if (typeof v === 'number') return !isNaN(v)
    const num = parseFloat(String(v).replace(/,/g, ''))
    return !isNaN(num)
  }).length
  if (numCount / sample.length > 0.9) return 'number'

  // date チェック
  const datePatterns = [
    /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,
    /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,
    /^\d{4}年\d{1,2}月\d{1,2}日$/
  ]
  const dateCount = sample.filter(v => {
    if (v instanceof Date) return !isNaN(v)
    const str = String(v)
    return datePatterns.some(p => p.test(str)) || !isNaN(Date.parse(str))
  }).length
  if (dateCount / sample.length > 0.9) return 'date'

  return 'string'
}

/**
 * データを正規化
 * @param {Array} data - 生データ
 * @param {Object} types - カラム型定義
 * @returns {Array} - 正規化されたデータ
 */
export function normalizeData(data, types) {
  return data.map(row => {
    const normalized = {}
    for (const [key, value] of Object.entries(row)) {
      const type = types[key]
      if (type === 'number') {
        const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))
        normalized[key] = isNaN(num) ? null : num
      } else if (type === 'date') {
        const date = value instanceof Date ? value : new Date(value)
        normalized[key] = isNaN(date) ? null : date
      } else if (type === 'boolean') {
        normalized[key] = value === true || value === 'true' || value === 'TRUE'
      } else {
        normalized[key] = String(value ?? '')
      }
    }
    return normalized
  })
}

/**
 * ヘッダー行を自動検出
 * 改善版：全列を分析してより正確にヘッダー行を検出
 *
 * ヘッダー行の特徴:
 * - 各列のデータ型が均一でない行（文字列ラベルの可能性）
 * - 数値のみの行ではない
 * - 次の行にデータがある
 * - 全列の少なくとも半分以上が埋まっている
 *
 * @param {Array<Array>} rawData - 2次元配列データ
 * @param {number} maxSearch - 検索する最大行数（デフォルト: 20）
 * @returns {number} - ヘッダー行のインデックス（0始まり）
 */
export function detectHeaderRow(rawData, maxSearch = 20) {
  if (!rawData || rawData.length === 0) return 0

  const searchLimit = Math.min(rawData.length - 1, maxSearch)

  // 列数を決定（最初の10行の最大列数）
  const maxCols = Math.max(...rawData.slice(0, 10).map(row => row?.length || 0))
  if (maxCols === 0) return 0

  // 各列のデータ型パターンを分析（ヘッダー行以降のデータで判定）
  function analyzeColumnTypes(startRow) {
    const types = []
    for (let col = 0; col < maxCols; col++) {
      let numericCount = 0
      let stringCount = 0
      let emptyCount = 0
      let totalCount = 0

      for (let row = startRow; row < Math.min(rawData.length, startRow + 20); row++) {
        const cell = rawData[row]?.[col]
        totalCount++

        if (cell === null || cell === undefined || cell === '') {
          emptyCount++
          continue
        }

        if (typeof cell === 'number') {
          numericCount++
        } else {
          const str = String(cell).trim()
          const num = parseFloat(str.replace(/,/g, ''))
          if (!isNaN(num) && str !== '') {
            numericCount++
          } else {
            stringCount++
          }
        }
      }

      types.push({
        numeric: numericCount,
        string: stringCount,
        empty: emptyCount,
        total: totalCount,
        isNumericColumn: numericCount > stringCount && numericCount > 0
      })
    }
    return types
  }

  // ヘッダー候補をスコアリング
  function scoreAsHeader(rowIndex) {
    const row = rawData[rowIndex]
    if (!row || row.length === 0) return -1

    let score = 0
    const nextRowTypes = analyzeColumnTypes(rowIndex + 1)

    let filledCells = 0
    let textCells = 0
    let numericCells = 0
    let mismatchedTypeCells = 0  // 列の型と異なるセル

    for (let col = 0; col < Math.min(row.length, maxCols); col++) {
      const cell = row[col]

      if (cell === null || cell === undefined || cell === '') {
        continue
      }

      filledCells++

      const isNumeric = typeof cell === 'number' ||
        (!isNaN(parseFloat(String(cell).replace(/,/g, ''))) && String(cell).trim() !== '')

      if (isNumeric) {
        numericCells++
      } else {
        textCells++
      }

      // この列が数値列なのに、このセルが文字列ならヘッダーの可能性が高い
      const colType = nextRowTypes[col]
      if (colType && colType.isNumericColumn && !isNumeric) {
        mismatchedTypeCells++
      }
    }

    // スコア計算
    // 1. 埋まっているセルが半分以上ある
    if (filledCells >= maxCols * 0.3) score += 20

    // 2. 全て数値の行はヘッダーではない可能性が高い
    if (filledCells > 0 && numericCells / filledCells > 0.9) {
      score -= 50
    }

    // 3. 文字列セルが多いほどヘッダーの可能性が高い
    if (filledCells > 0) {
      score += (textCells / filledCells) * 30
    }

    // 4. 列の型と異なるセルが多い（数値列なのにテキスト）
    score += mismatchedTypeCells * 10

    // 5. 次の行にデータがあるか
    if (rowIndex + 1 < rawData.length) {
      const nextRow = rawData[rowIndex + 1]
      const nextRowNonEmpty = nextRow?.filter(c => c !== null && c !== undefined && c !== '').length || 0
      if (nextRowNonEmpty > 0) {
        score += 10
      }
    }

    return score
  }

  // 各行をスコアリングして最良のヘッダー行を選択
  let bestRow = 0
  let bestScore = -Infinity

  for (let i = 0; i < searchLimit; i++) {
    const row = rawData[i]
    if (!row) continue

    const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '')
    if (nonEmptyCells.length === 0) continue

    const score = scoreAsHeader(i)

    if (score > bestScore) {
      bestScore = score
      bestRow = i
    }
  }

  return bestRow
}

/**
 * CSVテキストをパース
 * @param {string} text - CSVテキスト
 * @returns {Object} - {columns, data, types}
 */
export function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) throw new Error('空のファイルです')

  // ヘッダー行
  const columns = parseCSVLine(lines[0])

  // データ行
  const rawData = lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const row = {}
    columns.forEach((col, i) => {
      row[col] = values[i] ?? ''
    })
    return row
  })

  // 型検出
  const types = {}
  columns.forEach(col => {
    const colData = rawData.map(row => row[col])
    types[col] = detectDataType(colData)
  })

  // 正規化
  const data = normalizeData(rawData, types)

  return { columns, data, types }
}

/**
 * CSVの1行をパース（クォート対応）
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * CSVファイルを解析
 * @param {File} file - アップロードされたファイル
 * @returns {Promise<{columns, data, types, name}>}
 */
export async function parseCSV(file) {
  const text = await file.text()
  const result = parseCSVText(text)
  return {
    ...result,
    name: file.name,
    rowCount: result.data.length
  }
}

/**
 * Excelファイルのシート一覧とプレビュー情報を取得
 * @param {File} file - アップロードされたファイル
 * @returns {Promise<{sheets: Array<{name, rowCount, colCount, headerRow}>}>}
 */
export async function getExcelSheetInfo(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  const sheets = workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    // ヘッダー行を検出
    const headerRow = detectHeaderRow(rawData)

    // プレビュー用の先頭5行を取得
    const previewRows = rawData.slice(0, Math.min(10, rawData.length))

    return {
      name: sheetName,
      rowCount: rawData.length,
      colCount: rawData[0]?.length || 0,
      headerRow: headerRow,
      preview: previewRows
    }
  })

  return { sheets, fileName: file.name }
}

/**
 * Excelファイルを解析
 * @param {File} file - アップロードされたファイル
 * @param {Object} options - オプション
 * @param {string} options.sheetName - シート名（省略時は最初のシート）
 * @param {number} options.headerRow - ヘッダー行（0始まり、省略時は自動検出）
 * @returns {Promise<{columns, data, types, sheets, name}>}
 */
export async function parseExcel(file, options = {}) {
  const { sheetName = null, headerRow = null } = options

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  const sheets = workbook.SheetNames
  const targetSheet = sheetName || sheets[0]
  const worksheet = workbook.Sheets[targetSheet]

  if (!worksheet) {
    throw new Error(`シート "${targetSheet}" が見つかりません`)
  }

  // シートをJSONに変換
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

  if (rawData.length === 0) throw new Error('空のシートです')

  // ヘッダー行を決定（指定がなければ自動検出）
  const actualHeaderRow = headerRow !== null ? headerRow : detectHeaderRow(rawData)

  // ヘッダー行のデータ
  const headerRowData = rawData[actualHeaderRow] || []
  const columns = headerRowData.map((col, i) => {
    const colName = col !== null && col !== undefined && col !== ''
      ? String(col).trim()
      : `Column${i + 1}`
    return colName
  })

  // 重複するカラム名を処理
  const columnCounts = {}
  const uniqueColumns = columns.map(col => {
    if (columnCounts[col] === undefined) {
      columnCounts[col] = 0
      return col
    } else {
      columnCounts[col]++
      return `${col}_${columnCounts[col]}`
    }
  })

  // データ行（ヘッダー行より後のデータ）
  const data = rawData.slice(actualHeaderRow + 1)
    .filter(row => {
      // 完全に空の行を除外
      return row.some(cell => cell !== null && cell !== undefined && cell !== '')
    })
    .map(row => {
      const obj = {}
      uniqueColumns.forEach((col, i) => {
        obj[col] = row[i] ?? ''
      })
      return obj
    })

  // 型検出
  const types = {}
  uniqueColumns.forEach(col => {
    const colData = data.map(row => row[col])
    types[col] = detectDataType(colData)
  })

  // 正規化
  const normalizedData = normalizeData(data, types)

  return {
    columns: uniqueColumns,
    data: normalizedData,
    types,
    sheets,
    currentSheet: targetSheet,
    headerRow: actualHeaderRow,
    name: file.name,
    rowCount: normalizedData.length
  }
}

/**
 * JSONファイルを解析
 * @param {File} file - アップロードされたファイル
 * @returns {Promise<{columns, data, types, name}>}
 */
export async function parseJSON(file) {
  const text = await file.text()
  const json = JSON.parse(text)

  // 配列形式のJSONを想定
  const rawData = Array.isArray(json) ? json : [json]

  if (rawData.length === 0) throw new Error('空のJSONです')

  // カラム抽出（最初の要素から）
  const columns = Object.keys(rawData[0])

  // 型検出
  const types = {}
  columns.forEach(col => {
    const colData = rawData.map(row => row[col])
    types[col] = detectDataType(colData)
  })

  // 正規化
  const data = normalizeData(rawData, types)

  return {
    columns,
    data,
    types,
    name: file.name,
    rowCount: data.length
  }
}

/**
 * ファイルを自動判定して解析
 * @param {File} file - アップロードされたファイル
 * @param {Object} options - オプション（Excelの場合に使用）
 * @returns {Promise<Object>}
 */
export async function parseFile(file, options = {}) {
  const ext = file.name.split('.').pop().toLowerCase()

  switch (ext) {
    case 'csv':
      return parseCSV(file)
    case 'xlsx':
    case 'xls':
      return parseExcel(file, options)
    case 'json':
      return parseJSON(file)
    default:
      throw new Error(`対応していないファイル形式です: ${ext}`)
  }
}

/**
 * Excelファイルかどうか判定
 * @param {File} file
 * @returns {boolean}
 */
export function isExcelFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  return ext === 'xlsx' || ext === 'xls'
}
