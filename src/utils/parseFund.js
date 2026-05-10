import * as XLSX from 'xlsx'
import { safeNum } from './constants.js'

function extractBaseName(name) {
  let n = String(name)
  n = n.replace(/종류[A-Za-z가-힣\-]+.*/g, '')
  n = n.replace(/Class[A-Za-z\-]+.*/g, '')
  n = n.replace(/\([A-Z]\).*/g, '')
  n = n.replace(/\s+[A-Z]\s+클래스.*/g, '')
  n = n.replace(/\s+[A-Z][0-9]?\s*$/g, '')
  n = n.replace(/\s+C[0-9]\s*$/g, '')
  return n.trim()
}

const EXCLUDE = ['레버리지','인버스','2배','2X','2x','-1x','-2x','Short','Bear']

export function parseFundWorkbook(buffer) {
  const wb  = XLSX.read(new Uint8Array(buffer), { type:'array' })
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' })
  if (!raw.length) throw new Error('데이터가 없습니다')
  const hdr = raw[0]; const idx = {}
  hdr.forEach((h,i) => { if(h) idx[h]=i })

  const groupMap = new Map()
  raw.slice(2).forEach(r => {
    if (!r[idx['펀드코드']]) return
    const rawName = r[idx['펀드명']] || ''
    const cat2    = r[idx['펀드 소유형']] || ''
    const text    = (rawName + ' ' + cat2).toLowerCase()
    if (EXCLUDE.some(k => text.includes(k.toLowerCase()))) return

    const baseName = extractBaseName(rawName)
    const cat1     = r[idx['펀드 대유형']] || '기타'
    const mgr      = r[idx['운용사명']] || ''
    const key      = `${baseName}||${cat1}||${mgr}`

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        name:baseName, cat1, cat2, mgr,
        pension:r[idx['연금']]||'', risk:r[idx['위험등급']]||'',
        fee:safeNum(r[idx['총보수(%)']]), settleDate:r[idx['설정일']]||'',
        aum:0, classCount:0,
        _r:{ w1:[],m1:[],m3:[],m6:[],ytd:[],y1:[],y3:[] },
      })
    }
    const g = groupMap.get(key)
    g.aum += safeNum(r[idx['운용규모(억원)']]) || 0
    g.classCount++
    const push = (k, col) => { const v = safeNum(r[idx[col]]); if(v!==0||r[idx[col]]!=='') g._r[k].push(v) }
    push('w1','1주(%)'); push('m1','1개월(%)'); push('m3','3개월(%)')
    push('m6','6개월(%)'); push('ytd','연초후(%)'); push('y1','1년(%)'); push('y3','3년(%)')
  })

  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null
  const result = []
  groupMap.forEach(g => {
    result.push({
      name:g.name, cat1:g.cat1, cat2:g.cat2, mgr:g.mgr,
      pension:g.pension, risk:g.risk, fee:g.fee, settleDate:g.settleDate,
      aum:g.aum, classCount:g.classCount,
      w1:avg(g._r.w1), m1:avg(g._r.m1), m3:avg(g._r.m3),
      m6:avg(g._r.m6), ytd:avg(g._r.ytd), y1:avg(g._r.y1), y3:avg(g._r.y3),
    })
  })
  if (!result.length) throw new Error('파싱된 펀드 데이터가 없습니다')
  return result
}
