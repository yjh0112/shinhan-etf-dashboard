import React, { useState, useEffect, useCallback } from 'react'
import styles from './MarketIndicators.module.css'

const PROXY = 'https://api.allorigins.win/raw?url='

// ── Yahoo Finance 시세 ────────────────────────────────
async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`
  const res = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) })
  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) throw new Error('no data')
  const price  = meta.regularMarketPrice
  const prev   = meta.previousClose || meta.chartPreviousClose
  const change = price - prev
  return {
    price,
    change,
    changePct: (change / prev) * 100,
    time: new Date(meta.regularMarketTime * 1000)
      .toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  }
}

// ── 지표 그룹 설정 ────────────────────────────────────
const GROUPS = [
  {
    label: '🇰🇷 국내 증시',
    items: [
      { id:'kospi',  label:'KOSPI',   symbol:'^KS11',  unit:'' },
      { id:'kosdaq', label:'KOSDAQ',  symbol:'^KQ11',  unit:'' },
    ],
    color: '#1A56FF',
  },
  {
    label: '🌐 해외 증시',
    items: [
      { id:'sp500',  label:'S&P500',  symbol:'^GSPC',  unit:'' },
      { id:'nasdaq', label:'NASDAQ',  symbol:'^IXIC',  unit:'' },
      { id:'dow',    label:'DOW',     symbol:'^DJI',   unit:'' },
      { id:'nikkei', label:'닛케이',  symbol:'^N225',  unit:'' },
      { id:'sse',    label:'상해종합', symbol:'000001.SS', unit:'' },
      { id:'hsi',    label:'항셍',    symbol:'^HSI',   unit:'' },
    ],
    color: '#10B981',
  },
  {
    label: '💱 환율',
    items: [
      { id:'usdkrw', label:'달러/원', symbol:'KRW=X',    unit:'원' },
      { id:'jpykrw', label:'엔/원',   symbol:'JPYKRW=X', unit:'원' },
      { id:'eurkrw', label:'유로/원', symbol:'EURKRW=X', unit:'원' },
      { id:'cnykrw', label:'위안/원', symbol:'CNYKRW=X', unit:'원' },
    ],
    color: '#C9A84C',
  },
  {
    label: '🛢 원자재',
    items: [
      { id:'gold',   label:'금',    symbol:'GC=F',  unit:'$' },
      { id:'silver', label:'은',    symbol:'SI=F',  unit:'$' },
      { id:'oil',    label:'WTI',   symbol:'CL=F',  unit:'$' },
      { id:'copper', label:'구리',  symbol:'HG=F',  unit:'$' },
      { id:'gas',    label:'천연가스', symbol:'NG=F', unit:'$' },
    ],
    color: '#F97316',
  },
  {
    label: '📈 금리 · 변동성',
    items: [
      { id:'us10y',  label:'미국10년채', symbol:'^TNX',  unit:'%' },
      { id:'us2y',   label:'미국2년채',  symbol:'^IRX',  unit:'%' },
      { id:'vix',    label:'VIX',        symbol:'^VIX',  unit:'' },
      { id:'spfut',  label:'S&P선물',    symbol:'ES=F',  unit:'' },
    ],
    color: '#8B5CF6',
  },
]

// ── 지표 카드 ────────────────────────────────────────
function QuoteCard({ item, data, loading, color }) {
  const fmtPrice = (v, unit) => {
    if (v == null) return '--'
    if (unit === '원') return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
    if (unit === '$')  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (unit === '%')  return v.toFixed(3) + '%'
    return v.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const isUp = data ? data.change >= 0 : null

  return (
    <div className={styles.qCard}>
      <div className={styles.qLabel}>{item.label}</div>
      {loading ? (
        <div className={styles.qLoading}><span className="spin">⟳</span></div>
      ) : data ? (
        <>
          <div className={`${styles.qPrice} ${isUp ? styles.up : styles.dn}`}>
            {fmtPrice(data.price, item.unit)}
          </div>
          <div className={`${styles.qChange} ${isUp ? styles.up : styles.dn}`}>
            {isUp ? '▲' : '▼'} {Math.abs(data.changePct).toFixed(2)}%
          </div>
          <div className={styles.qTime}>{data.time}</div>
        </>
      ) : (
        <div className={styles.qError}>--</div>
      )}
      <div className={styles.qAccent} style={{ background: color }} />
    </div>
  )
}

// ── ETF Canvas 스마트머니 ─────────────────────────────
async function fetchSmartMoney() {
  const url = 'https://etf-canvas.com/active-tracker/stock-ranking'
  const res = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(15000) })
  const html = await res.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const text = doc.body.innerText || doc.body.textContent || ''
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // 날짜 추출
  const dateMatch = text.match(/(\d{4}\.\d{2}\.\d{2})/)
  const date = dateMatch ? dateMatch[1] : ''

  // 순매수/순매도 파싱
  const buyList = [], sellList = []
  let mode = null
  for (const line of lines) {
    if (line.includes('순매수 TOP')) { mode = 'buy'; continue }
    if (line.includes('순매도 TOP')) { mode = 'sell'; continue }
    if (line.includes('오늘 주목받은')) break
    if (!mode) continue
    const amtMatch = line.match(/([+−\-][\d,]+억)/)
    if (amtMatch) {
      const prevLines = lines.slice(Math.max(0, lines.indexOf(line) - 3), lines.indexOf(line))
      const name = prevLines.find(l => l.length > 1 && !l.match(/^\d+$/) && !l.includes('ETF') && !l.includes('클릭'))
      const etfMatch = prevLines.find(l => l.match(/\d+개 ETF/))
      if (name) {
        const entry = { name, amount: amtMatch[1], etfCount: etfMatch?.match(/\d+/)?.[0] || '' }
        if (mode === 'buy')  buyList.push(entry)
        if (mode === 'sell') sellList.push(entry)
      }
    }
  }

  return { date, buyList: buyList.slice(0, 10), sellList: sellList.slice(0, 10) }
}

function SmartMoneyCard({ data, loading, error, onRefresh }) {
  const [tab, setTab] = useState('buy')

  return (
    <div className={styles.smCard}>
      <div className={styles.smHeader}>
        <div className={styles.smHeaderLeft}>
          <span className={styles.smBadge}>📡 ETF Canvas</span>
          <span className={styles.smTitle}>스마트머니 — 오늘 어디로?</span>
          {data?.date && <span className={styles.smDate}>{data.date} 기준</span>}
        </div>
        <button className={styles.smRefresh} onClick={onRefresh} disabled={loading}>
          {loading ? <span className="spin">⟳</span> : '🔄'}
        </button>
      </div>

      {loading && <div className={styles.smLoading}><span className="spin">⟳</span> 데이터 불러오는 중...</div>}
      {error   && <div className={styles.smError}>{error}</div>}

      {!loading && data && (
        <>
          <div className={styles.smTabs}>
            <button className={`${styles.smTab} ${tab==='buy'?styles.smTabBuy:''}`}   onClick={() => setTab('buy')}>
              ▲ 순매수 TOP 10
            </button>
            <button className={`${styles.smTab} ${tab==='sell'?styles.smTabSell:''}`} onClick={() => setTab('sell')}>
              ▼ 순매도 TOP 10
            </button>
          </div>
          <div className={styles.smList}>
            {(tab === 'buy' ? data.buyList : data.sellList).map((item, i) => (
              <div key={i} className={styles.smItem}>
                <span className={styles.smRank}>{i + 1}</span>
                <span className={styles.smName}>{item.name}</span>
                {item.etfCount && <span className={styles.smEtf}>{item.etfCount}개 ETF</span>}
                <span className={`${styles.smAmt} ${tab==='buy'?styles.up:styles.dn}`}>
                  {item.amount}
                </span>
              </div>
            ))}
            {(tab === 'buy' ? data.buyList : data.sellList).length === 0 && (
              <div className={styles.smEmpty}>데이터를 불러올 수 없습니다</div>
            )}
          </div>
          <a href="https://etf-canvas.com/active-tracker/stock-ranking"
             target="_blank" rel="noreferrer" className={styles.smLink}>
            ETF Canvas에서 전체 보기 →
          </a>
        </>
      )}
    </div>
  )
}

// ── 공포탐욕지수 ─────────────────────────────────────
async function fetchFearGreed() {
  const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata'
  const res = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) })
  const data = await res.json()
  const score = data?.fear_and_greed?.score
  const rating = data?.fear_and_greed?.rating
  return { score: Math.round(score), rating }
}

function FearGreedCard({ data, loading }) {
  const getColor = (score) => {
    if (score >= 75) return '#DC2626'
    if (score >= 55) return '#F97316'
    if (score >= 45) return '#C9A84C'
    if (score >= 25) return '#10B981'
    return '#0EA5E9'
  }
  const getLabel = (rating) => {
    const map = {
      'Extreme Greed': '극단적 탐욕',
      'Greed': '탐욕',
      'Neutral': '중립',
      'Fear': '공포',
      'Extreme Fear': '극단적 공포',
    }
    return map[rating] || rating || '--'
  }

  const color = data ? getColor(data.score) : '#94A3B8'

  return (
    <div className={styles.fgCard}>
      <div className={styles.fgLabel}>😱 공포탐욕지수 (CNN)</div>
      {loading ? (
        <div className={styles.qLoading}><span className="spin">⟳</span></div>
      ) : data ? (
        <>
          <div className={styles.fgGauge}>
            <svg width="120" height="66" viewBox="0 0 120 66">
              <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#E8EAED" strokeWidth="10" strokeLinecap="round"/>
              <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(data.score/100)*157} 157`}/>
              <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}
                fontFamily="DM Mono,monospace">{data.score}</text>
            </svg>
          </div>
          <div className={styles.fgRating} style={{ color }}>{getLabel(data.rating)}</div>
        </>
      ) : (
        <div className={styles.qError}>--</div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function MarketIndicators() {
  const [quotes,     setQuotes]     = useState({})
  const [loadingQ,   setLoadingQ]   = useState(true)
  const [smartMoney, setSmartMoney] = useState(null)
  const [loadingSM,  setLoadingSM]  = useState(true)
  const [smError,    setSmError]    = useState(null)
  const [fearGreed,  setFearGreed]  = useState(null)
  const [loadingFG,  setLoadingFG]  = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // 모든 시세 로드
  const fetchAllQuotes = useCallback(async () => {
    setLoadingQ(true)
    const allItems = GROUPS.flatMap(g => g.items)
    const results = {}
    await Promise.allSettled(
      allItems.map(async item => {
        try { results[item.id] = await fetchQuote(item.symbol) }
        catch {}
      })
    )
    setQuotes(results)
    setLastUpdate(new Date())
    setLoadingQ(false)
  }, [])

  // 스마트머니 로드 (재시도 포함)
  const fetchSM = useCallback(async (retries = 3) => {
    setLoadingSM(true)
    setSmError(null)
    for (let i = 0; i < retries; i++) {
      try {
        const data = await fetchSmartMoney()
        setSmartMoney(data)
        setLoadingSM(false)
        return
      } catch (e) {
        if (i === retries - 1) {
          setSmError('ETF Canvas 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.')
        } else {
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }
    setLoadingSM(false)
  }, [])

  // 공포탐욕지수 로드
  const fetchFG = useCallback(async () => {
    setLoadingFG(true)
    try {
      const data = await fetchFearGreed()
      setFearGreed(data)
    } catch {}
    setLoadingFG(false)
  }, [])

  useEffect(() => {
    fetchAllQuotes()
    fetchSM()
    fetchFG()
  }, [])

  // 매일 오전 6시 자동 업데이트
  useEffect(() => {
    const getNextSix = () => {
      const now = new Date()
      const next = new Date(now)
      next.setHours(6, 0, 0, 0)
      if (now >= next) next.setDate(next.getDate() + 1)
      return next - now
    }
    const timer = setTimeout(() => {
      fetchAllQuotes()
      fetchSM()
      fetchFG()
      setInterval(() => {
        fetchAllQuotes()
        fetchSM()
        fetchFG()
      }, 24 * 60 * 60 * 1000)
    }, getNextSix())
    return () => clearTimeout(timer)
  }, [])

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
        <button className={styles.refreshBtn} onClick={() => { fetchAllQuotes(); fetchSM(); fetchFG() }} disabled={loadingQ}>
          {loadingQ ? <span className="spin">⟳</span> : '🔄'} 전체 새로고침
        </button>
      </div>

      {/* 오늘의 시장 + 공포탐욕 */}
      <div className={styles.topRow}>
        <SmartMoneyCard data={smartMoney} loading={loadingSM} error={smError} onRefresh={fetchSM} />
        <FearGreedCard data={fearGreed} loading={loadingFG} />
      </div>

      {/* 지표 그룹별 */}
      {GROUPS.map(group => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupLabel} style={{ borderLeftColor: group.color }}>
            {group.label}
          </div>
          <div className={styles.qGrid}>
            {group.items.map(item => (
              <QuoteCard
                key={item.id}
                item={item}
                data={quotes[item.id]}
                loading={loadingQ && !quotes[item.id]}
                color={group.color}
              />
            ))}
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        출처: Yahoo Finance (시세) · CNN (공포탐욕) · ETF Canvas (스마트머니) · 15~20분 지연 가능
      </div>
    </div>
  )
}
