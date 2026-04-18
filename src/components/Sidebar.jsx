import React from 'react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { id: 'top',     icon: '📊', label: 'ETF 수익률 대시보드' },
  { id: 'const',   icon: '🔍', label: '구성종목 현황' },
  { id: 'compare', icon: '📋', label: '멀티기간 비교' },
  { id: 'stats',   icon: '📈', label: '전체 통계' },
  { id: 'heat',    icon: '🌡', label: '수익률 히트맵' },
  { id: 'accum',   icon: '🏆', label: 'TOP5 누적 랭킹' },
]

export default function Sidebar({ trust, pension, onOpenModal, onOpenUpload, historyCount }) {
  const scrollTo = (id) => {
    document.getElementById('sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>𝑃</div>
        <div className={styles.logoTitle}>Shinhan Premier</div>
        <div className={styles.logoSub}>Pathfinder Platform</div>
        <div className={styles.logoDivider} />
      </div>

      <div className={styles.nav}>
        <div className={styles.navLabel}>메뉴</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={styles.navItem} onClick={() => scrollTo(item.id)}>
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'accum' && historyCount > 0 && (
              <span className={styles.badge}>{historyCount}주</span>
            )}
          </button>
        ))}

        <div className={styles.navLabel} style={{ marginTop: 12 }}>데이터 관리</div>
        <button className={`${styles.navItem} ${styles.uploadItem}`} onClick={onOpenUpload}>
          <span className={styles.navIcon}>📅</span>
          <span>주간 데이터 업로드</span>
          <span className={styles.newBadge}>매주</span>
        </button>
        <button className={styles.navItem} onClick={() => onOpenModal('trust')}>
          <span className={styles.navIcon}>🏦</span>
          <span>신탁 목록 업데이트</span>
        </button>
        <button className={styles.navItem} onClick={() => onOpenModal('pension')}>
          <span className={styles.navIcon}>🏢</span>
          <span>퇴직연금 목록 업데이트</span>
        </button>
      </div>

      <div className={styles.footer}>
        <button className={styles.eligItem} onClick={() => onOpenModal('trust')}>
          <span className={styles.eligLabel}>🏦 신탁 기준일</span>
          <span className={`${styles.eligDate} ${trust.date ? styles.trust : styles.none}`}>
            {trust.date || '미설정'}
          </span>
        </button>
        <button className={styles.eligItem} onClick={() => onOpenModal('pension')}>
          <span className={styles.eligLabel}>🏢 퇴직연금 기준일</span>
          <span className={`${styles.eligDate} ${pension.date ? styles.pension : styles.none}`}>
            {pension.date || '미설정'}
          </span>
        </button>
      </div>
    </nav>
  )
}
