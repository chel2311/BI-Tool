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
 * Excelファイルを解析
 * @param {File} file - アップロードされたファイル
 * @param {string} sheetName - シート名（省略時は最初のシート）
 * @returns {Promise<{columns, data, types, sheets, name}>}
 */
export async function parseExcel(file, sheetName = null) {
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

  // ヘッダー行
  const columns = rawData[0].map((col, i) => col || `Column${i + 1}`)

  // データ行
  const data = rawData.slice(1).map(row => {
    const obj = {}
    columns.forEach((col, i) => {
      obj[col] = row[i] ?? ''
    })
    return obj
  })

  // 型検出
  const types = {}
  columns.forEach(col => {
    const colData = data.map(row => row[col])
    types[col] = detectDataType(colData)
  })

  // 正規化
  const normalizedData = normalizeData(data, types)

  return {
    columns,
    data: normalizedData,
    types,
    sheets,
    currentSheet: targetSheet,
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
 * @returns {Promise<Object>}
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  switch (ext) {
    case 'csv':
      return parseCSV(file)
    case 'xlsx':
    case 'xls':
      return parseExcel(file)
    case 'json':
      return parseJSON(file)
    default:
      throw new Error(`対応していないファイル形式です: ${ext}`)
  }
}
