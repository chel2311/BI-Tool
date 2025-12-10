/**
 * ExcelチャートサービスOpenXML形式でネイティブExcelチャートを生成
 */

import JSZip from 'jszip'

/**
 * チャートタイプをExcel形式に変換
 */
const CHART_TYPE_MAP = {
  bar: 'barChart',
  line: 'lineChart',
  pie: 'pieChart',
  area: 'areaChart',
  scatter: 'scatterChart'
}

/**
 * 集計関数
 */
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
    default:
      return rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0)
  }
}

/**
 * 集計データを生成
 */
function prepareChartData(chartConfig, data) {
  const { xAxis, yAxis, aggregation = 'sum', groupBy = '' } = chartConfig
  const categories = [...new Set(data.map(row => row[xAxis]))]

  if (groupBy) {
    const groups = [...new Set(data.map(row => row[groupBy]))]
    const series = groups.map(group => {
      const values = categories.map(cat => {
        const filtered = data.filter(row => row[xAxis] === cat && row[groupBy] === group)
        return aggregate(filtered, yAxis, aggregation)
      })
      return { name: String(group), values }
    })
    return { categories: categories.map(String), series }
  } else {
    const values = categories.map(cat => {
      const filtered = data.filter(row => row[xAxis] === cat)
      return aggregate(filtered, yAxis, aggregation)
    })
    return {
      categories: categories.map(String),
      series: [{ name: yAxis, values }]
    }
  }
}

/**
 * カラム番号をExcel列名に変換 (0 -> A, 1 -> B, ...)
 */
function colToLetter(col) {
  let letter = ''
  while (col >= 0) {
    letter = String.fromCharCode(65 + (col % 26)) + letter
    col = Math.floor(col / 26) - 1
  }
  return letter
}

/**
 * [Content_Types].xml生成
 */
function generateContentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`
}

/**
 * _rels/.rels生成
 */
function generateRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
}

/**
 * xl/_rels/workbook.xml.rels生成
 */
function generateWorkbookRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
}

/**
 * xl/workbook.xml生成
 */
function generateWorkbook() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="データ" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
}

/**
 * xl/styles.xml生成
 */
function generateStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Meiryo"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Meiryo"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF005BAB"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/>
    <border>
      <left style="thin"><color rgb="FFCCCCCC"/></left>
      <right style="thin"><color rgb="FFCCCCCC"/></right>
      <top style="thin"><color rgb="FFCCCCCC"/></top>
      <bottom style="thin"><color rgb="FFCCCCCC"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`
}

/**
 * xl/sharedStrings.xml生成
 */
function generateSharedStrings(strings) {
  const escapedStrings = strings.map(s => {
    const escaped = String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<si><t>${escaped}</t></si>`
  })
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${escapedStrings.join('\n')}
</sst>`
}

/**
 * xl/worksheets/sheet1.xml生成（データシート）
 */
function generateWorksheet(chartData) {
  const { categories, series } = chartData
  const rows = []

  // ヘッダー行
  const headerCells = [`<c r="A1" t="s" s="1"><v>0</v></c>`]  // カテゴリ列
  series.forEach((s, i) => {
    headerCells.push(`<c r="${colToLetter(i + 1)}1" t="s" s="1"><v>${i + 1}</v></c>`)
  })
  rows.push(`<row r="1">${headerCells.join('')}</row>`)

  // データ行
  categories.forEach((cat, rowIdx) => {
    const cells = [`<c r="A${rowIdx + 2}" t="s" s="2"><v>${series.length + 1 + rowIdx}</v></c>`]
    series.forEach((s, colIdx) => {
      cells.push(`<c r="${colToLetter(colIdx + 1)}${rowIdx + 2}" s="2"><v>${s.values[rowIdx]}</v></c>`)
    })
    rows.push(`<row r="${rowIdx + 2}">${cells.join('')}</row>`)
  })

  const lastCol = colToLetter(series.length)
  const lastRow = categories.length + 1

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0"/>
  </sheetViews>
  <sheetData>
${rows.join('\n')}
  </sheetData>
  <drawing r:id="rId1"/>
</worksheet>`
}

/**
 * xl/worksheets/_rels/sheet1.xml.rels生成
 */
function generateSheetRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`
}

/**
 * xl/drawings/drawing1.xml生成
 */
function generateDrawing() {
  // チャートをセルE2からO20の位置に配置
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
          xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
          xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:twoCellAnchor>
    <xdr:from>
      <xdr:col>4</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>1</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:from>
    <xdr:to>
      <xdr:col>14</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>20</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="2" name="Chart 1"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm>
        <a:off x="0" y="0"/>
        <a:ext cx="0" cy="0"/>
      </xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`
}

/**
 * xl/drawings/_rels/drawing1.xml.rels生成
 */
function generateDrawingRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
</Relationships>`
}

/**
 * xl/charts/chart1.xml生成（ネイティブExcelチャート）
 */
function generateChart(chartData, chartType, title) {
  const { categories, series } = chartData
  const excelChartType = CHART_TYPE_MAP[chartType] || 'barChart'
  const lastRow = categories.length + 1

  // シリーズXML生成
  const seriesXml = series.map((s, idx) => {
    const catRef = `データ!$A$2:$A$${lastRow}`
    const valRef = `データ!$${colToLetter(idx + 1)}$2:$${colToLetter(idx + 1)}$${lastRow}`

    // 色設定（コーポレートカラー系）
    const colors = ['005BAB', 'FF961C', '4CAF50', 'E91E63', '9C27B0', '00BCD4', 'FF5722', '795548']
    const color = colors[idx % colors.length]

    if (chartType === 'pie') {
      return `
      <c:ser>
        <c:idx val="${idx}"/>
        <c:order val="${idx}"/>
        <c:tx><c:strRef><c:f>データ!$${colToLetter(idx + 1)}$1</c:f></c:strRef></c:tx>
        <c:cat><c:strRef><c:f>${catRef}</c:f></c:strRef></c:cat>
        <c:val><c:numRef><c:f>${valRef}</c:f></c:numRef></c:val>
      </c:ser>`
    } else if (chartType === 'scatter') {
      return `
      <c:ser>
        <c:idx val="${idx}"/>
        <c:order val="${idx}"/>
        <c:tx><c:strRef><c:f>データ!$${colToLetter(idx + 1)}$1</c:f></c:strRef></c:tx>
        <c:spPr>
          <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
        </c:spPr>
        <c:xVal><c:numRef><c:f>データ!$A$2:$A$${lastRow}</c:f></c:numRef></c:xVal>
        <c:yVal><c:numRef><c:f>${valRef}</c:f></c:numRef></c:yVal>
      </c:ser>`
    } else {
      return `
      <c:ser>
        <c:idx val="${idx}"/>
        <c:order val="${idx}"/>
        <c:tx><c:strRef><c:f>データ!$${colToLetter(idx + 1)}$1</c:f></c:strRef></c:tx>
        <c:spPr>
          <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
        </c:spPr>
        <c:cat><c:strRef><c:f>${catRef}</c:f></c:strRef></c:cat>
        <c:val><c:numRef><c:f>${valRef}</c:f></c:numRef></c:val>
      </c:ser>`
    }
  }).join('')

  // チャートタイプ別の設定
  let chartContent = ''
  if (chartType === 'pie') {
    chartContent = `
    <c:pieChart>
      <c:varyColors val="1"/>
      ${seriesXml}
    </c:pieChart>`
  } else if (chartType === 'line') {
    chartContent = `
    <c:lineChart>
      <c:grouping val="standard"/>
      ${seriesXml}
      <c:marker val="1"/>
      <c:axId val="1"/>
      <c:axId val="2"/>
    </c:lineChart>
    <c:catAx>
      <c:axId val="1"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="b"/>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="2"/>
      <c:crosses val="autoZero"/>
    </c:catAx>
    <c:valAx>
      <c:axId val="2"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="l"/>
      <c:majorGridlines>
        <c:spPr>
          <a:ln w="9525">
            <a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill>
          </a:ln>
        </c:spPr>
      </c:majorGridlines>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="1"/>
      <c:crosses val="autoZero"/>
    </c:valAx>`
  } else if (chartType === 'area') {
    chartContent = `
    <c:areaChart>
      <c:grouping val="standard"/>
      ${seriesXml}
      <c:axId val="1"/>
      <c:axId val="2"/>
    </c:areaChart>
    <c:catAx>
      <c:axId val="1"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="b"/>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="2"/>
      <c:crosses val="autoZero"/>
    </c:catAx>
    <c:valAx>
      <c:axId val="2"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="l"/>
      <c:majorGridlines>
        <c:spPr>
          <a:ln w="9525">
            <a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill>
          </a:ln>
        </c:spPr>
      </c:majorGridlines>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="1"/>
      <c:crosses val="autoZero"/>
    </c:valAx>`
  } else if (chartType === 'scatter') {
    chartContent = `
    <c:scatterChart>
      <c:scatterStyle val="lineMarker"/>
      ${seriesXml}
      <c:axId val="1"/>
      <c:axId val="2"/>
    </c:scatterChart>
    <c:valAx>
      <c:axId val="1"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="b"/>
      <c:majorGridlines>
        <c:spPr>
          <a:ln w="9525">
            <a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill>
          </a:ln>
        </c:spPr>
      </c:majorGridlines>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="2"/>
      <c:crosses val="autoZero"/>
    </c:valAx>
    <c:valAx>
      <c:axId val="2"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="l"/>
      <c:majorGridlines>
        <c:spPr>
          <a:ln w="9525">
            <a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill>
          </a:ln>
        </c:spPr>
      </c:majorGridlines>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="1"/>
      <c:crosses val="autoZero"/>
    </c:valAx>`
  } else {
    // barChart（デフォルト）
    chartContent = `
    <c:barChart>
      <c:barDir val="col"/>
      <c:grouping val="clustered"/>
      ${seriesXml}
      <c:axId val="1"/>
      <c:axId val="2"/>
    </c:barChart>
    <c:catAx>
      <c:axId val="1"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="b"/>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="2"/>
      <c:crosses val="autoZero"/>
    </c:catAx>
    <c:valAx>
      <c:axId val="2"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:delete val="0"/>
      <c:axPos val="l"/>
      <c:majorGridlines>
        <c:spPr>
          <a:ln w="9525">
            <a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill>
          </a:ln>
        </c:spPr>
      </c:majorGridlines>
      <c:majorTickMark val="out"/>
      <c:minorTickMark val="none"/>
      <c:tickLblPos val="nextTo"/>
      <c:spPr>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="808080"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:crossAx val="1"/>
      <c:crosses val="autoZero"/>
    </c:valAx>`
  }

  const escapedTitle = (title || 'チャート')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title>
      <c:tx>
        <c:rich>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr>
              <a:defRPr sz="1400" b="1">
                <a:solidFill><a:srgbClr val="005BAB"/></a:solidFill>
              </a:defRPr>
            </a:pPr>
            <a:r>
              <a:rPr lang="ja-JP"/>
              <a:t>${escapedTitle}</a:t>
            </a:r>
          </a:p>
        </c:rich>
      </c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:plotArea>
      <c:layout/>
      ${chartContent}
    </c:plotArea>
    <c:legend>
      <c:legendPos val="r"/>
      <c:overlay val="0"/>
    </c:legend>
  </c:chart>
</c:chartSpace>`
}

/**
 * ExcelネイティブチャートをXLSXファイルとして生成・ダウンロード
 * @param {Object} chartConfig - チャート設定
 * @param {Array} data - データ
 * @param {string} chartType - チャートタイプ（bar, line, pie, area, scatter）
 * @param {string} filename - ファイル名
 */
export async function exportToExcelWithNativeChart(chartConfig, data, chartType = 'bar', filename = 'chart_export') {
  const chartData = prepareChartData(chartConfig, data)
  const { categories, series } = chartData

  // SharedStrings用の文字列配列を作成
  const sharedStrings = [
    chartConfig.xAxis || 'カテゴリ',  // 0: カテゴリ列ヘッダー
    ...series.map(s => s.name),         // 1~n: シリーズ名
    ...categories                        // n+1~: カテゴリ値
  ]

  const zip = new JSZip()

  // ファイル構造を作成
  zip.file('[Content_Types].xml', generateContentTypes())
  zip.file('_rels/.rels', generateRels())
  zip.file('xl/_rels/workbook.xml.rels', generateWorkbookRels())
  zip.file('xl/workbook.xml', generateWorkbook())
  zip.file('xl/styles.xml', generateStyles())
  zip.file('xl/sharedStrings.xml', generateSharedStrings(sharedStrings))
  zip.file('xl/worksheets/sheet1.xml', generateWorksheet(chartData))
  zip.file('xl/worksheets/_rels/sheet1.xml.rels', generateSheetRels())
  zip.file('xl/drawings/drawing1.xml', generateDrawing())
  zip.file('xl/drawings/_rels/drawing1.xml.rels', generateDrawingRels())
  zip.file('xl/charts/chart1.xml', generateChart(chartData, chartType, chartConfig.title))

  // ZIPとしてダウンロード
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xlsx`
  link.click()

  URL.revokeObjectURL(url)
}
