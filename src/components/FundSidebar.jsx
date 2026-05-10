import React from 'react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { id: 'fund-top',    icon: '🏦', label: '펀드 수익률 TOP 5' },
  { id: 'fund-compare',icon: '📋', label: '전체 펀드 비교' },
  { id: 'fund-stats',  icon: '📈', label: '펀드 통계' },
  { id: 'fund-search', icon: '🔎', label: '펀드 검색' },
  { id: 'fund-news',   icon: '📰', label: '펀드 주요뉴스' },
]

export default function FundSidebar({ onBack, onUpload, loadedAt, count }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className={styles.sidebar}>
      {/* 로고 */}
      <div className={styles.logo} onClick={onBack} style={{ cursor:'pointer' }} title="메인 화면으로">
        <img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={styles.logoImg} />
        <div className={styles.logoDivider} />
      </div>

      <div className={styles.nav}>
        {/* 메인으로 */}
        <button className={styles.backToMain} onClick={onBack}>
          <span>←</span>
          <span>메인 화면으로</span>
        </button>

        <div className={styles.navLabel} style={{ marginTop: 8 }}>메뉴</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={styles.navItem} onClick={() => scrollTo(item.id)}>
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'fund-news' && <span className={styles.newBadge}>LIVE</span>}
          </button>
        ))}

        <div className={styles.navLabel} style={{ marginTop: 12 }}>데이터 관리</div>
        <button className={`${styles.navItem} ${styles.uploadItem}`} onClick={onUpload}>
          <span className={styles.navIcon}>📂</span>
          <span>펀드 엑셀 업로드</span>
          <span className={styles.newBadge}>수시</span>
        </button>
      </div>

      {/* 하단 현황 */}
      <div className={styles.footer}>
        <div className={styles.eligItem} style={{ cursor:'default' }}>
          <span className={styles.eligLabel}>📊 로드된 펀드</span>
          <span className={`${styles.eligDate} ${count > 0 ? styles.trust : styles.none}`}>
            {count > 0 ? `${count.toLocaleString()}개` : '미업로드'}
          </span>
        </div>
        {loadedAt && (
          <div className={styles.eligItem} style={{ cursor:'default' }}>
            <span className={styles.eligLabel}>📅 기준일</span>
            <span className={`${styles.eligDate} ${styles.pension}`}>
              {loadedAt.toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}
      </div>
    </nav>
  )
}
