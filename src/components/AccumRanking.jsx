import React, { useState } from 'react'
import { CAT_CLASS } from '../utils/constants.js'
import styles from './AccumRanking.module.css'

/**
 * 누적 랭킹 컴포넌트
 * - 주간/1개월/3개월 TOP5 진입 횟수 누적
 * - 전체 / 유형별 필터
 */
export default function AccumRanking({ ranking, totalWeeks }) {
  const [filter, setFilter] = useState('total') // total | w | m | q

  if (!ranking.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📊</div>
        <div className={styles.emptyTitle}>아직 누적 데이터가 없습니다</div>
        <div className={styles.emptyDesc}>
          매주 일요일 데이터를 업로드하면<br/>
          TOP5 진입 횟수가 자동으로 누적됩니다
        </div>
      </div>
    )
  }

  const sorted = [...ranking].sort((a, b) => {
    if (filter === 'total') return b.total - a.total
    return b.counts[filter] - a.counts[filter]
  })

  const maxCount = sorted[0]?.[filter === 'total' ? 'total' : `counts`]
  const getCount = (e) => filter === 'total' ? e.total : e.counts[filter]
  const getMax   = () => Math.max(...sorted.map(e => getCount(e)), 1)

  return (
    <div className={styles.wrap}>
      {/* 필터 탭 */}
      <div className={styles.tabs}>
        {[
          { key:'total', label:'전체 진입' },
          { key:'w',     label:'주간 TOP5' },
          { key:'m',     label:'1개월 TOP5' },
          { key:'q',     label:'3개월 TOP5' },
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${filter === t.key ? styles.active : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
        <span className={styles.weekBadge}>총 {totalWeeks}주 누적</span>
      </div>

      {/* 랭킹 테이블 */}
      <div className={styles.table}>
        <div className={styles.thead}>
          <div className={styles.thRank}>순위</div>
          <div className={styles.thName}>ETF명</div>
          <div className={styles.thBar}>진입 횟수</div>
          <div className={styles.thW}>주간</div>
          <div className={styles.thM}>1개월</div>
          <div className={styles.thQ}>3개월</div>
          <div className={styles.thWeeks}>진입 주차</div>
        </div>

        {sorted.slice(0, 20).map((e, i) => {
          const cnt    = getCount(e)
          const maxCnt = getMax()
          const barW   = (cnt / maxCnt * 100).toFixed(1)
          const isTop3 = i < 3

          return (
            <div key={e.code} className={`${styles.row} ${isTop3 ? styles.top3 : ''}`}>
              <div className={styles.rank}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </div>
              <div className={styles.nameCol}>
                <div className={styles.name}>{e.name}</div>
                <div className={styles.meta}>
                  <span className={`cat-chip ${CAT_CLASS[e.cat] || 'cc-etc'}`}>{e.cat}</span>
                  <span className={styles.mgr}>{e.mgr}</span>
                </div>
              </div>
              <div className={styles.barCol}>
                <div className={styles.barWrap}>
                  <div className={styles.barFill} style={{ width: barW + '%' }} />
                </div>
                <span className={styles.barLabel}>{cnt}회</span>
              </div>
              <div className={styles.countCell}>
                <span className={styles.wBadge}>{e.counts.w}</span>
              </div>
              <div className={styles.countCell}>
                <span className={styles.mBadge}>{e.counts.m}</span>
              </div>
              <div className={styles.countCell}>
                <span className={styles.qBadge}>{e.counts.q}</span>
              </div>
              <div className={styles.weeksCell}>
                <span className={styles.weekCount}>{e.weeks.length}주</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
