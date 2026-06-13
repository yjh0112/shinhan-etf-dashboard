import React from 'react'
import styles from './LandingPage.module.css'

/**
 * 메인 랜딩 화면
 * 4가지 선택: 주요지표 / ETF / 펀드 / 리포트센터
 */
export default function LandingPage({ onSelect }) {
  return (
    <div className={styles.wrap}>
      {/* 배경 장식 */}
      <div className={styles.bgCircle1} />
      <div className={styles.bgCircle2} />

      {/* 로고 */}
      <div className={styles.logoWrap}>
        <img
          src="./images/logo-gold-vertical.png"
          alt="신한 Premier"
          className={styles.logo}
        />
      </div>

      {/* 타이틀 */}
      <div className={styles.title}>Pathfinder Platform</div>
      <div className={styles.subtitle}>PB 자산관리 통합 대시보드</div>

      {/* 메뉴 카드 4개 */}
      <div className={styles.menuGrid}>
        {/* 주요지표 */}
        <button className={`${styles.menuCard} ${styles.cardIndicator}`} onClick={() => onSelect('indicator')}>
          <div className={styles.cardIcon}>📡</div>
          <div className={styles.cardTitle}>주요 지표 현황</div>
          <div className={styles.cardDesc}>
            KOSPI · KOSDAQ · 환율<br/>
            S&P500 · 금 · 유가 · VIX<br/>
            <span className={styles.autoTag}>매일 오전 6시 자동 업데이트</span>
          </div>
          <div className={styles.cardArrow}>→</div>
        </button>

        {/* ETF */}
        <button className={`${styles.menuCard} ${styles.cardEtf}`} onClick={() => onSelect('etf')}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardTitle}>ETF 대시보드</div>
          <div className={styles.cardDesc}>
            국내 ETF 수익률 분석<br/>
            TOP5 · 히트맵 · 누적랭킹<br/>
            <span className={styles.weekTag}>매주 일요일 업데이트</span>
          </div>
          <div className={styles.cardArrow}>→</div>
        </button>

        {/* 펀드 */}
        <button className={`${styles.menuCard} ${styles.cardFund}`} onClick={() => onSelect('fund')}>
          <div className={styles.cardIcon}>🏦</div>
          <div className={styles.cardTitle}>펀드 대시보드</div>
          <div className={styles.cardDesc}>
            국내외 펀드 수익률 분석<br/>
            유형별 TOP · 위험등급<br/>
            <span className={styles.weekTag}>수시 업데이트</span>
          </div>
          <div className={styles.cardArrow}>→</div>
        </button>

        {/* 리포트 센터 */}
        <button className={`${styles.menuCard} ${styles.cardReport}`} onClick={() => onSelect('report')}>
          <div className={styles.cardIcon}>📄</div>
          <div className={styles.cardTitle}>리포트 센터</div>
          <div className={styles.cardDesc}>
            ETF 비교 분석<br/>
            고객 배포용 PDF 보고서<br/>
            <span className={styles.toolTag}>비교 · 생성 도구</span>
          </div>
          <div className={styles.cardArrow}>→</div>
        </button>
      </div>

      <div className={styles.footer}>
        신한은행 PB팀 내부용 · 투자 권유 자료 아님
      </div>
    </div>
  )
}
