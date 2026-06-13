import React, { useState } from 'react'
import EtfCompare from './EtfCompare.jsx'
import PdfReport  from './PdfReport.jsx'
import styles     from './ReportCenter.module.css'

/**
 * 리포트 센터 (4번째 탭)
 * - ETF 비교 모드 + PDF 보고서 생성을 한 곳에 모음
 * - 상단 탭으로 전환
 */
export default function ReportCenter({ onBack, etfData, fundData, selectedDate }) {
  const [tab, setTab] = useState('compare')   // compare | pdf

  const hasEtf  = (etfData  || []).length > 0
  const hasFund = (fundData || []).length > 0

  return (
    <div className={styles.wrap}>
      {/* 상단바 */}
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={onBack}>← 메인</button>
        <span className={styles.breadcrumb}>
          Shinhan Premier <span className={styles.sep}>›</span> <strong>리포트 센터</strong>
        </span>
        <div className={styles.dataStatus}>
          {hasEtf  && <span className={styles.statusBadge}>ETF {etfData.length}종목</span>}
          {hasFund && <span className={styles.statusBadge}>펀드 {fundData.length}개</span>}
        </div>
      </div>

      <div className={styles.main}>
        {/* 헤더 */}
        <div className={styles.header}>
          <img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={styles.headerLogo}/>
          <div>
            <div className={styles.headerTitle}>리포트 센터</div>
            <div className={styles.headerDesc}>ETF 비교 분석과 고객 배포용 PDF 보고서를 한 곳에서</div>
          </div>
        </div>

        {/* 탭 전환 */}
        <div className={styles.tabRow}>
          <button className={`${styles.tab} ${tab==='compare'?styles.tabActive:''}`} onClick={()=>setTab('compare')}>
            <span className={styles.tabIcon}>⚖️</span>
            <div className={styles.tabTextWrap}>
              <span className={styles.tabTitle}>ETF 비교 모드</span>
              <span className={styles.tabSub}>최대 3개 ETF를 골라 기간별 수익률 비교</span>
            </div>
          </button>
          <button className={`${styles.tab} ${tab==='pdf'?styles.tabActive:''}`} onClick={()=>setTab('pdf')}>
            <span className={styles.tabIcon}>🖨️</span>
            <div className={styles.tabTextWrap}>
              <span className={styles.tabTitle}>PDF 보고서 생성</span>
              <span className={styles.tabSub}>ETF · 펀드 TOP5 자동 생성 → 인쇄 / 저장</span>
            </div>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className={styles.content}>
          {tab === 'compare' && (
            <EtfCompare allData={etfData || []} />
          )}
          {tab === 'pdf' && (
            <PdfReport
              etfData={etfData || []}
              fundData={fundData || []}
              selectedDate={selectedDate}
              fearGreed={null}
              quotes={{}}
            />
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        신한은행 PB팀 내부용 · 투자 권유 자료 아님
      </footer>
    </div>
  )
}
