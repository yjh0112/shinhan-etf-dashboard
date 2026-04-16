import React, { useRef } from 'react'
import styles from './LoaderCard.module.css'

export default function LoaderCard({ status, progress, onAutoLoad, onFileLoad }) {
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) { onFileLoad(f); e.target.value = '' }
  }

  const isLoading = status === 'loading'

  return (
    <>
      {/* 데이터 소스 선택 카드 */}
      <div className={styles.card}>
        <div className={styles.icon}>📊</div>
        <div className={styles.text}>
          <div className={styles.title}>수익률 데이터 업데이트</div>
          <div className={styles.desc}>
            <strong>① 자동 로드</strong> — funetf.co.kr 엑셀 직접 파싱 &nbsp;|&nbsp;
            <strong>② 수동 업로드</strong> — 다운로드한 <code>.xlsx</code> 파일 선택
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onAutoLoad} disabled={isLoading}>
            {isLoading ? <span className="spin">⟳</span> : '⬇'} funetf 자동 로드
          </button>
          <button className={styles.btnGhost} onClick={() => fileRef.current.click()} disabled={isLoading}>
            📂 엑셀 업로드
          </button>
          <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleFile} />
        </div>
      </div>

      {/* 프로그레스 바 */}
      {isLoading && progress.pct > 0 && (
        <div className={styles.progressCard}>
          <div className={styles.progressMeta}>
            <span>{progress.label}</span>
            <span>{progress.pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: progress.pct + '%' }} />
          </div>
        </div>
      )}

      {/* 에러 안내 */}
      {status === 'error' && (
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>자동 로드 실패 — 수동 업로드를 이용하세요</div>
          <div className={styles.errorDesc}>
            1.{' '}
            <a href="https://www.funetf.co.kr/product/etf/filter" target="_blank" rel="noreferrer"
               style={{ color:'var(--blue)' }}>
              funetf.co.kr → ETF 필터링 검색
            </a>
            <br />
            2. 우측 상단 <strong>엑셀 다운로드</strong> 클릭 후 파일 저장
            <br />
            3. 아래 버튼으로 업로드
          </div>
          <button className={styles.btnPrimary} onClick={() => fileRef.current.click()}>
            엑셀 파일 업로드
          </button>
          <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleFile} />
        </div>
      )}
    </>
  )
}
