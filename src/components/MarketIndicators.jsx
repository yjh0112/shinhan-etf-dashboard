import React, { useState, useEffect, useCallback } from 'react'
import styles from './MarketIndicators.module.css'

/**
 * 경제지표 대시보드
 * - 프록시 3개 체인: allorigins → corsproxy.io → thingproxy
 * - 실패 시 자동 다음 프록시로 전환
 * - range=5d&interval=1d → 완성된 봉 기준 → 항상 유효한 데이터
 * - 전체 실패 시 캐시된 마지막 데이터 표시
 */

const PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
]

// 여러 프록시를 순서대로 시도
async function fetchWithFallback(url, timeout = 8000) {
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(timeout) })
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.length < 10) continue
      return text
    } catch { continue }
  }
  throw new Error(`모든 프록시 실패: ${url}`)
}

// Yahoo Finance 전일 마감가 (range=5d → 마지막 완성봉 2개 비교)
async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const text = await fetchWithFallback(url)
  const data = JSON.parse(text)
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error('no data')

  const closes = result.indicators?.quote?.[0]?.close || []
  const times  = result.timestamp || []
  const valid  = closes.map((c, i) => ({ c, t: times[i] })).filter(x => x.c != null)
  if (valid.length < 2) throw new Error('insufficient data')

  const last = valid[valid.length - 1]
  const prev = valid[valid.length - 2]
  const chg  = last.c - prev.c
  return {
    price:     last.c,
    change:    chg,
    changePct: (chg / prev.c) * 100,
    date:      new Date(last.t * 1000).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
  }
}

// 공포탐욕지수
async function fetchFearGreed() {
  const url  = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata'
  const text = await fetchWithFallback(url)
  const data = JSON.parse(text)
  return {
    score:  Math.round(data?.fear_and_greed?.score || 0),
    rating: data?.fear_and_greed?.rating || '',
  }
}

// 뉴스 RSS
const NEWS_QUERIES = [
  '미국 금리 연준 Fed',
  '한국 기준금리 한국은행',
  '달러 원 환율',
  '코스피 증시',
  '글로벌 증시 S&P500',
  '인플레이션 CPI',
  'ETF 자금 흐름',
  '원자재 금 유가',
  '중국 경기 경제',
  '반도체 AI 주식',
]

function parseRSS(xml) {
  const doc   = new DOMParser().parseFromString(xml, 'text/xml')
  const items = Array.from(doc.querySelectorAll('item'))
  return items.slice(0, 1).map(it => ({
    title:   it.querySelector('title')?.textContent.replace(/<[^>]*>/g, '').trim() || '',
    link:    it.querySelector('link')?.textContent || '',
    source:  it.querySelector('source')?.textContent || '',
    pubDate: it.querySelector('pubDate')?.textContent || '',
  }))
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 60)   return `${m}분 전`
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`
  return `${Math.floor(m / 1440)}일 전`
}

// 지표 그룹
const GROUPS = [
  { label:'🇰🇷 국내 증시', color:'#1A56FF', items:[
    { id:'kospi',  label:'KOSPI',   symbol:'^KS11',     unit:'' },
    { id:'kosdaq', label:'KOSDAQ',  symbol:'^KQ11',     unit:'' },
  ]},
  { label:'🌐 해외 증시', color:'#10B981', items:[
    { id:'sp500',  label:'S&P 500', symbol:'^GSPC',     unit:'' },
    { id:'nasdaq', label:'NASDAQ',  symbol:'^IXIC',     unit:'' },
    { id:'dow',    label:'DOW',     symbol:'^DJI',      unit:'' },
    { id:'nikkei', label:'닛케이',  symbol:'^N225',     unit:'' },
    { id:'hsi',    label:'항셍',    symbol:'^HSI',      unit:'' },
    { id:'sse',    label:'상해',    symbol:'000001.SS', unit:'' },
  ]},
  { label:'💱 환율', color:'#C9A84C', items:[
    { id:'usdkrw', label:'달러/원', symbol:'KRW=X',     unit:'원' },
    { id:'jpykrw', label:'엔/원',   symbol:'JPYKRW=X',  unit:'원' },
    { id:'eurkrw', label:'유로/원', symbol:'EURKRW=X',  unit:'원' },
    { id:'cnykrw', label:'위안/원', symbol:'CNYKRW=X',  unit:'원' },
  ]},
  { label:'📈 금리', color:'#8B5CF6', items:[
    { id:'us10y',  label:'미국 10년채', symbol:'^TNX', unit:'%' },
    { id:'us2y',   label:'미국 2년채',  symbol:'^IRX', unit:'%' },
    { id:'spfut',  label:'S&P 선물',    symbol:'ES=F', unit:'' },
  ]},
  { label:'🛢 원자재', color:'#F97316', items:[
    { id:'gold',   label:'금(oz)',  symbol:'GC=F', unit:'$' },
    { id:'oil',    label:'WTI',    symbol:'CL=F', unit:'$' },
    { id:'silver', label:'은(oz)', symbol:'SI=F', unit:'$' },
    { id:'copper', label:'구리',   symbol:'HG=F', unit:'$' },
  ]},
]

// 숫자 포매팅
function fmt(v, unit) {
  if (v == null) return '--'
  if (unit === '원') return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
  if (unit === '$')  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (unit === '%')  return v.toFixed(3) + '%'
  return v.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 로컬 캐시 (30분)
const _cache = {}
function getCache(k) {
  const c = _cache[k]
  if (c && Date.now() - c.ts < 30 * 60 * 1000) return c.v
  return null
}
function setCache(k, v) { _cache[k] = { v, ts: Date.now() } }

// 시세 카드
function QuoteCard({ item, data, loading, err, color }) {
  const isUp = data ? data.change >= 0 : null
  return (
    <div className={`${styles.qCard} ${err ? styles.qCardErr : ''}`}>
      <div className={styles.qLabel}>{item.label}</div>
      {loading && !data
        ? <div className={styles.qSkeleton}><span className="spin">⟳</span></div>
        : data
          ? <>
              <div className={`${styles.qPrice} ${isUp ? styles.up : styles.dn}`}>{fmt(data.price, item.unit)}</div>
              <div className={`${styles.qChange} ${isUp ? styles.up : styles.dn}`}>
                {isUp ? '▲' : '▼'} {Math.abs(data.changePct).toFixed(2)}%
              </div>
              <div className={styles.qDate}>{data.date} 마감</div>
            </>
          : <div className={styles.qNA}>조회 불가</div>
      }
      <div className={styles.qBar} style={{ background: color }}/>
    </div>
  )
}

// 공포탐욕 게이지
function FearGreedGauge({ data, loading }) {
  const getColor = s => s >= 75 ? '#DC2626' : s >= 55 ? '#F97316' : s >= 45 ? '#C9A84C' : s >= 25 ? '#10B981' : '#3B82F6'
  const getKo = r => ({ 'Extreme Greed':'극단적 탐욕', 'Greed':'탐욕', 'Neutral':'중립', 'Fear':'공포', 'Extreme Fear':'극단적 공포' })[r] || r || '--'
  const color = data ? getColor(data.score) : '#94A3B8'
  return (
    <div className={styles.fgCard}>
      <div className={styles.fgTitle}>😱 공포탐욕지수 (CNN)</div>
      {loading && !data
        ? <div className={styles.fgLoading}><span className="spin">⟳</span></div>
        : data
          ? <>
              <svg width="110" height="62" viewBox="0 0 110 62">
                <path d="M8,56 A47,47 0 0,1 102,56" fill="none" stroke="#E8EAED" strokeWidth="9" strokeLinecap="round"/>
                <path d="M8,56 A47,47 0 0,1 102,56" fill="none" stroke={color} strokeWidth="9"
                  strokeLinecap="round" strokeDasharray={`${(data.score / 100) * 148} 148`}/>
                <text x="55" y="52" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} fontFamily="DM Mono,monospace">{data.score}</text>
              </svg>
              <div className={styles.fgRating} style={{ color }}>{getKo(data.rating)}</div>
            </>
          : <div className={styles.fgEmpty}>--</div>
      }
    </div>
  )
}

// 뉴스 카드
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

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function MarketIndicators() {
  const [quotes,    setQuotes]    = useState({})
  const [loadingQ,  setLoadingQ]  = useState(true)
  const [fearGreed, setFearGreed] = useState(null)
  const [loadingFG, setLoadingFG] = useState(true)
  const [news,      setNews]      = useState([])
  const [loadingN,  setLoadingN]  = useState(true)
  const [lastUpdate,setLastUpdate]= useState(null)
  const [failCount, setFailCount] = useState(0)

  // 단일 종목 로드 (캐시 우선)
  const loadQuote = useCallback(async (item) => {
    const cached = getCache(item.id)
    if (cached) return { id: item.id, data: cached, ok: true }
    try {
      const data = await fetchQuote(item.symbol)
      setCache(item.id, data)
      return { id: item.id, data, ok: true }
    } catch {
      // 캐시 stale이라도 반환
      const stale = _cache[item.id]?.v
      return { id: item.id, data: stale || null, ok: false }
    }
  }, [])

  // 전체 시세 로드 — 개별 성공/실패 독립 처리
  const fetchQuotes = useCallback(async () => {
    setLoadingQ(true)
    const allItems = GROUPS.flatMap(g => g.items)
    const results  = await Promise.allSettled(allItems.map(item => loadQuote(item)))
    const updated  = {}
    let fails      = 0
    results.forEach((r, i) => {
      const item = allItems[i]
      if (r.status === 'fulfilled') {
        updated[item.id] = r.value.data
        if (!r.value.ok) fails++
      } else {
        updated[item.id] = null
        fails++
      }
    })
    setQuotes(prev => ({ ...prev, ...updated }))
    setFailCount(fails)
    setLastUpdate(new Date())
    setLoadingQ(false)
  }, [loadQuote])

  // 공포탐욕 로드
  const fetchFG = useCallback(async () => {
    setLoadingFG(true)
    const cached = getCache('feargreed')
    if (cached) { setFearGreed(cached); setLoadingFG(false); return }
    try {
      const data = await fetchFearGreed()
      setCache('feargreed', data)
      setFearGreed(data)
    } catch {}
    setLoadingFG(false)
  }, [])

  // 뉴스 로드
  const fetchNews = useCallback(async () => {
    setLoadingN(true)
    const cached = getCache('news')
    if (cached) { setNews(cached); setLoadingN(false); return }
    const allNews = []
    await Promise.allSettled(NEWS_QUERIES.map(async q => {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
      try {
        const text  = await fetchWithFallback(rssUrl, 10000)
        const items = parseRSS(text)
        if (items[0]) allNews.push(items[0])
      } catch {}
    }))
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    const top10 = allNews.slice(0, 10)
    setCache('news', top10)
    setNews(top10)
    setLoadingN(false)
  }, [])

  useEffect(() => {
    fetchQuotes(); fetchFG(); fetchNews()
  }, [])

  // 매일 오전 6시 자동갱신
  useEffect(() => {
    const ms = () => {
      const now = new Date(), next = new Date(now)
      next.setHours(6, 0, 0, 0)
      if (now >= next) next.setDate(next.getDate() + 1)
      return next - now
    }
    const t = setTimeout(() => {
      // 캐시 초기화 후 재로드
      Object.keys(_cache).forEach(k => delete _cache[k])
      fetchQuotes(); fetchFG(); fetchNews()
      setInterval(() => {
        Object.keys(_cache).forEach(k => delete _cache[k])
        fetchQuotes(); fetchFG(); fetchNews()
      }, 24 * 3600 * 1000)
    }, ms())
    return () => clearTimeout(t)
  }, [])

  const vix = quotes.vix

  return (
    <div className={styles.wrap}>

      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>📡 PB 주요 지표 현황</span>
          {lastUpdate && (
            <span className={styles.updateTime}>
              {lastUpdate.toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })} 업데이트
            </span>
          )}
          {failCount > 0 && (
            <span className={styles.warnBadge}>⚠️ {failCount}개 지연 (캐시 표시)</span>
          )}
        </div>
        <button className={styles.refreshBtn}
          onClick={() => { Object.keys(_cache).forEach(k => delete _cache[k]); fetchQuotes(); fetchFG(); fetchNews() }}
          disabled={loadingQ}>
          {loadingQ ? <span className="spin">⟳</span> : '🔄'} 새로고침
        </button>
      </div>

      {/* 상단 감성 배너 */}
      <div className={styles.sentimentRow}>
        <FearGreedGauge data={fearGreed} loading={loadingFG}/>

        {/* VIX */}
        <div className={styles.vixCard}>
          <div className={styles.vixLabel}>📊 VIX 변동성지수</div>
          {vix
            ? <>
                <div className={`${styles.vixValue} ${vix.price > 25 ? styles.dn : vix.price > 18 ? styles.warn : styles.up}`}>
                  {vix.price.toFixed(2)}
                </div>
                <div className={styles.vixDesc}>
                  {vix.price > 30 ? '⚠️ 극도의 공포 — 방어적 포지션 권장'
                    : vix.price > 25 ? '🔴 높은 변동성 — 주의 필요'
                    : vix.price > 18 ? '🟡 보통 수준 — 주시 필요'
                    : '🟢 안정적 — 시장 불안 낮음'}
                </div>
                <div className={`${styles.vixChange} ${vix.change >= 0 ? styles.dn : styles.up}`}>
                  {vix.change >= 0 ? '▲' : '▼'} {Math.abs(vix.changePct).toFixed(2)}% · {vix.date}
                </div>
              </>
            : <div style={{color:'var(--muted)',fontSize:13}}>{loadingQ ? <span className="spin">⟳</span> : '조회 불가'}</div>
          }
        </div>

        {/* 오늘의 요약 */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryTitle}>📋 오늘의 시장 요약</div>
          <div className={styles.summaryItems}>
            {[
              { label:'KOSPI',   q:quotes.kospi,  fmt:(d)=>`${d.price.toLocaleString('ko-KR',{maximumFractionDigits:2})} (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)`, up:d=>d.changePct>=0 },
              { label:'달러/원', q:quotes.usdkrw, fmt:(d)=>`${d.price.toLocaleString('ko-KR',{maximumFractionDigits:0})}원 (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)`, up:d=>d.changePct<0 },
              { label:'미국10년채',q:quotes.us10y, fmt:(d)=>`${d.price.toFixed(3)}% (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)`, up:d=>d.changePct<0 },
              { label:'금(온스)', q:quotes.gold,  fmt:(d)=>`$${d.price.toLocaleString('en-US',{maximumFractionDigits:0})} (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)`, up:d=>d.changePct>=0 },
              { label:'WTI유가', q:quotes.oil,   fmt:(d)=>`$${d.price.toFixed(2)} (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)`, up:d=>d.changePct>=0 },
              { label:'공포탐욕',q:fearGreed,    fmt:(d)=>`${d.score}/100`, up:d=>d.score<50 },
            ].map(({ label, q, fmt: f, up }) => q ? (
              <div key={label} className={styles.summaryItem}>
                <span>{label}</span>
                <span className={up(q) ? styles.up : styles.dn}>{f(q)}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* 지표 그룹 */}
      {GROUPS.map(group => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupLabel} style={{ borderLeftColor: group.color }}>{group.label}</div>
          <div className={styles.qGrid} style={{ gridTemplateColumns: `repeat(${Math.min(group.items.length, 6)}, 1fr)` }}>
            {group.items.map(item => (
              <QuoteCard key={item.id} item={item}
                data={quotes[item.id]}
                loading={loadingQ && !quotes[item.id]}
                err={!loadingQ && !quotes[item.id]}
                color={group.color}/>
            ))}
          </div>
        </div>
      ))}

      {/* VIX 별도 표시 */}
      <div className={styles.group}>
        <div className={styles.groupLabel} style={{ borderLeftColor:'#DC2626' }}>⚡ 변동성</div>
        <div className={styles.qGrid} style={{ gridTemplateColumns:'repeat(1,1fr)', maxWidth:200 }}>
          <QuoteCard item={{ id:'vix', label:'VIX', unit:'' }} data={quotes.vix}
            loading={loadingQ && !quotes.vix} color="#DC2626"/>
        </div>
      </div>

      {/* 핵심 뉴스 */}
      <div className={styles.newsSection}>
        <div className={styles.newsSectionHeader}>
          <span className={styles.newsSectionTitle}>📰 PB 핵심 뉴스</span>
          <span className={styles.newsSectionDesc}>금리·환율·증시·ETF 주요 이슈</span>
          <button className={styles.newsRefreshBtn} onClick={() => { delete _cache['news']; fetchNews() }} disabled={loadingN}>
            {loadingN ? <span className="spin">⟳</span> : '🔄'}
          </button>
        </div>
        {loadingN && news.length === 0
          ? <div className={styles.newsLoading}><span className="spin">⟳</span> 뉴스 불러오는 중...</div>
          : <div className={styles.newsGrid}>
              {news.map((item, i) => <NewsCard key={i} item={item}/>)}
              {!loadingN && news.length === 0 && <div className={styles.newsEmpty}>뉴스를 불러오지 못했습니다</div>}
            </div>
        }
      </div>

      <div className={styles.footer}>
        출처: Yahoo Finance (전일 마감가) · CNN (공포탐욕지수) · Google 뉴스 · 투자 참고용이며 투자 권유 자료가 아닙니다
      </div>
    </div>
  )
}
