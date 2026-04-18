import React from 'react'
import styles from './Topbar.module.css'

const STATUS_MAP = {
  idle:    { cls: styles.wait, label: '데이터 없음' },
  loading: { cls: styles.load, label: '로딩 중...' },
  ok:      { cls: styles.ok,   label: '정상' },
  error:   { cls: styles.err,  label: '오류' },
}

export default function Topbar({ status, loadedAt, onOpenUpload, onOpenModal, extraLeft }) {
  const s = STATUS_MAP[status] || STATUS_MAP.idle

  const fmtDate = (d) => {
    if (!d) return null
    return d.toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' })
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <span className={styles.breadcrumb}>
          Shinhan Premier <span className={styles.sep}>›</span>
          <span className={styles.cur}>ETF 수익률 대시보드</span>
        </span>

        {/* 기준일 — 크고 명확하게 */}
        {loadedAt && (
          <div className={styles.dateBadge}>
            <span className={styles.dateLabel}>기준일</span>
            <span className={styles.dateValue}>{fmtDate(loadedAt)}</span>
          </div>
        )}

        {extraLeft}
      </div>

      <div className={styles.right}>
        <button className={`${styles.uploadBtn} ${styles.trust}`}   onClick={() => onOpenModal('trust')}>
          📄 신탁
        </button>
        <button className={`${styles.uploadBtn} ${styles.pension}`} onClick={() => onOpenModal('pension')}>
          📄 퇴직연금
        </button>
        <span className={`${styles.pill} ${s.cls}`}>
          <span className={styles.pillDot} />
          {s.label}
        </span>
        <button className={styles.btnPrimary} onClick={onOpenUpload}>
          📅 주간 업로드
        </button>
      </div>
    </header>
  )
}
