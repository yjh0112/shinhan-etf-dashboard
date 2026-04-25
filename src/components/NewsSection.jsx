import React, { useState, useEffect, useCallback } from 'react'
import styles from './NewsSection.module.css'

/**
 * ETF 뉴스 섹션
 * - 구글 뉴스 RSS → allorigins 프록시 → XML 파싱
 * - CORS 문제 없음, API 키 불필요, 무료
 */

const PROXY = 'https://api.allorigins.win/raw?url='

// 구글 뉴스 RSS (키워드 검색)
const makeRssUrl = (keyword) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`

const KEYWORDS = [
  { label: 'ETF 전체',   query: 'ETF 국내' },
  { label: 'KODEX',      query: 'KODEX ETF' },
  { label: 'TIGER',      query: 'TIGER ETF' },
  { label: '채권 ETF',   query: '채권 ETF 금리' },
  { label: '해외주식ETF', query: '해외주식 ETF S&P' },
  { label: '퇴직연금ETF', query: '퇴직연금 ETF' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const hour = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min  < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`
  return `${day}일 전`
}

function parseRSS(xmlText) {
  const parser = new DOMParser()
  const doc    = parser.parseFromString(xmlText, 'text/xml')
  const items  = Array.from(doc.querySelectorAll('item'))

  return items.slice(0, 8).map(item => {
    const title   = item.querySelector('title')?.textContent || ''
    const link    = item.querySelector('link')?.textContent || ''
    const pubDate = item.querySelector('pubDate')?.textContent || ''
    const source  = item.querySelector('source')?.textContent || ''
    const desc    = item.querySelector('description')?.textContent || ''

    // HTML 태그 제거
    const cleanDesc = desc.replace(/<[^>]*>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim()
    const cleanTitle = title.replace(/<[^>]*>/g,'').trim()

    return { title: cleanTitle, link, pubDate, source, desc: cleanDesc }
  })
}

export default function NewsSection() {
  const [kwIdx,   setKwIdx]   = useState(0)
  const [news,    setNews]    = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const fetchNews = useCallback(async (idx) => {
    setLoading(true)
    setError(null)
    try {
      const rssUrl = makeRssUrl(KEYWORDS[idx].query)
      const proxyUrl = PROXY + encodeURIComponent(rssUrl)
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const items = parseRSS(text)
      if (!items.length) throw new Error('뉴스를 불러오지 못했습니다')
      setNews(items)
      setLastFetch(new Date())
    } catch (e) {
      setError('뉴스 로드 실패 — 잠시 후 다시 시도해주세요')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNews(kwIdx) }, [kwIdx, fetchNews])

  return (
    <div className={styles.wrap}>
      {/* 키워드 탭 */}
      <div className={styles.tabs}>
        {KEYWORDS.map((kw, i) => (
          <button
            key={kw.label}
            className={`${styles.tab} ${kwIdx === i ? styles.active : ''}`}
            onClick={() => setKwIdx(i)}
          >
            {kw.label}
          </button>
        ))}
        <button className={styles.refreshBtn} onClick={() => fetchNews(kwIdx)}>
          🔄 새로고침
        </button>
        {lastFetch && (
          <span className={styles.lastFetch}>
            {lastFetch.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })} 기준
          </span>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className={styles.loading}>
          <span className="spin">⟳</span> &nbsp;뉴스 불러오는 중...
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* 뉴스 카드 */}
      {!loading && !error && (
        <div className={styles.grid}>
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <span className={styles.source}>{item.source || '뉴스'}</span>
                <span className={styles.time}>{item.pubDate ? timeAgo(item.pubDate) : ''}</span>
              </div>
              <div className={styles.title}>{item.title}</div>
              {item.desc && <div className={styles.desc}>{item.desc.substring(0, 100)}</div>}
            </a>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        출처: Google 뉴스 · 클릭 시 원문으로 이동
      </div>
    </div>
  )
}
