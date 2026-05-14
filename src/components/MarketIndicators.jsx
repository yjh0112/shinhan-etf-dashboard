import React, { useState, useEffect, useCallback } from 'react'
import styles from './MarketIndicators.module.css'

const PROXY = 'https://api.allorigins.win/raw?url='

// ── Yahoo Finance 전일 마감가 ─────────────────────────
async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const res = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(10000) })
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error('no data')

  // 완성된 봉 기준 — 마지막 2개 캔들 사용
  const closes = result.indicators?.quote?.[0]?.close || []
  const times  = result.timestamp || []

  // null 제거 후 마지막 2개
  const valid = closes.map((c,i) => ({c, t: times[i]})).filter(x => x.c != null)
  if (valid.length < 2) throw new Error('insufficient data')

  const last = valid[valid.length - 1]
  const prev = valid[valid.length - 2]
  const chg  = last.c - prev.c

  return {
    price:     last.c,
    change:    chg,
    changePct: (chg / prev.c) * 100,
    date:      new Date(last.t * 1000).toLocaleDateString('ko-KR', { month:'2-digit', day:'2-digit' }),
  }
}

// ── 공포탐욕지수 ──────────────────────────────────────
async function fetchFearGreed() {
  const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata'
  const res = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) })
  const data = await res.json()
  return {
    score:  Math.round(data?.fear_and_greed?.score || 0),
    rating: data?.fear_and_greed?.rating || '',
  }
}

// ── 뉴스 (Google RSS) ─────────────────────────────────
const MAKE_RSS = q =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`

const NEWS_QUERIES = [
  '미국 금리 연준 Fed',
  '한국 기준금리 한국은행',
  '달러 원 환율',
  '코스피 증시',
  '글로벌 증시 S&P',
  '인플레이션 CPI',
  'ETF 자금 흐름',
  '원자재 금 유가',
  '중국 경기 경제',
  '반도체 AI 주식',
]

function parseRSS(xml) {
  const doc   = new DOMParser().parseFromString(xml, 'text/xml')
  const items = Array.from(doc.querySelectorAll('item'))
  return items.slice(0, 2).map(it => ({
    title:  it.querySelector('title')?.textContent.replace(/<[^>]*>/g,'').trim() || '',
    link:   it.querySelector('link')?.textContent || '',
    source: it.querySelector('source')?.textContent || '',
    pubDate:it.querySelector('pubDate')?.textContent || '',
  }))
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 60)  return `${m}분 전`
  if (m < 1440) return `${Math.floor(m/60)}시간 전`
  return `${Math.floor(m/1440)}일 전`
}

// ── 지표 그룹 정의 ────────────────────────────────────
const GROUPS = [
  {
    label: '🇰🇷 국내 증시', color: '#1A56FF',
    items: [
      { id:'kospi',  label:'KOSPI',   symbol:'^KS11',  unit:'' },
      { id:'kosdaq', label:'KOSDAQ',  symbol:'^KQ11',  unit:'' },
    ],
  },
  {
    label: '🌐 해외 증시', color: '#10B981',
    items: [
      { id:'sp500',  label:'S&P 500', symbol:'^GSPC',  unit:'' },
      { id:'nasdaq', label:'NASDAQ',  symbol:'^IXIC',  unit:'' },
      { id:'dow',    label:'DOW',     symbol:'^DJI',   unit:'' },
      { id:'nikkei', label:'닛케이',  symbol:'^N225',  unit:'' },
      { id:'hsi',    label:'항셍',    symbol:'^HSI',   unit:'' },
      { id:'sse',    label:'상해',    symbol:'000001.SS',unit:''},
    ],
  },
  {
    label: '💱 환율', color: '#C9A84C',
    items: [
      { id:'usdkrw', label:'달러/원', symbol:'KRW=X',    unit:'원' },
      { id:'jpykrw', label:'엔/원',   symbol:'JPYKRW=X', unit:'원' },
      { id:'eurkrw', label:'유로/원', symbol:'EURKRW=X', unit:'원' },
      { id:'cnykrw', label:'위안/원', symbol:'CNYKRW=X', unit:'원' },
    ],
  },
  {
    label: '📈 금리', color: '#8B5CF6',
    items: [
      { id:'us10y', label:'미국 10년채', symbol:'^TNX',  unit:'%' },
      { id:'us2y',  label:'미국 2년채',  symbol:'^IRX',  unit:'%' },
      { id:'spfut', label:'S&P 선물',    symbol:'ES=F',  unit:'' },
    ],
  },
  {
    label: '🛢 원자재', color: '#F97316',
    items: [
      { id:'gold',   label:'금(oz)',   symbol:'GC=F', unit:'$' },
      { id:'oil',    label:'WTI유가',  symbol:'CL=F', unit:'$' },
      { id:'silver', label:'은(oz)',   symbol:'SI=F', unit:'$' },
      { id:'copper', label:'구리',     symbol:'HG=F', unit:'$' },
    ],
  },
  {
    label: '⚡ 변동성', color: '#DC2626',
    items: [
      { id:'vix', label:'VIX 공포지수', symbol:'^VIX', unit:'' },
    ],
  },
]

// ── 숫자 포매팅 ───────────────────────────────────────
function fmt(v, unit) {
  if (v == null) return '--'
  if (unit === '원') return v.toLocaleString('ko-KR', { maximumFractionDigits:0 })
  if (unit === '$')  return '$' + v.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  if (unit === '%')  return v.toFixed(3) + '%'
  return v.toLocaleString('ko-KR', { minimumFractionDigits:2, maximumFractionDigits:2 })
}

// ── 공포탐욕 게이지 ───────────────────────────────────
function FearGreedGauge({ data, loading }) {
  const getColor = s => s >= 75 ? '#DC2626' : s >= 55 ? '#F97316' : s >= 45 ? '#C9A84C' : s >= 25 ? '#10B981' : '#3B82F6'
  const getKo = r => ({
    'Extreme Greed':'극단적 탐욕','Greed':'탐욕','Neutral':'중립','Fear':'공포','Extreme Fear':'극단적 공포'
  })[r] || r || '--'
  const color = data ? getColor(data.score) : '#94A3B8'
  return (
    <div className={styles.fgCard}>
      <div className={styles.fgTitle}>😱 공포탐욕지수 (CNN)</div>
      {loading
        ? <div className={styles.fgLoading}><span className="spin">⟳</span></div>
        : data
          ? <>
              <svg width="110" height="62" viewBox="0 0 110 62" className={styles.fgSvg}>
                <path d="M8,56 A47,47 0 0,1 102,56" fill="none" stroke="#E8EAED" strokeWidth="9" strokeLinecap="round"/>
                <path d="M8,56 A47,47 0 0,1 102,56" fill="none" stroke={color} strokeWidth="9"
                  strokeLinecap="round" strokeDasharray={`${(data.score/100)*148} 148`}/>
                <text x="55" y="52" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} fontFamily="DM Mono,monospace">{data.score}</text>
              </svg>
              <div className={styles.fgRating} style={{color}}>{getKo(data.rating)}</div>
            </>
          : <div className={styles.fgEmpty}>--</div>
      }
    </div>
  )
}

// ── 시세 카드 ─────────────────────────────────────────
function QuoteCard({ item, data, loading, color }) {
  const isUp = data ? data.change >= 0 : null
  return (
    <div className={styles.qCard}>
      <div className={styles.qLabel}>{item.label}</div>
      {loading
        ? <div className={styles.qSkeleton}><span className="spin">⟳</span></div>
        : data
          ? <>
              <div className={`${styles.qPrice} ${isUp ? styles.up : styles.dn}`}>{fmt(data.price, item.unit)}</div>
              <div className={`${styles.qChange} ${isUp ? styles.up : styles.dn}`}>
                {isUp ? '▲' : '▼'} {Math.abs(data.changePct).toFixed(2)}%
              </div>
              {data.date && <div className={styles.qDate}>{data.date} 마감</div>}
            </>
          : <div className={styles.qPrice} style={{color:'var(--muted)'}}>--</div>
      }
      <div className={styles.qBar} style={{background: color}}/>
    </div>
  )
}

// ── 뉴스 카드 ─────────────────────────────────────────
function NewsCard({ item }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className={styles.newsCard}>
      <div className={styles.newsTop}>
        <span className={styles.newsSource}>{item.source || '뉴스'}</span>
        <span className={styles.newsTime}>{timeAgo(item.pubDate)}</span>
      </div>
      <div className={styles.newsTitle}>{item.title}</div>
    </a>
  )
}

// ── 메인 ─────────────────────────────────────────────
export default function MarketIndicators() {
  const [quotes,    setQuotes]    = useState({})
  const [loadingQ,  setLoadingQ]  = useState(true)
  const [fearGreed, setFearGreed] = useState(null)
  const [loadingFG, setLoadingFG] = useState(true)
  const [news,      setNews]      = useState([])
  const [loadingN,  setLoadingN]  = useState(true)
  const [lastUpdate,setLastUpdate]= useState(null)

  // 시세 로드
  const fetchQuotes = useCallback(async () => {
    setLoadingQ(true)
    const all = GROUPS.flatMap(g => g.items)
    const results = {}
    await Promise.allSettled(all.map(async item => {
      try { results[item.id] = await fetchQuote(item.symbol) } catch {}
    }))
    setQuotes(results)
    setLastUpdate(new Date())
    setLoadingQ(false)
  }, [])

  // 공포탐욕 로드
  const fetchFG = useCallback(async () => {
    setLoadingFG(true)
    try { setFearGreed(await fetchFearGreed()) } catch {}
    setLoadingFG(false)
  }, [])

  // 뉴스 로드 (10개 쿼리에서 1개씩 → 총 10개)
  const fetchNews = useCallback(async () => {
    setLoadingN(true)
    const allNews = []
    await Promise.allSettled(NEWS_QUERIES.map(async q => {
      try {
        const res   = await fetch(PROXY + encodeURIComponent(MAKE_RSS(q)), { signal: AbortSignal.timeout(10000) })
        const text  = await res.text()
        const items = parseRSS(text)
        if (items[0]) allNews.push(items[0])
      } catch {}
    }))
    // 발행시간 최신순 정렬
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    setNews(allNews.slice(0, 10))
    setLoadingN(false)
  }, [])

  useEffect(() => {
    fetchQuotes(); fetchFG(); fetchNews()
  }, [])

  // 매일 오전 6시 자동갱신
  useEffect(() => {
    const ms = () => {
      const now = new Date(), next = new Date(now)
      next.setHours(6,0,0,0)
      if (now >= next) next.setDate(next.getDate()+1)
      return next - now
    }
    const t = setTimeout(() => {
      fetchQuotes(); fetchFG(); fetchNews()
      setInterval(() => { fetchQuotes(); fetchFG(); fetchNews() }, 24*3600*1000)
    }, ms())
    return () => clearTimeout(t)
  }, [])

  const allLoading = loadingQ && Object.keys(quotes).length === 0

  return (
    <div className={styles.wrap}>

      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>📡 PB 주요 지표 현황</span>
          {lastUpdate && (
            <span className={styles.updateTime}>
              {lastUpdate.toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} 업데이트
            </span>
          )}
        </div>
        <button className={styles.refreshBtn}
          onClick={() => { fetchQuotes(); fetchFG(); fetchNews() }} disabled={loadingQ}>
          {loadingQ ? <span className="spin">⟳</span> : '🔄'} 새로고침
        </button>
      </div>

      {/* 공포탐욕 + VIX 강조 배너 */}
      <div className={styles.sentimentRow}>
        <FearGreedGauge data={fearGreed} loading={loadingFG}/>
        <div className={styles.vixCard}>
          <div className={styles.vixLabel}>📊 VIX 변동성지수</div>
          {loadingQ && !quotes.vix
            ? <div className={styles.fgLoading}><span className="spin">⟳</span></div>
            : quotes.vix
              ? <>
                  <div className={`${styles.vixValue} ${quotes.vix.price > 25 ? styles.dn : quotes.vix.price > 18 ? styles.warn : styles.up}`}>
                    {quotes.vix.price.toFixed(2)}
                  </div>
                  <div className={styles.vixDesc}>
                    {quotes.vix.price > 30 ? '⚠️ 극도의 공포 — 방어적 포지션 권장'
                      : quotes.vix.price > 25 ? '🔴 높은 변동성 — 주의 필요'
                      : quotes.vix.price > 18 ? '🟡 보통 수준 — 주시 필요'
                      : '🟢 안정적 — 시장 불안 낮음'}
                  </div>
                  <div className={`${styles.vixChange} ${quotes.vix.change >= 0 ? styles.dn : styles.up}`}>
                    {quotes.vix.change >= 0 ? '▲' : '▼'} {Math.abs(quotes.vix.changePct).toFixed(2)}%
                  </div>
                </>
              : <div style={{color:'var(--muted)',fontSize:13}}>--</div>
          }
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryTitle}>📋 오늘의 시장 요약</div>
          <div className={styles.summaryItems}>
            {quotes.kospi && <div className={styles.summaryItem}>
              <span>KOSPI</span>
              <span className={quotes.kospi.change >= 0 ? styles.up : styles.dn}>
                {quotes.kospi.price.toLocaleString('ko-KR',{maximumFractionDigits:2})} ({quotes.kospi.changePct >= 0 ? '+' : ''}{quotes.kospi.changePct.toFixed(2)}%)
              </span>
            </div>}
            {quotes.usdkrw && <div className={styles.summaryItem}>
              <span>달러/원</span>
              <span className={quotes.usdkrw.change >= 0 ? styles.dn : styles.up}>
                {quotes.usdkrw.price.toLocaleString('ko-KR',{maximumFractionDigits:0})}원 ({quotes.usdkrw.changePct >= 0 ? '+' : ''}{quotes.usdkrw.changePct.toFixed(2)}%)
              </span>
            </div>}
            {quotes.us10y && <div className={styles.summaryItem}>
              <span>미국 10년채</span>
              <span className={quotes.us10y.change >= 0 ? styles.dn : styles.up}>
                {quotes.us10y.price.toFixed(3)}% ({quotes.us10y.changePct >= 0 ? '+' : ''}{quotes.us10y.changePct.toFixed(2)}%)
              </span>
            </div>}
            {quotes.gold && <div className={styles.summaryItem}>
              <span>금</span>
              <span className={quotes.gold.change >= 0 ? styles.up : styles.dn}>
                ${quotes.gold.price.toLocaleString('en-US',{maximumFractionDigits:0})} ({quotes.gold.changePct >= 0 ? '+' : ''}{quotes.gold.changePct.toFixed(2)}%)
              </span>
            </div>}
            {fearGreed && <div className={styles.summaryItem}>
              <span>공포탐욕</span>
              <span style={{color: fearGreed.score >= 60 ? 'var(--dn)' : fearGreed.score >= 40 ? 'var(--warn)' : 'var(--up)'}}>
                {fearGreed.score}/100
              </span>
            </div>}
          </div>
        </div>
      </div>

      {/* 지표 그룹 — VIX 제외 */}
      {GROUPS.filter(g => g.label !== '⚡ 변동성').map(group => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupLabel} style={{borderLeftColor:group.color}}>{group.label}</div>
          <div className={styles.qGrid} style={{gridTemplateColumns:`repeat(${Math.min(group.items.length,6)},1fr)`}}>
            {group.items.map(item => (
              <QuoteCard key={item.id} item={item} data={quotes[item.id]} loading={loadingQ && !quotes[item.id]} color={group.color}/>
            ))}
          </div>
        </div>
      ))}

      {/* 핵심 뉴스 */}
      <div className={styles.newsSection}>
        <div className={styles.newsSectionHeader}>
          <span className={styles.newsSectionTitle}>📰 PB 핵심 뉴스</span>
          <span className={styles.newsSectionDesc}>금리·환율·증시·ETF 주요 이슈 실시간</span>
          <button className={styles.newsRefreshBtn} onClick={fetchNews} disabled={loadingN}>
            {loadingN ? <span className="spin">⟳</span> : '🔄'}
          </button>
        </div>
        {loadingN && news.length === 0 ? (
          <div className={styles.newsLoading}><span className="spin">⟳</span> 뉴스 불러오는 중...</div>
        ) : (
          <div className={styles.newsGrid}>
            {news.map((item, i) => <NewsCard key={i} item={item}/>)}
            {!loadingN && news.length === 0 && <div className={styles.newsEmpty}>뉴스를 불러오지 못했습니다</div>}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        출처: Yahoo Finance (시세 15~20분 지연) · CNN (공포탐욕지수) · Google 뉴스 · 투자 참고용이며 투자 권유 자료가 아닙니다
      </div>
    </div>
  )
}
