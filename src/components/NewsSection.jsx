import React, { useState, useEffect } from 'react'
import { searchNaverNews } from '../utils/supabase.js'
import styles from './NewsSection.module.css'

const NEWS_KEYWORDS = [
  'ETF',
  'KODEX',
  'TIGER ETF',
  '국내 ETF',
  'ETF 수익률',
]

function stripHtml(str) {
  return str?.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") || ''
}

function timeAgo(pubDate) {
  const diff = Date.now() - new Date(pubDate).getTime()
  const min  = Math.floor(diff / 60000)
  const hour = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min  < 60)  return `${min}분 전`
  if (hour < 24)  return `${hour}시간 전`
  return `${day}일 전`
}

export default function NewsSection() {
  const [keyword,  setKeyword]  = useState('ETF')
  const [news,     setNews]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const fetchNews = async (kw) => {
    setLoading(true)
    setError(null)
    try {
      const items = await searchNaverNews(kw, 8)
      if (!items.length) setError('검색 결과가 없습니다')
      setNews(items)
    } catch (e) {
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
          <span className="spin">⟳</span> 뉴스 불러오는 중...
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className={styles.errorBox}>{error}</div>
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
                <span className={styles.source}>{stripHtml(item.originallink?.split('/')[2] || '뉴스')}</span>
                <span className={styles.time}>{timeAgo(item.pubDate)}</span>
              </div>
              <div className={styles.title}>{stripHtml(item.title)}</div>
              <div className={styles.desc}>{stripHtml(item.description)}</div>
            </a>
          ))}
        </div>
      )}

      {/* 뉴스 없음 */}
      {!loading && !error && news.length === 0 && (
        <div className={styles.empty}>검색 결과가 없습니다</div>
      )}

      <div className={styles.footer}>
        출처: 네이버 뉴스 검색 API · 실시간 업데이트
      </div>
    </div>
  )
}
