import * as XLSX from 'xlsx'
import { safeNum } from './constants.js'

/**
 * ArrayBuffer → ETF 데이터 배열 파싱
 * 레버리지/인버스 자동 제외
 */
export function parseWorkbook(buffer) {
  const wb  = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  if (!raw.length) throw new Error('데이터가 없습니다')

  // 헤더 인덱스 매핑 (중복 '비율(%)' 처리)
  const hdr = raw[0]
  const idx = {}
  let ratioCount = 0
  hdr.forEach((h, i) => {
    if (h === '비율(%)') {
      ratioCount++
      idx[`ratio${ratioCount}`] = i
    } else if (h) {
      idx[h] = i
    }
  })

  const rows = []
  for (let i = 1; i < raw.length; i++) {
    const r   = raw[i]
    const cat = r[idx['ETF 대유형']] || '기타'

    // 레버리지/인버스 제외
    if (cat === '레버리지/인버스') continue
    if (!r[idx['ETF 종목명']]) continue

    rows.push({
      name: r[idx['ETF 종목명']],
      code: String(r[idx['ETF 단축코드']] || ''),
      cat,
      d1:  safeNum(r[idx['1일(%)']]),
      w1:  safeNum(r[idx['1주(%)']]),
      m1:  safeNum(r[idx['1개월(%)']]),
      m3:  safeNum(r[idx['3개월(%)']]),
      m6:  safeNum(r[idx['6개월(%)']]),
      ytd: safeNum(r[idx['연초후(%)']]),
      y1:  safeNum(r[idx['1년(%)']]),
      fee: safeNum(r[idx['총보수(%)']]),
      aum: safeNum(r[idx['운용규모(억원)']]),
      mgr: r[idx['운용사명']] || '',
      top1: r[idx['TOP 1']] || '',
      t1r:  safeNum(r[idx['ratio1']]),
      top2: r[idx['TOP 2']] || '',
      t2r:  safeNum(r[idx['ratio2']]),
      top3: r[idx['TOP 3']] || '',
      t3r:  safeNum(r[idx['ratio3']]),
    })
  }

  if (!rows.length) throw new Error('파싱된 ETF 데이터가 없습니다')
  return rows
}
