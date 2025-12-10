import{i as H,j as O,k as le,x as se,y as ne,c as i,a,l as T,t as h,b as ee,w as te,d as V,r as re,s as F,v as S,m as G,F as M,q as R,z as ie,A as ce,B as J,o as c,C as ue}from"./vendor-vue-KVDUZo9Z.js";import{u as de}from"./dataStore-B12QgO0T.js";import{a as pe,d as me,g as xe}from"./chartGenerator-CAZcMGj7.js";import{P as ve,J as ge}from"./vendor-pptx-CSp9oYaw.js";import"./vendor-xlsx-B9CstNKb.js";import{i as fe}from"./vendor-echarts-Bb6yjXMn.js";function he(r,n,v="export"){const x=[n.join(",")];r.forEach(y=>{const p=n.map(_=>{const w=y[_];if(w==null)return"";if(w instanceof Date)return w.toLocaleDateString("ja-JP");const A=String(w);return A.includes(",")||A.includes(`
`)||A.includes('"')?`"${A.replace(/"/g,'""')}"`:A});x.push(p.join(","))});const d="\uFEFF"+x.join(`
`),l=new Blob([d],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(l),m=document.createElement("a");m.href=u,m.download=`${v}.csv`,m.click(),URL.revokeObjectURL(u)}function q(r,n,v){if(r.length===0)return 0;switch(v){case"count":return r.length;case"sum":return r.reduce((e,d)=>e+(Number(d[n])||0),0);case"avg":const x=r.reduce((e,d)=>e+(Number(d[n])||0),0);return r.length>0?Math.round(x/r.length*100)/100:0;case"max":return Math.max(...r.map(e=>Number(e[n])||0));case"min":return Math.min(...r.map(e=>Number(e[n])||0));case"distinct":return new Set(r.map(e=>e[n])).size;default:return r.reduce((e,d)=>e+(Number(d[n])||0),0)}}function Y(r){return{sum:"合計",count:"カウント",avg:"平均",max:"最大",min:"最小",distinct:"ユニーク数"}[r]||r}function ye(r,n,v="bar",x="chart"){const e=new ve;e.author="Browser BI Tool",e.title=r.title||"チャート",e.subject="データ分析レポート",e.company="";const d="005BAB",{xAxis:l,yAxis:u,aggregation:m="sum",groupBy:y=""}=r,p=[...new Set(n.map(k=>k[l]))],_=e.addSlide();_.addText(r.title||"データ分析レポート",{x:.5,y:2,w:"90%",h:1.5,fontSize:36,fontFace:"Meiryo",color:d,align:"center",bold:!0}),_.addText(`${l} × ${u}`,{x:.5,y:3.5,w:"90%",h:.5,fontSize:18,fontFace:"Meiryo",color:"666666",align:"center"}),_.addText(new Date().toLocaleDateString("ja-JP"),{x:.5,y:4.5,w:"90%",h:.5,fontSize:14,fontFace:"Meiryo",color:"999999",align:"center"});const w=e.addSlide();w.addText(r.title||"チャート",{x:.5,y:.3,w:"90%",h:.5,fontSize:24,fontFace:"Meiryo",color:d,bold:!0});const I={bar:e.ChartType.bar,line:e.ChartType.line,pie:e.ChartType.pie,area:e.ChartType.area,scatter:e.ChartType.scatter}[v]||e.ChartType.bar;let N=[];if(y)[...new Set(n.map(f=>f[y]))].forEach(f=>{const D=p.map(P=>{const j=n.filter(E=>E[l]===P&&E[y]===f);return q(j,u,m)});N.push({name:String(f),labels:p.map(P=>String(P)),values:D})});else{const k=p.map(f=>{const D=n.filter(P=>P[l]===f);return q(D,u,m)});N.push({name:`${u}（${Y(m)}）`,labels:p.map(f=>String(f)),values:k})}const Z=["005BAB","FF961C","28A745","DC3545","6F42C1","17A2B8","FFC107","6C757D","343A40","007BFF"],$={x:.5,y:1,w:9,h:5.5,chartColors:N.map((k,f)=>Z[f%Z.length]),showTitle:!1,showLegend:N.length>1,legendPos:"b",catAxisTitle:l,valAxisTitle:u,catAxisLabelFontSize:10,valAxisLabelFontSize:10,dataLabelFontSize:8,showValue:v==="pie",showPercent:v==="pie"};if(v==="bar"&&($.barDir="col",$.barGapWidthPct=50,$.catGridLine={style:"none"},$.valGridLine={color:"D9D9D9",style:"solid",size:.5}),v==="line"&&($.lineSmooth=!1,$.lineDataSymbol="circle",$.lineDataSymbolSize=6,$.catGridLine={style:"none"},$.valGridLine={color:"D9D9D9",style:"solid",size:.5}),v==="scatter"){const k=p.map(f=>{const D=n.filter(P=>P[l]===f);return{x:parseFloat(f)||0,y:q(D,u,m)}});N=[{name:u,values:k.map(f=>f.y)}],$.catAxisLabelPos="low"}try{w.addChart(I,N,$)}catch(k){console.error("Chart creation error:",k),w.addText("チャートの作成中にエラーが発生しました",{x:.5,y:3,w:9,h:1,fontSize:14,color:"CC0000",align:"center"})}const B=e.addSlide();if(B.addText("集計データ",{x:.5,y:.3,w:"90%",h:.5,fontSize:24,fontFace:"Meiryo",color:d,bold:!0}),y){const k=[...new Set(n.map(D=>D[y]))],f=[[l,...k]];p.slice(0,15).forEach(D=>{const P=[String(D)];k.forEach(j=>{const E=n.filter(W=>W[l]===D&&W[y]===j),X=q(E,u,m);P.push(String(X))}),f.push(P)}),B.addTable(f,{x:.5,y:1,w:9,fontFace:"Meiryo",fontSize:10,color:"333333",border:{pt:.5,color:"CCCCCC"},fill:{color:"FFFFFF"},colW:Array(k.length+1).fill(9/(k.length+1)),rowH:.4,autoPage:!0,firstRow:{fill:{color:d},color:"FFFFFF",bold:!0}})}else{const k=[[l,`${u}（${Y(m)}）`]];p.slice(0,20).forEach(f=>{const D=n.filter(j=>j[l]===f),P=q(D,u,m);k.push([String(f),String(P)])}),B.addTable(k,{x:.5,y:1,w:9,fontFace:"Meiryo",fontSize:12,color:"333333",border:{pt:.5,color:"CCCCCC"},fill:{color:"FFFFFF"},colW:[4.5,4.5],rowH:.4,autoPage:!0,firstRow:{fill:{color:d},color:"FFFFFF",bold:!0}})}B.addText(`データ件数: ${n.length}件  |  集計方法: ${Y(m)}  |  ※チャートは編集可能です`,{x:.5,y:6.5,w:9,h:.3,fontSize:10,fontFace:"Meiryo",color:"999999"}),e.writeFile({fileName:`${x}.pptx`})}function ae(r,n,v){if(r.length===0)return 0;switch(v){case"count":return r.length;case"sum":return r.reduce((e,d)=>e+(Number(d[n])||0),0);case"avg":const x=r.reduce((e,d)=>e+(Number(d[n])||0),0);return r.length>0?Math.round(x/r.length*100)/100:0;case"max":return Math.max(...r.map(e=>Number(e[n])||0));case"min":return Math.min(...r.map(e=>Number(e[n])||0));default:return r.reduce((e,d)=>e+(Number(d[n])||0),0)}}function be(r,n){const{xAxis:v,yAxis:x,aggregation:e="sum",groupBy:d=""}=r,l=[...new Set(n.map(u=>u[v]))];if(d){const m=[...new Set(n.map(y=>y[d]))].map(y=>{const p=l.map(_=>{const w=n.filter(A=>A[v]===_&&A[d]===y);return ae(w,x,e)});return{name:String(y),values:p}});return{categories:l.map(String),series:m}}else{const u=l.map(m=>{const y=n.filter(p=>p[v]===m);return ae(y,x,e)});return{categories:l.map(String),series:[{name:x,values:u}]}}}function L(r){let n="";for(;r>=0;)n=String.fromCharCode(65+r%26)+n,r=Math.floor(r/26)-1;return n}function we(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`}function ke(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`}function Ce(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`}function Fe(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="データ" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`}function _e(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
</styleSheet>`}function Ae(r){const n=r.map(v=>`<si><t>${String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</t></si>`);return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${r.length}" uniqueCount="${r.length}">
${n.join(`
`)}
</sst>`}function Te(r){const{categories:n,series:v}=r,x=[],e=['<c r="A1" t="s" s="1"><v>0</v></c>'];return v.forEach((d,l)=>{e.push(`<c r="${L(l+1)}1" t="s" s="1"><v>${l+1}</v></c>`)}),x.push(`<row r="1">${e.join("")}</row>`),n.forEach((d,l)=>{const u=[`<c r="A${l+2}" t="s" s="2"><v>${v.length+1+l}</v></c>`];v.forEach((m,y)=>{u.push(`<c r="${L(y+1)}${l+2}" s="2"><v>${m.values[l]}</v></c>`)}),x.push(`<row r="${l+2}">${u.join("")}</row>`)}),L(v.length),n.length+1,`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0"/>
  </sheetViews>
  <sheetData>
${x.join(`
`)}
  </sheetData>
  <drawing r:id="rId1"/>
</worksheet>`}function De(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`}function Pe(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
</xdr:wsDr>`}function $e(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
</Relationships>`}function Se(r,n,v){const{categories:x,series:e}=r,d=x.length+1,l=e.map((y,p)=>{const _=`データ!$A$2:$A$${d}`,w=`データ!$${L(p+1)}$2:$${L(p+1)}$${d}`,A=["005BAB","FF961C","4CAF50","E91E63","9C27B0","00BCD4","FF5722","795548"],I=A[p%A.length];return n==="pie"?`
      <c:ser>
        <c:idx val="${p}"/>
        <c:order val="${p}"/>
        <c:tx><c:strRef><c:f>データ!$${L(p+1)}$1</c:f></c:strRef></c:tx>
        <c:cat><c:strRef><c:f>${_}</c:f></c:strRef></c:cat>
        <c:val><c:numRef><c:f>${w}</c:f></c:numRef></c:val>
      </c:ser>`:n==="scatter"?`
      <c:ser>
        <c:idx val="${p}"/>
        <c:order val="${p}"/>
        <c:tx><c:strRef><c:f>データ!$${L(p+1)}$1</c:f></c:strRef></c:tx>
        <c:spPr>
          <a:solidFill><a:srgbClr val="${I}"/></a:solidFill>
        </c:spPr>
        <c:xVal><c:numRef><c:f>データ!$A$2:$A$${d}</c:f></c:numRef></c:xVal>
        <c:yVal><c:numRef><c:f>${w}</c:f></c:numRef></c:yVal>
      </c:ser>`:`
      <c:ser>
        <c:idx val="${p}"/>
        <c:order val="${p}"/>
        <c:tx><c:strRef><c:f>データ!$${L(p+1)}$1</c:f></c:strRef></c:tx>
        <c:spPr>
          <a:solidFill><a:srgbClr val="${I}"/></a:solidFill>
        </c:spPr>
        <c:cat><c:strRef><c:f>${_}</c:f></c:strRef></c:cat>
        <c:val><c:numRef><c:f>${w}</c:f></c:numRef></c:val>
      </c:ser>`}).join("");let u="";return n==="pie"?u=`
    <c:pieChart>
      <c:varyColors val="1"/>
      ${l}
    </c:pieChart>`:n==="line"?u=`
    <c:lineChart>
      <c:grouping val="standard"/>
      ${l}
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
    </c:valAx>`:n==="area"?u=`
    <c:areaChart>
      <c:grouping val="standard"/>
      ${l}
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
    </c:valAx>`:n==="scatter"?u=`
    <c:scatterChart>
      <c:scatterStyle val="lineMarker"/>
      ${l}
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
    </c:valAx>`:u=`
    <c:barChart>
      <c:barDir val="col"/>
      <c:grouping val="clustered"/>
      ${l}
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
    </c:valAx>`,`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
              <a:t>${(v||"チャート").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</a:t>
            </a:r>
          </a:p>
        </c:rich>
      </c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:plotArea>
      <c:layout/>
      ${u}
    </c:plotArea>
    <c:legend>
      <c:legendPos val="r"/>
      <c:overlay val="0"/>
    </c:legend>
  </c:chart>
</c:chartSpace>`}async function Me(r,n,v="bar",x="chart_export"){const e=be(r,n),{categories:d,series:l}=e,u=[r.xAxis||"カテゴリ",...l.map(w=>w.name),...d],m=new ge;m.file("[Content_Types].xml",we()),m.file("_rels/.rels",ke()),m.file("xl/_rels/workbook.xml.rels",Ce()),m.file("xl/workbook.xml",Fe()),m.file("xl/styles.xml",_e()),m.file("xl/sharedStrings.xml",Ae(u)),m.file("xl/worksheets/sheet1.xml",Te(e)),m.file("xl/worksheets/_rels/sheet1.xml.rels",De()),m.file("xl/drawings/drawing1.xml",Pe()),m.file("xl/drawings/_rels/drawing1.xml.rels",$e()),m.file("xl/charts/chart1.xml",Se(e,v,r.title));const y=await m.generateAsync({type:"blob",compression:"DEFLATE"}),p=URL.createObjectURL(y),_=document.createElement("a");_.href=p,_.download=`${x}.xlsx`,_.click(),URL.revokeObjectURL(p)}const Re={class:"flex flex-col lg:flex-row gap-6"},Ue={class:"lg:w-80 flex-shrink-0 space-y-4"},Ne={class:"bg-white rounded-lg shadow-md p-4"},Ve={key:0,class:"text-sm"},Le={class:"font-medium text-primary-600"},Ie={class:"text-gray-500"},je={key:1,class:"text-gray-500 text-sm"},Be={key:0,class:"bg-white rounded-lg shadow-md p-4"},Ee={class:"space-y-3"},ze={class:"block text-sm font-medium text-gray-700 mb-1"},Oe=["value"],Ge={key:0},qe=["value"],Ze={class:"block text-sm font-medium text-gray-700 mb-1"},We=["value"],Je={key:1},Xe={key:2},He=["value"],Ye={key:3},Ke={key:4,class:"space-y-3 p-3 bg-gray-50 rounded-lg"},Qe=["value"],et={key:5},tt={key:6,class:"flex items-center"},at={key:1,class:"bg-white rounded-lg shadow-md p-4"},ot={class:"space-y-3"},lt={class:"flex items-center justify-between mb-2"},st=["onUpdate:modelValue","onChange"],nt=["value"],rt=["onClick"],it={key:0,class:"space-y-2"},ct=["onUpdate:modelValue"],ut={key:0},dt={key:0,class:"flex items-center space-x-2"},pt=["onUpdate:modelValue"],mt=["onUpdate:modelValue"],xt={key:1,class:"flex items-center space-x-2"},vt=["onUpdate:modelValue","placeholder"],gt={key:0,class:"relative"},ft=["onChange"],ht=["value"],yt={class:"text-xs text-gray-500 mt-1 bg-white px-2 py-1 rounded border"},bt={class:"font-medium text-primary-600"},wt={class:"mx-1"},kt={key:0,class:"text-accent-600"},Ct={key:0,class:"text-xs text-gray-500 border-t pt-2 mt-2"},Ft={class:"text-primary-600 font-medium"},_t={class:"text-accent-600 font-medium"},At={key:2,class:"bg-white rounded-lg shadow-md p-4"},Tt={class:"flex-1"},Dt={class:"bg-white rounded-lg shadow-md p-4 mb-6"},Pt={key:0,class:"text-center py-16 text-gray-500"},$t={key:1,class:"text-center py-16 text-gray-500"},St={key:0,class:"bg-white rounded-lg shadow-md p-4"},Mt={class:"flex items-center justify-between mb-3"},Rt={class:"text-sm text-gray-500"},Ut={class:"overflow-x-auto max-h-64 overflow-y-auto"},Nt={class:"data-table"},Vt={class:"sticky top-0"},Ot={__name:"AnalysisView",setup(r){const n=de(),v=H(null);let x=null;const e=H({type:"bar",xAxis:"",yAxis:"",lineAxis:"",title:"",aggregation:"sum",lineAggregation:"sum",groupBy:"",stackMode:"none",sortBy:"none",enableZoom:!1,xAxisDateUnit:"none"}),d=H([]),l=O(()=>n.activeDataset),u=O(()=>{var s;return((s=l.value)==null?void 0:s.columns)||[]}),m=O(()=>d.value.filter(s=>s.column&&(["is_empty","is_not_empty"].includes(s.operator)||(s.operator==="between"?s.value||s.value2:s.value))).length);function y(s,t){const b=String(s??""),o=parseFloat(s),C=t.value??"",g=t.value2??"",U=parseFloat(C),Q=parseFloat(g);switch(t.operator){case"equals":return b===C;case"not_equals":return b!==C;case"contains":return b.toLowerCase().includes(C.toLowerCase());case"not_contains":return!b.toLowerCase().includes(C.toLowerCase());case"starts_with":return b.toLowerCase().startsWith(C.toLowerCase());case"ends_with":return b.toLowerCase().endsWith(C.toLowerCase());case"greater_than":return!isNaN(o)&&!isNaN(U)&&o>U;case"greater_or_equal":return!isNaN(o)&&!isNaN(U)&&o>=U;case"less_than":return!isNaN(o)&&!isNaN(U)&&o<U;case"less_or_equal":return!isNaN(o)&&!isNaN(U)&&o<=U;case"between":return!isNaN(o)&&!isNaN(U)&&!isNaN(Q)&&o>=U&&o<=Q;case"is_empty":return s==null||b.trim()==="";case"is_not_empty":return s!=null&&b.trim()!=="";default:return!0}}const p=O(()=>{if(!l.value)return[];let s=[...l.value.data];return d.value.forEach(t=>{if(!t.column)return;const b=!["is_empty","is_not_empty"].includes(t.operator),o=t.operator==="between"?t.value||t.value2:t.value;b&&!o||(s=s.filter(C=>y(C[t.column],t)))}),s}),_=O(()=>p.value.slice(0,100));function w(s){var t;return(t=l.value)!=null&&t.types?l.value.types[s]==="date":!1}const A=O(()=>{let s=p.value;return e.value.xAxisDateUnit&&e.value.xAxisDateUnit!=="none"&&e.value.xAxis&&(s=pe(s,e.value.xAxis,e.value.xAxisDateUnit)),s});function I(s){if(!l.value)return[];const t=l.value.data.map(b=>b[s]);return[...new Set(t)].filter(b=>b!==null&&b!=="").slice(0,100)}function N(){d.value.push({column:"",operator:"contains",value:"",value2:""})}function Z(s){d.value.splice(s,1)}function $(s){s.value="",s.value2=""}function B(s){return{equals:"が",not_equals:"が",contains:"が",not_contains:"が",starts_with:"が",ends_with:"が",greater_than:"が",greater_or_equal:"が",less_than:"が",less_or_equal:"が",between:"が",is_empty:"が空である",is_not_empty:"が空でない"}[s]||"が"}function k(s){return{equals:"完全一致する値を入力",not_equals:"除外する値を入力",contains:"含む文字列を入力",not_contains:"含まない文字列を入力",starts_with:"先頭の文字列を入力",ends_with:"末尾の文字列を入力",greater_than:"基準値を入力",greater_or_equal:"基準値を入力",less_than:"基準値を入力",less_or_equal:"基準値を入力"}[s]||"値を入力"}function f(s,t){const b=String(s);return b.length>t?b.substring(0,t)+"...":b}function D(s){return s==null?"-":s instanceof Date?s.toLocaleDateString("ja-JP"):typeof s=="number"?s.toLocaleString("ja-JP"):String(s)}function P(){if(!v.value||!l.value||!e.value.xAxis||!e.value.yAxis)return;x||(x=fe(v.value));const s={xAxis:e.value.xAxis,yAxis:e.value.yAxis,category:e.value.xAxis,value:e.value.yAxis,barAxis:e.value.yAxis,lineAxis:e.value.lineAxis||e.value.yAxis,title:e.value.title,aggregation:e.value.aggregation,lineAggregation:e.value.lineAggregation,groupBy:e.value.groupBy,stackMode:e.value.stackMode,sortBy:e.value.sortBy,enableZoom:e.value.enableZoom},t=xe(e.value.type,s,A.value);x.setOption(t,!0)}function j(){if(!x)return;const s=x.getDataURL({type:"png",pixelRatio:2,backgroundColor:"#fff"}),t=document.createElement("a");t.href=s,t.download=`chart_${Date.now()}.png`,t.click()}async function E(){if(!e.value.xAxis||!e.value.yAxis){alert("チャート設定を完了してください");return}await Me(e.value,A.value,e.value.type,`chart_export_${Date.now()}`)}function X(){l.value&&he(p.value,u.value,`data_${Date.now()}`)}function W(){if(!e.value.xAxis||!e.value.yAxis){alert("チャート設定を完了してください");return}ye(e.value,p.value,e.value.type,`chart_${Date.now()}`)}function K(){x==null||x.resize()}let z=null;function oe(){z&&clearTimeout(z),z=setTimeout(()=>{ue(P),z=null},100)}return le([e,A],()=>{oe()},{deep:!0}),se(()=>{window.addEventListener("resize",K),l.value&&u.value.length>0&&(e.value.xAxis=u.value[0],u.value.length>1&&(e.value.yAxis=u.value[1]))}),ne(()=>{window.removeEventListener("resize",K),z&&clearTimeout(z),x==null||x.dispose()}),(s,t)=>{const b=re("router-link");return c(),i("div",Re,[a("aside",Ue,[a("div",Ne,[t[13]||(t[13]=a("h3",{class:"font-semibold text-gray-800 mb-3"},"データソース",-1)),l.value?(c(),i("div",Ve,[a("p",Le,h(l.value.name),1),a("p",Ie,h(l.value.rowCount)+"行 × "+h(l.value.columns.length)+"列",1)])):(c(),i("div",je,[ee(b,{to:"/",class:"text-primary-500 hover:underline"},{default:te(()=>[...t[12]||(t[12]=[V(" データをアップロード ",-1)])]),_:1})]))]),l.value?(c(),i("div",Be,[t[33]||(t[33]=a("h3",{class:"font-semibold text-gray-800 mb-3"},"チャート設定",-1)),a("div",Ee,[a("div",null,[t[15]||(t[15]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"チャート種別",-1)),F(a("select",{"onUpdate:modelValue":t[0]||(t[0]=o=>e.value.type=o),class:"select-box"},[...t[14]||(t[14]=[G('<option value="bar">棒グラフ</option><option value="line">折れ線グラフ</option><option value="pie">円グラフ</option><option value="scatter">散布図</option><option value="area">面グラフ</option><option value="combo">組合せチャート</option>',6)])],512),[[S,e.value.type]])]),a("div",null,[a("label",ze,h(e.value.type==="pie"?"カテゴリ":"X軸"),1),F(a("select",{"onUpdate:modelValue":t[1]||(t[1]=o=>e.value.xAxis=o),class:"select-box"},[t[16]||(t[16]=a("option",{value:""},"選択してください",-1)),(c(!0),i(M,null,R(u.value,o=>(c(),i("option",{key:o,value:o},h(o),9,Oe))),128))],512),[[S,e.value.xAxis]])]),e.value.xAxis&&w(e.value.xAxis)?(c(),i("div",Ge,[t[17]||(t[17]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},[V(" 日付単位 "),a("span",{class:"text-xs text-gray-500"},"（時系列集計）")],-1)),F(a("select",{"onUpdate:modelValue":t[2]||(t[2]=o=>e.value.xAxisDateUnit=o),class:"select-box"},[(c(!0),i(M,null,R(ie(me),(o,C)=>(c(),i("option",{key:C,value:C},h(o),9,qe))),128))],512),[[S,e.value.xAxisDateUnit]])])):T("",!0),a("div",null,[a("label",Ze,h(e.value.type==="pie"?"値":"Y軸"),1),F(a("select",{"onUpdate:modelValue":t[3]||(t[3]=o=>e.value.yAxis=o),class:"select-box"},[t[18]||(t[18]=a("option",{value:""},"選択してください",-1)),(c(!0),i(M,null,R(u.value,o=>(c(),i("option",{key:o,value:o},h(o),9,We))),128))],512),[[S,e.value.yAxis]])]),e.value.type!=="scatter"?(c(),i("div",Je,[t[20]||(t[20]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"集計方法",-1)),F(a("select",{"onUpdate:modelValue":t[4]||(t[4]=o=>e.value.aggregation=o),class:"select-box"},[...t[19]||(t[19]=[G('<option value="sum">合計</option><option value="count">カウント</option><option value="avg">平均</option><option value="max">最大</option><option value="min">最小</option><option value="distinct">ユニーク数</option>',6)])],512),[[S,e.value.aggregation]])])):T("",!0),e.value.type==="bar"||e.value.type==="line"||e.value.type==="area"?(c(),i("div",Xe,[t[22]||(t[22]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},[V(" グループ化 "),a("span",{class:"text-xs text-gray-500"},"（系列分割）")],-1)),F(a("select",{"onUpdate:modelValue":t[5]||(t[5]=o=>e.value.groupBy=o),class:"select-box"},[t[21]||(t[21]=a("option",{value:""},"なし",-1)),(c(!0),i(M,null,R(u.value.filter(o=>o!==e.value.xAxis),o=>(c(),i("option",{key:o,value:o},h(o),9,He))),128))],512),[[S,e.value.groupBy]])])):T("",!0),e.value.type==="bar"&&e.value.groupBy?(c(),i("div",Ye,[t[24]||(t[24]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"表示モード",-1)),F(a("select",{"onUpdate:modelValue":t[6]||(t[6]=o=>e.value.stackMode=o),class:"select-box"},[...t[23]||(t[23]=[a("option",{value:"none"},"並列（グループ化）",-1),a("option",{value:"stacked"},"積み上げ",-1),a("option",{value:"percent"},"100%積み上げ",-1)])],512),[[S,e.value.stackMode]])])):T("",!0),e.value.type==="combo"?(c(),i("div",Ke,[a("div",null,[t[26]||(t[26]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"折れ線（Y軸2）",-1)),F(a("select",{"onUpdate:modelValue":t[7]||(t[7]=o=>e.value.lineAxis=o),class:"select-box"},[t[25]||(t[25]=a("option",{value:""},"選択してください",-1)),(c(!0),i(M,null,R(u.value,o=>(c(),i("option",{key:o,value:o},h(o),9,Qe))),128))],512),[[S,e.value.lineAxis]])]),a("div",null,[t[28]||(t[28]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"折れ線の集計方法",-1)),F(a("select",{"onUpdate:modelValue":t[8]||(t[8]=o=>e.value.lineAggregation=o),class:"select-box"},[...t[27]||(t[27]=[G('<option value="sum">合計</option><option value="count">カウント</option><option value="avg">平均</option><option value="max">最大</option><option value="min">最小</option>',5)])],512),[[S,e.value.lineAggregation]])])])):T("",!0),e.value.type!=="pie"&&e.value.type!=="scatter"&&!e.value.groupBy?(c(),i("div",et,[t[30]||(t[30]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"並び順",-1)),F(a("select",{"onUpdate:modelValue":t[9]||(t[9]=o=>e.value.sortBy=o),class:"select-box"},[...t[29]||(t[29]=[G('<option value="none">データ順</option><option value="value_desc">値（大→小）</option><option value="value_asc">値（小→大）</option><option value="label_asc">ラベル（昇順）</option><option value="label_desc">ラベル（降順）</option>',5)])],512),[[S,e.value.sortBy]])])):T("",!0),e.value.type!=="pie"&&e.value.type!=="scatter"?(c(),i("div",tt,[F(a("input",{type:"checkbox",id:"enableZoom","onUpdate:modelValue":t[10]||(t[10]=o=>e.value.enableZoom=o),class:"h-4 w-4 text-primary-600 border-gray-300 rounded"},null,512),[[ce,e.value.enableZoom]]),t[31]||(t[31]=a("label",{for:"enableZoom",class:"ml-2 text-sm text-gray-700"},"ズーム有効",-1))])):T("",!0),a("div",null,[t[32]||(t[32]=a("label",{class:"block text-sm font-medium text-gray-700 mb-1"},"タイトル",-1)),F(a("input",{"onUpdate:modelValue":t[11]||(t[11]=o=>e.value.title=o),type:"text",class:"select-box",placeholder:"チャートタイトル（自動生成）"},null,512),[[J,e.value.title]])])])])):T("",!0),l.value?(c(),i("div",at,[t[41]||(t[41]=a("h3",{class:"font-semibold text-gray-800 mb-3"},[V(" 条件付きフィルター "),a("span",{class:"text-xs text-gray-500 font-normal ml-1"},"（Excel風）")],-1)),a("div",ot,[(c(!0),i(M,null,R(d.value,(o,C)=>(c(),i("div",{key:C,class:"border border-gray-200 rounded-lg p-3 bg-gray-50"},[a("div",lt,[F(a("select",{"onUpdate:modelValue":g=>o.column=g,onChange:g=>$(o),class:"select-box text-sm flex-1 mr-2"},[t[34]||(t[34]=a("option",{value:""},"カラム選択",-1)),(c(!0),i(M,null,R(u.value,g=>(c(),i("option",{key:g,value:g},h(g),9,nt))),128))],40,st),[[S,o.column]]),a("button",{onClick:g=>Z(C),class:"text-red-500 hover:text-red-700 p-1"},[...t[35]||(t[35]=[a("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[a("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])],8,rt)]),o.column?(c(),i("div",it,[F(a("select",{"onUpdate:modelValue":g=>o.operator=g,class:"select-box text-sm"},[...t[36]||(t[36]=[G('<optgroup label="テキスト条件"><option value="equals">と等しい</option><option value="not_equals">と等しくない</option><option value="contains">を含む</option><option value="not_contains">を含まない</option><option value="starts_with">で始まる</option><option value="ends_with">で終わる</option></optgroup><optgroup label="数値条件"><option value="greater_than">より大きい</option><option value="greater_or_equal">以上</option><option value="less_than">より小さい</option><option value="less_or_equal">以下</option><option value="between">範囲内</option></optgroup><optgroup label="その他"><option value="is_empty">空である</option><option value="is_not_empty">空でない</option></optgroup>',3)])],8,ct),[[S,o.operator]]),["is_empty","is_not_empty"].includes(o.operator)?T("",!0):(c(),i("div",ut,[o.operator==="between"?(c(),i("div",dt,[F(a("input",{"onUpdate:modelValue":g=>o.value=g,type:"text",class:"select-box text-sm flex-1",placeholder:"最小値"},null,8,pt),[[J,o.value]]),t[37]||(t[37]=a("span",{class:"text-gray-500 text-sm"},"〜",-1)),F(a("input",{"onUpdate:modelValue":g=>o.value2=g,type:"text",class:"select-box text-sm flex-1",placeholder:"最大値"},null,8,mt),[[J,o.value2]])])):(c(),i("div",xt,[F(a("input",{"onUpdate:modelValue":g=>o.value=g,type:"text",class:"select-box text-sm flex-1",placeholder:k(o.operator)},null,8,vt),[[J,o.value]]),I(o.column).length>0?(c(),i("div",gt,[a("select",{onChange:g=>{o.value=g.target.value,g.target.value=""},class:"select-box text-sm w-24",title:"候補から選択"},[t[38]||(t[38]=a("option",{value:""},"候補",-1)),(c(!0),i(M,null,R(I(o.column).slice(0,20),g=>(c(),i("option",{key:g,value:g},h(f(g,15)),9,ht))),128))],40,ft)])):T("",!0)]))])),a("div",yt,[a("span",bt,h(o.column),1),a("span",wt,h(B(o.operator)),1),["is_empty","is_not_empty"].includes(o.operator)?T("",!0):(c(),i("span",kt," 「"+h(o.value||"...")+h(o.operator==="between"?` 〜 ${o.value2||"..."}`:"")+"」 ",1))])])):T("",!0)]))),128)),a("button",{onClick:N,class:"text-sm text-primary-500 hover:text-primary-700 flex items-center"},[...t[39]||(t[39]=[a("svg",{class:"w-4 h-4 mr-1",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[a("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 4v16m8-8H4"})],-1),V(" 条件を追加 ",-1)])]),m.value>0?(c(),i("div",Ct,[a("span",Ft,h(m.value)+"件",1),t[40]||(t[40]=V("の条件で ",-1)),a("span",_t,h(p.value.length),1),V(" / "+h(l.value.rowCount)+"行 に絞り込み ",1)])):T("",!0)])])):T("",!0),l.value?(c(),i("div",At,[t[42]||(t[42]=a("h3",{class:"font-semibold text-gray-800 mb-3"},"エクスポート",-1)),a("div",{class:"space-y-2"},[a("button",{onClick:j,class:"btn-primary w-full text-sm"}," PNG画像として保存 "),a("button",{onClick:W,class:"btn-accent w-full text-sm"}," PowerPointに出力 "),a("button",{onClick:E,class:"btn-secondary w-full text-sm"}," 集計データをExcel出力 "),a("button",{onClick:X,class:"btn-secondary w-full text-sm"}," フィルタ済みデータをCSV出力 ")])])):T("",!0)]),a("main",Tt,[a("div",Dt,[l.value?!e.value.xAxis||!e.value.yAxis?(c(),i("div",$t,[...t[45]||(t[45]=[a("p",null,"左のパネルでチャート設定を行ってください",-1)])])):(c(),i("div",{key:2,ref_key:"chartContainer",ref:v,class:"w-full",style:{height:"450px"}},null,512)):(c(),i("div",Pt,[t[44]||(t[44]=a("p",null,"データをアップロードしてください",-1)),ee(b,{to:"/",class:"text-primary-500 hover:underline mt-2 inline-block"},{default:te(()=>[...t[43]||(t[43]=[V(" ホームに戻る ",-1)])]),_:1})]))]),l.value?(c(),i("div",St,[a("div",Mt,[t[46]||(t[46]=a("h3",{class:"font-semibold text-gray-800"},"データプレビュー",-1)),a("span",Rt,h(p.value.length)+" / "+h(l.value.rowCount)+" 行 ",1)]),a("div",Ut,[a("table",Nt,[a("thead",Vt,[a("tr",null,[(c(!0),i(M,null,R(u.value,o=>(c(),i("th",{key:o},h(o),1))),128))])]),a("tbody",null,[(c(!0),i(M,null,R(_.value,(o,C)=>(c(),i("tr",{key:C},[(c(!0),i(M,null,R(u.value,g=>(c(),i("td",{key:g},h(D(o[g])),1))),128))]))),128))])])])])):T("",!0)])])}}};export{Ot as default};
