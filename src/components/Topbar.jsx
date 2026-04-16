import React, { useRef } from 'react'
import styles from './Topbar.module.css'

const STATUS_MAP = {
  idle:    { cls: styles.wait, label: '● 대기중' },
  loading: { cls: styles.load, label: '● 로딩 중...' },
  ok:      { cls: styles.ok,   label: '● 데이터 로드 완료' },
  error:   { cls: styles.err,  label: '● 로드 실패' },
}

export default function Topbar({ status, loadedAt, onAutoLoad, onFileLoad, onOpenModal }) {
  const fileRef = useRef()
  const s = STATUS_MAP[status] || STATUS_MAP.idle

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) { onFileLoad(f); e.target.value = '' }
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <span className={styles.breadcrumb}>
          Shinhan Premier <span className={styles.sep}>›</span>
          <span className={styles.cur}>ETF 수익률 대시보드</span>
        </span>
      </div>

      <div className={styles.right}>
        {/* 신탁·연금 업데이트 버튼 */}
        <button className={`${styles.uploadBtn} ${styles.trust}`}   onClick={() => onOpenModal('trust')}>
          📄 신탁 업데이트
        </button>
        <button className={`${styles.uploadBtn} ${styles.pension}`} onClick={() => onOpenModal('pension')}>
          📄 퇴직연금 업데이트
        </button>

        {/* 날짜 */}
        {loadedAt && (
          <span className={styles.date}>
            {loadedAt.toLocaleDateString('ko-KR')}
          </span>
        )}

        {/* 상태 칩 */}
        <span className={`${styles.pill} ${s.cls}`}>{s.label}</span>

        {/* 데이터 로드 버튼 */}
        <button className={styles.btnPrimary} onClick={onAutoLoad} disabled={status === 'loading'}>
          ⬇ funetf 자동 로드
        </button>
        <button className={styles.btnGhost} onClick={() => fileRef.current.click()}>
          📂 엑셀 업로드
        </button>
        <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleFile} />
      </div>
    </header>
  )
}
