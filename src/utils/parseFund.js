import * as XLSX from 'xlsx'

/**
 * 펀드명에서 기본명 추출 (종류A, ClassC, (A) 등 제거)
 */
function extractBaseName(name) {
  if (!name) return ''
  let n = String(name)
  // 종류X, ClassX, (A), A 클래스, C1, C-P 등 제거
  n = n.replace(/종류[A-Za-z가-힣\-]+.*/g, '')
  n = n.replace(/Class[A-Za-z\-]+.*/g, '')
  n = n.replace(/\([A-Z]\).*/g, '')
  n = n.replace(/\s+[A-Z]\s+클래스.*/g, '')
  n = n.replace(/\s+[A-Z][0-9]?\s*$/g, '')
  n = n.replace(/\s+[A-Z]\s*클래스.*/g, '')
  n = n.replace(/\s+C[0-9]\s*$/g, '')
  return n.trim()
}

const safeNum = (v) => {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

/**
 * 펀드 엑셀 파싱 + 종류별 합산
 * - 운용규모: SUM
 * - 수익률: MEAN (단순평균)
 */
export function parseFundWorkbook(buffer) {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // 헤더 찾기 (1행)
  const hdr = raw[0]
  const idx = {}
  hdr.forEach((h, i) => { if (h) idx[h] = i })

  // 2행(인덱스1)은 서브헤더 — 건너뜀
  // 레버리지·인버스 제외 (펀드명 또는 소유형 기준)
  const EXCLUDE_KEYWORDS = ['레버리지', '인버스', '2배', '2X', '2x', '-1x', '-2x', 'Short', 'Bear']
  const isExcluded = (name, cat2) => {
    const text = (name + ' ' + cat2).toLowerCase()
    return EXCLUDE_KEYWORDS.some(k => text.includes(k.toLowerCase()))
  }

  const rows = raw.slice(2).filter(r => {
    if (!r[idx['펀드코드']]) return false
    const name = r[idx['펀드명']] || ''
    const cat2 = r[idx['펀드 소유형']] || ''
    return !isExcluded(name, cat2)
  })

  // 기본명 기준 그룹화
  const groupMap = new Map()

  rows.forEach(r => {
    const rawName = r[idx['펀드명']] || ''
    const baseName = extractBaseName(rawName)
    const cat1 = r[idx['펀드 대유형']] || '기타'
    const cat2 = r[idx['펀드 소유형']] || ''
    const mgr  = r[idx['운용사명']] || ''
    const key  = `${baseName}||${cat1}||${mgr}`

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        name: baseName,
        cat1, cat2, mgr,
        pension: r[idx['연금']] || '',
        risk: r[idx['위험등급']] || '',
        fee: safeNum(r[idx['총보수(%)']]),
        settleDate: r[idx['설정일']] || '',
        aum: 0,
        classAum: 0,
        // 수익률 누적
        _ret: { d1:[], w1:[], m1:[], m3:[], m6:[], ytd:[], y1:[], y3:[] },
        classCount: 0,
      })
    }

    const g = groupMap.get(key)
    g.aum      += safeNum(r[idx['운용규모(억원)']]) || 0
    g.classAum += safeNum(r[idx['클래스 설정액(억원)']]) || 0
    g.classCount++

    const push = (key2, col) => {
      const v = safeNum(r[idx[col]])
      if (v !== null) g._ret[key2].push(v)
    }
    push('d1',  '전일대비(%)')
    push('w1',  '1주(%)')
    push('m1',  '1개월(%)')
    push('m3',  '3개월(%)')
    push('m6',  '6개월(%)')
    push('ytd', '연초후(%)')
    push('y1',  '1년(%)')
    push('y3',  '3년(%)')
  })

  // 평균 계산
  const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null

  const result = []
  groupMap.forEach((g) => {
    result.push({
      name: g.name,
      cat1: g.cat1,
      cat2: g.cat2,
      mgr:  g.mgr,
      pension: g.pension,
      risk: g.risk,
      fee:  g.fee,
      settleDate: g.settleDate,
      aum:  g.aum,
      classAum: g.classAum,
      classCount: g.classCount,
      d1:  avg(g._ret.d1),
      w1:  avg(g._ret.w1),
      m1:  avg(g._ret.m1),
      m3:  avg(g._ret.m3),
      m6:  avg(g._ret.m6),
      ytd: avg(g._ret.ytd),
      y1:  avg(g._ret.y1),
      y3:  avg(g._ret.y3),
    })
  })

  if (!result.length) throw new Error('파싱된 펀드 데이터가 없습니다')
  return result
}
