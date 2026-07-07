// ── 저작권 ────────────────────────────────────
export const COPYRIGHT = 'ⓒ 2026 신한은행 부천위브더스테이트지점 윤지환 과장. All rights reserved.'
// ── ETF 카테고리 ──────────────────────────────
export const CAT_COLORS = {
  '국내주식': '#10B981',
  '해외주식': '#3B82F6',
  '채권':     '#8B5CF6',
  '자산배분': '#14B8A6',
  '금리':     '#6366F1',
  '원자재':   '#F97316',
  '부동산':   '#EC4899',
  '통화':     '#94A3B8',
  '기타':     '#CBD5E1',
}

export const CAT_CLASS = {
  '국내주식': 'cc-dom',
  '해외주식': 'cc-ovs',
  '채권':     'cc-bond',
  '자산배분': 'cc-alloc',
  '금리':     'cc-rate',
  '원자재':   'cc-cm',
  '부동산':   'cc-real',
  '통화':     'cc-cur',
  '기타':     'cc-etc',
}

export const MGR_COLORS = [
  '#3B82F6','#10B981','#C9A84C',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
]

export const PERIOD_STYLE = {
  w: 'background:#FEF9EE;color:#92400E',
  m: 'background:#EEF3FF;color:#1E40AF',
  q: 'background:#F5F3FF;color:#4C1D95',
}
export const PERIOD_LABEL = { w:'주간', m:'1개월', q:'3개월' }

// ── funetf API ────────────────────────────────
export const FUNETF_URL = 'https://www.funetf.co.kr/api/public/download/excel/etfFilter'
export const PROXY_URL  = 'https://api.allorigins.win/raw?url='

// ── 포맷 헬퍼 ────────────────────────────────
/** 숫자 안전 변환 */
export const safeNum = (v) => {
  try { return v != null && v !== '' ? +v : 0 }
  catch { return 0 }
}

/** 수익률 포맷 (+1.23%) */
export const fmtPct = (v, sign = true) => {
  if (isNaN(v) || v == null) return '--'
  return (sign && v > 0 ? '+' : '') + v.toFixed(2) + '%'
}

/** 운용규모 포맷 (1.2조 / 3.4천억 / 567억) */
export const fmtAum = (v) => {
  if (v >= 10000) return (v / 10000).toFixed(1) + '조'
  if (v >= 1000)  return (v / 1000).toFixed(1) + '천억'
  return v.toFixed(0) + '억'
}
