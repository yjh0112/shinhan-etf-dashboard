import React, { useState, useEffect, useCallback, useRef } from 'react'
import styles from './NewsSection.module.css'

const PROXY = 'https://api.allorigins.win/raw?url='

// ── RSS 소스 (구글 뉴스 → 네이버 RSS 폴백) ──────────
const makeGoogleRss = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`

const makeNaverRss = (query) =>
  `https://news.naver.com/main/rss/search?query=${encodeURIComponent(query)}`

const ETF_KEYWORDS = [
  { label:'ETF 전체',    query:'ETF 국내' },
  { label:'KODEX',       query:'KODEX ETF' },
  { label:'TIGER',       query:'TIGER ETF' },
  { label:'채권 ETF',    query:'채권 ETF 금리' },
  { label:'해외주식ETF', query:'해외주식 ETF S&P' },
  { label:'퇴직연금ETF', query:'퇴직연금 ETF' },
]

// ── XML 파싱 ─────────────────────────────────────────
function parseRSS(xmlText) {
  const parser = new DOMParser()
  const doc    = parser.parseFromString(xmlText, 'text/xml')
  const items  = Array.from(doc.querySelectorAll('item'))
  return items.slice(0, 8).map(item => {
    const title   = item.querySelector('title')?.textContent        || ''
    const link    = item.querySelector('link')?.textContent         || ''
    const pubDate = item.querySelector('pubDate')?.textContent      || ''
    const source  = item.querySelector('source')?.textContent       || ''
    const desc    = item.querySelector('description')?.textContent  || ''
    return {
      title:  title.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim(),
      link,
      pubDate,
      source,
      desc:   desc.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim().substring(0, 120),
    }
  }).filter(i => i.title)
}

// ── 시간 표시 ─────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const hour = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min  < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`
  return `${day}일 전`
}

// ── RSS 가져오기 (재시도 + 폴백) ─────────────────────
async function fetchWithRetry(query, maxRetries = 3) {
  const sources = [
    { url: makeGoogleRss(query), name: 'Google' },
    { url: makeNaverRss(query),  name: 'Naver' },
  ]
  let lastError = null

  for (const src of sources) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(PROXY + encodeURIComponent(src.url), {
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text  = await res.text()
        const items = parseRSS(text)
        if (items.length > 0) return { items, source: src.name }
        throw new Error('결과 없음')
      } catch (e) {
        lastError = e
        if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)))
      }
    }
  }
  throw lastError
}

// ── 캐시 ─────────────────────────────────────────────
const newsCache = {}

function getCached(key) {
  const c = newsCache[key]
  if (!c) return null
  // 30분 이내 캐시 유효
  if (Date.now() - c.ts < 30 * 60 * 1000) return c.data
  return null
}
function setCache(key, data) {
  newsCache[key] = { data, ts: Date.now() }
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function NewsSection({ keywords }) {
  const KWS = keywords || ETF_KEYWORDS
  const [kwIdx,     setKwIdx]     = useState(0)
  const [news,      setNews]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [retrying,  setRetrying]  = useState(false)
  const [lastFetch, setLastFetch] = useState(null)
  const [newsSource,setNewsSource]= useState('')
  const [fromCache, setFromCache] = useState(false)
  const retryRef = useRef(null)

  const fetchNews = useCallback(async (idx) => {
    const query   = KWS[idx]?.query
    const cacheKey = query

    // 캐시 확인
    const cached = getCached(cacheKey)
    if (cached) {
      setNews(cached.items)
      setNewsSource(cached.source)
      setLastFetch(new Date(cached.ts || Date.now()))
      setFromCache(true)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setRetrying(false)
    setFromCache(false)

    try {
      const result = await fetchWithRetry(query)
      setNews(result.items)
      setNewsSource(result.source)
      setLastFetch(new Date())
      setCache(cacheKey, { ...result, ts: Date.now() })
    } catch (e) {
      // 실패해도 캐시가 있으면 stale 데이터라도 표시
      const stale = newsCache[cacheKey]
      if (stale) {
        setNews(stale.data.items)
        setNewsSource(stale.data.source)
        setFromCache(true)
        setError('최신 뉴스를 불러올 수 없어 이전 데이터를 표시합니다')
      } else {
        setError('뉴스를 불러오지 못했습니다. 잠시 후 자동으로 재시도합니다...')
        setNews([])
        // 10초 후 자동 재시도
        retryRef.current = setTimeout(() => {
          setRetrying(true)
          fetchNews(idx)
        }, 10000)
      }
    } finally {
      setLoading(false)
    }
  }, [KWS])

  useEffect(() => {
    clearTimeout(retryRef.current)
    fetchNews(kwIdx)
    return () => clearTimeout(retryRef.current)
  }, [kwIdx, fetchNews])

  return (
    <div className={styles.wrap}>
      {/* 키워드 탭 */}
      <div className={styles.tabs}>
        {KWS.map((kw, i) => (
          <button
            key={kw.label}
            className={`${styles.tab} ${kwIdx === i ? styles.active : ''}`}
            onClick={() => { clearTimeout(retryRef.current); setKwIdx(i) }}
          >
            {kw.label}
          </button>
        ))}
        <button className={styles.refreshBtn}
          onClick={() => { clearTimeout(retryRef.current); delete newsCache[KWS[kwIdx]?.query]; fetchNews(kwIdx) }}
          disabled={loading}>
          🔄
        </button>
        {lastFetch && (
          <span className={styles.lastFetch}>
            {lastFetch.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })} 기준
            {newsSource && <span className={styles.srcBadge}>{newsSource}</span>}
            {fromCache && <span className={styles.cacheBadge}>캐시</span>}
          </span>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className={styles.loading}>
          <span className="spin">⟳</span>&nbsp;
          {retrying ? '자동 재시도 중...' : '뉴스 불러오는 중...'}
        </div>
      )}

      {/* 에러 (뉴스가 있으면 경고만) */}
      {error && !loading && (
        <div className={news.length > 0 ? styles.warn : styles.error}>
          {error}
          {news.length === 0 && (
            <button className={styles.retryBtn}
              onClick={() => { delete newsCache[KWS[kwIdx]?.query]; fetchNews(kwIdx) }}>
              지금 재시도
            </button>
          )}
        </div>
      )}

      {/* 뉴스 카드 */}
      {!loading && news.length > 0 && (
        <div className={styles.grid}>
          {news.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noreferrer" className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.source}>{item.source || '뉴스'}</span>
                <span className={styles.time}>{timeAgo(item.pubDate)}</span>
              </div>
              <div className={styles.title}>{item.title}</div>
              {item.desc && <div className={styles.desc}>{item.desc}</div>}
            </a>
          ))}
        </div>
      )}

      {/* 완전 빈 상태 */}
      {!loading && !error && news.length === 0 && (
        <div className={styles.empty}>검색 결과가 없습니다</div>
      )}

      <div className={styles.footer}>
        출처: Google 뉴스 · Naver 뉴스 (자동 폴백) · 클릭 시 원문으로 이동
      </div>
    </div>
  )
}
