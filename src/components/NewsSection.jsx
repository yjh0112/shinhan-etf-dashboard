import React, { useState, useEffect } from 'react'
import styles from './NewsSection.module.css'

const NEWS_KEYWORDS = ['ETF', 'KODEX', 'TIGER ETF', '국내 ETF', 'ETF 수익률']

function stripHtml(str) {
  return str?.replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'") || ''
}

function timeAgo(pubDate) {
  const diff = Date.now() - new Date(pubDate).getTime()
  const min  = Math.floor(diff / 60000)
  const hour = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min  < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`
  return `${day}일 전`
}

// Claude API를 통해 네이버 뉴스 검색
async function fetchNewsViaClaude(keyword) {
  const prompt = `네이버 뉴스에서 "${keyword}" 키워드로 최신 뉴스 5개를 검색해서 아래 JSON 형식으로만 반환해주세요. 다른 설명은 절대 하지 마세요.

[
  {
    "title": "뉴스 제목",
    "description": "뉴스 요약 (2-3문장)",
    "source": "언론사명",
    "pubDate": "2026-04-18T09:00:00",
    "link": "https://..."
  }
]

오늘 날짜 기준 최신 ETF 관련 뉴스를 실제로 검색해서 넣어주세요.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await res.json()
  const text = data.content?.map(c => c.text || '').join('') || ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  return JSON.parse(match[0])
}

export default function NewsSection() {
  const [keyword, setKeyword] = useState('ETF')
  const [news,    setNews]    = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchNews = async (kw) => {
    setLoading(true)
    setError(null)
    setNews([])
    try {
      const items = await fetchNewsViaClaude(kw)
      if (!items.length) setError('검색 결과가 없습니다')
      setNews(items)
    } catch (e) {
      console.error(e)
      setError('뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews(keyword) }, [keyword])

  return (
    <div className={styles.wrap}>
      {/* 키워드 탭 */}
      <div className={styles.tabs}>
        {NEWS_KEYWORDS.map(kw => (
          <button
            key={kw}
            className={`${styles.tab} ${keyword === kw ? styles.active : ''}`}
            onClick={() => setKeyword(kw)}
          >
            {kw}
          </button>
        ))}
        <button className={styles.refreshBtn} onClick={() => fetchNews(keyword)}>
          🔄 새로고침
        </button>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className={styles.loadingWrap}>
          <span className="spin">⟳</span>&nbsp; 뉴스 검색 중... (10~20초 소요)
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className={styles.errorBox}>{error}</div>
      )}

      {/* 뉴스 카드 */}
      {!loading && !error && news.length > 0 && (
        <div className={styles.grid}>
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link || '#'}
              target="_blank"
              rel="noreferrer"
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <span className={styles.source}>{item.source || '뉴스'}</span>
                <span className={styles.time}>
                  {item.pubDate ? timeAgo(item.pubDate) : '최신'}
                </span>
              </div>
              <div className={styles.title}>{stripHtml(item.title)}</div>
              <div className={styles.desc}>{stripHtml(item.description)}</div>
            </a>
          ))}
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className={styles.empty}>검색 결과가 없습니다</div>
      )}

      <div className={styles.footer}>
        AI 웹 검색 기반 · 실시간 뉴스
      </div>
    </div>
  )
}
