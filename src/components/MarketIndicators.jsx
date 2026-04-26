import React, { useState, useEffect, useCallback } from 'react'
import styles from './MarketIndicators.module.css'

/**
 * 주요 지표 현황
 * - 구글 파이낸스 RSS / 야후 파이낸스 API 활용
 * - 매일 오전 6시 자동 업데이트 (Supabase scheduled 또는 브라우저 자동갱신)
 */

const PROXY = 'https://api.allorigins.win/raw?url='

// 지표 설정
const INDICATORS = [
  { id: 'kospi',  label: 'KOSPI',    symbol: '^KS11',  unit: '',    color: '#1A56FF', category: '국내증시' },
  { id: 'kosdaq', label: 'KOSDAQ',   symbol: '^KQ11',  unit: '',    color: '#10B981', category: '국내증시' },
  { id: 'usdkrw', label: '달러/원',  symbol: 'KRW=X',  unit: '원',  color: '#C9A84C', category: '환율' },
  { id: 'jpykrw', label: '엔/원',    symbol: 'JPYKRW=X',unit:'원',  color: '#8B5CF6', category: '환율' },
  { id: 'sp500',  label: 'S&P500',   symbol: '^GSPC',  unit: '',    color: '#F97316', category: '해외증시' },
  { id: 'nasdaq', label: 'NASDAQ',   symbol: '^IXIC',  unit: '',    color: '#EC4899', category: '해외증시' },
  { id: 'gold',   label: '금(온스)', symbol: 'GC=F',   unit: '$',   color: '#C9A84C', category: '원자재' },
  { id: 'oil',    label: 'WTI유가',  symbol: 'CL=F',   unit: '$',   color: '#6366F1', category: '원자재' },
  { id: 'us10y',  label: '미국10년채',symbol: '^TNX',  unit: '%',   color: '#14B8A6', category: '금리' },
  { id: 'vix',    label: 'VIX',      symbol: '^VIX',   unit: '',    color: '#DC2626', category: '변동성' },
]

async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`
  const res = await fetch(PROXY + encodeURIComponent(url), {
    signal: AbortSignal.timeout(8000)
  })
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error('데이터 없음')
  const meta = result.meta
  return {
    price:  meta.regularMarketPrice,
    prev:   meta.previousClose || meta.chartPreviousClose,
    change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose),
    changePct: ((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100,
    time:   new Date(meta.regularMarketTime * 1000).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }),
  }
}

function IndicatorCard({ indicator, data, loading }) {
  const hasData = data && !loading

  const fmtPrice = (v, unit) => {
    if (v == null) return '--'
    if (unit === '원') return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
    if (unit === '$')  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (unit === '%')  return v.toFixed(2) + '%'
    return v.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const isUp = hasData ? data.change >= 0 : null

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardLabel}>{indicator.label}</span>
        <span className={styles.cardCat}>{indicator.category}</span>
      </div>
      {loading ? (
        <div className={styles.loading}><span className="spin">⟳</span></div>
      ) : hasData ? (
        <>
          <div className={`${styles.price} ${isUp ? styles.up : styles.dn}`}>
            {indicator.unit === '$' ? '' : ''}{fmtPrice(data.price, indicator.unit)}
          </div>
          <div className={`${styles.change} ${isUp ? styles.up : styles.dn}`}>
            {isUp ? '▲' : '▼'} {Math.abs(data.change).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            &nbsp;({isUp ? '+' : ''}{data.changePct.toFixed(2)}%)
          </div>
          <div className={styles.time}>{data.time} 기준</div>
          <div className={styles.accent} style={{ background: indicator.color }} />
        </>
      ) : (
        <div className={styles.noData}>--</div>
      )}
    </div>
  )
}

export default function MarketIndicators() {
  const [quotes,    setQuotes]    = useState({})
  const [loading,   setLoading]   = useState(true)
  const [lastUpdate,setLastUpdate]= useState(null)
  const [errors,    setErrors]    = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const results = {}
    const errs = {}

    await Promise.allSettled(
      INDICATORS.map(async (ind) => {
        try {
          results[ind.id] = await fetchYahooQuote(ind.symbol)
        } catch (e) {
          errs[ind.id] = true
        }
      })
    )

    setQuotes(results)
    setErrors(errs)
    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  // 최초 로드
  useEffect(() => { fetchAll() }, [fetchAll])

  // 오전 6시 자동 업데이트 (다음 6시까지 타이머)
  useEffect(() => {
    const getNextSix = () => {
      const now = new Date()
      const next = new Date(now)
      next.setHours(6, 0, 0, 0)
      if (now >= next) next.setDate(next.getDate() + 1)
      return next - now
    }
    const timer = setTimeout(() => {
      fetchAll()
      // 이후 24시간마다 반복
      const interval = setInterval(fetchAll, 24 * 60 * 60 * 1000)
      return () => clearInterval(interval)
    }, getNextSix())
    return () => clearTimeout(timer)
  }, [fetchAll])

  // 카테고리 분류
  const categories = {}
  INDICATORS.forEach(ind => {
    if (!categories[ind.category]) categories[ind.category] = []
    categories[ind.category].push(ind)
  })

  return (
    <div className={styles.wrap}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>📡 실시간 주요 지표</span>
          {lastUpdate && (
            <span className={styles.updateTime}>
              {lastUpdate.toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })} 업데이트
            </span>
          )}
        </div>
        <button className={styles.refreshBtn} onClick={fetchAll} disabled={loading}>
          {loading ? <span className="spin">⟳</span> : '🔄'} 새로고침
        </button>
      </div>

      {/* 지표 카테고리별 */}
      {Object.entries(categories).map(([cat, inds]) => (
        <div key={cat} className={styles.catSection}>
          <div className={styles.catLabel}>{cat}</div>
          <div className={styles.grid}>
            {inds.map(ind => (
              <IndicatorCard
                key={ind.id}
                indicator={ind}
                data={quotes[ind.id]}
                loading={loading && !quotes[ind.id]}
              />
            ))}
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        출처: Yahoo Finance · 시장 상황에 따라 15~20분 지연될 수 있습니다
      </div>
    </div>
  )
}
