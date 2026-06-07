import React, { useState, useCallback } from 'react'
import { fmtPct, fmtAum } from '../utils/constants.js'
import styles from './PdfReport.module.css'

/**
 * PDF 보고서 자동 생성
 * - 브라우저 내장 window.print() 활용 (외부 라이브러리 불필요)
 * - 별도 프린트 스타일로 A4 최적화
 * - ETF TOP5 + 펀드 TOP5 + 주요 지표 요약
 */

const TODAY = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })

// 수익률 색상
function RetSpan({ v }) {
  if (v == null) return <span style={{ color:'#999' }}>--</span>
  const c = v >= 0 ? '#0D9488' : '#DC2626'
  return <span style={{ color: c, fontWeight: 700 }}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</span>
}

export default function PdfReport({ etfData, fundData, selectedDate, fearGreed, quotes }) {
  const [reportType, setReportType] = useState('both') // etf | fund | both
  const [loading,    setLoading]    = useState(false)

  // TOP5 계산
  const etfTop = {
    w1:  [...(etfData||[])].filter(e=>e.w1!=null).sort((a,b)=>b.w1-a.w1).slice(0,5),
    m1:  [...(etfData||[])].filter(e=>e.m1!=null).sort((a,b)=>b.m1-a.m1).slice(0,5),
    m3:  [...(etfData||[])].filter(e=>e.m3!=null).sort((a,b)=>b.m3-a.m3).slice(0,5),
    m6:  [...(etfData||[])].filter(e=>e.m6!=null).sort((a,b)=>b.m6-a.m6).slice(0,5),
    ytd: [...(etfData||[])].filter(e=>e.ytd!=null).sort((a,b)=>b.ytd-a.ytd).slice(0,5),
    y1:  [...(etfData||[])].filter(e=>e.y1!=null).sort((a,b)=>b.y1-a.y1).slice(0,5),
  }
  const fundTop = {
    m1:  [...(fundData||[])].filter(f=>f.m1!=null).sort((a,b)=>b.m1-a.m1).slice(0,5),
    m3:  [...(fundData||[])].filter(f=>f.m3!=null).sort((a,b)=>b.m3-a.m3).slice(0,5),
    y1:  [...(fundData||[])].filter(f=>f.y1!=null).sort((a,b)=>b.y1-a.y1).slice(0,5),
    y3:  [...(fundData||[])].filter(f=>f.y3!=null).sort((a,b)=>b.y3-a.y3).slice(0,5),
  }

  const handlePrint = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      window.print()
      setLoading(false)
    }, 300)
  }, [])

  const hasEtf  = (etfData||[]).length > 0
  const hasFund = (fundData||[]).length > 0

  return (
    <>
      {/* ── 화면용 컨트롤 패널 ─────────────────────── */}
      <div className={styles.control}>
        <div className={styles.controlLeft}>
          <div className={styles.reportTypeGroup}>
            {[
              { v:'both', l:'ETF + 펀드' },
              { v:'etf',  l:'ETF만' },
              { v:'fund', l:'펀드만' },
            ].map(o=>(
              <button key={o.v}
                className={`${styles.typeBtn} ${reportType===o.v?styles.typeBtnActive:''}`}
                onClick={()=>setReportType(o.v)}>
                {o.l}
              </button>
            ))}
          </div>
          <div className={styles.reportMeta}>
            <span>기준일: <strong>{selectedDate || TODAY}</strong></span>
            {hasEtf  && <span>ETF {etfData.length}종목</span>}
            {hasFund && <span>펀드 {fundData.length}개</span>}
          </div>
        </div>
        <button className={styles.printBtn} onClick={handlePrint} disabled={loading || (!hasEtf && !hasFund)}>
          {loading ? <span className="spin">⟳</span> : '🖨️'} PDF 출력 / 인쇄
        </button>
      </div>

      {(!hasEtf && !hasFund) && (
        <div className={styles.noData}>ETF 또는 펀드 데이터를 먼저 업로드해주세요</div>
      )}

      {/* ── 인쇄용 리포트 (화면에도 미리보기 표시) ── */}
      {(hasEtf || hasFund) && (
        <div className={styles.report} id="pdf-report">

          {/* 표지 헤더 */}
          <div className={styles.reportHeader}>
            <div className={styles.reportHeaderLeft}>
              <div className={styles.reportLogo}>𝑷 Shinhan Premier</div>
              <div className={styles.reportSubtitle}>Pathfinder Platform</div>
            </div>
            <div className={styles.reportHeaderRight}>
              <div className={styles.reportTitle}>
                {reportType==='etf'  ? 'ETF 수익률 주간 리포트'
                : reportType==='fund' ? '펀드 수익률 리포트'
                : 'ETF · 펀드 통합 주간 리포트'}
              </div>
              <div className={styles.reportDate}>기준일: {selectedDate || TODAY}</div>
              <div className={styles.reportDate}>작성일: {TODAY}</div>
            </div>
          </div>

          {/* 시장 요약 */}
          {quotes && (
            <div className={styles.marketSummary}>
              <div className={styles.sectionTitle}>📡 주요 시장 지표</div>
              <div className={styles.marketGrid}>
                {[
                  { l:'KOSPI',   v:quotes.kospi,  f:(d)=>`${d.price.toLocaleString('ko-KR',{maximumFractionDigits:2})} (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)` },
                  { l:'KOSDAQ',  v:quotes.kosdaq, f:(d)=>`${d.price.toLocaleString('ko-KR',{maximumFractionDigits:2})} (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)` },
                  { l:'S&P 500', v:quotes.sp500,  f:(d)=>`${d.price.toLocaleString('en-US',{maximumFractionDigits:2})} (${d.changePct>=0?'+':''}${d.changePct.toFixed(2)}%)` },
                  { l:'달러/원', v:quotes.usdkrw, f:(d)=>`${d.price.toLocaleString('ko-KR',{maximumFractionDigits:0})}원` },
                  { l:'미국10년채',v:quotes.us10y,f:(d)=>`${d.price.toFixed(3)}%` },
                  { l:'금(oz)',  v:quotes.gold,   f:(d)=>`$${d.price.toLocaleString('en-US',{maximumFractionDigits:0})}` },
                  { l:'WTI유가', v:quotes.oil,    f:(d)=>`$${d.price.toFixed(2)}` },
                  { l:'공포탐욕', v:fearGreed,    f:(d)=>`${d.score}/100` },
                ].filter(x=>x.v).map(({l,v,f})=>(
                  <div key={l} className={styles.marketItem}>
                    <span className={styles.marketLabel}>{l}</span>
                    <span className={styles.marketValue}>{f(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETF 섹션 */}
          {(reportType==='etf'||reportType==='both') && hasEtf && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📊 ETF 수익률 TOP 5 — {etfData.length}종목 기준 (레버리지·인버스 제외)</div>

              {[
                { title:'주간', list:etfTop.w1,  key:'w1' },
                { title:'1개월', list:etfTop.m1, key:'m1' },
                { title:'3개월', list:etfTop.m3, key:'m3' },
                { title:'6개월', list:etfTop.m6, key:'m6' },
                { title:'YTD',  list:etfTop.ytd, key:'ytd' },
                { title:'1년',  list:etfTop.y1,  key:'y1' },
              ].map(({ title, list, key }) => (
                <div key={key} className={styles.top5Block}>
                  <div className={styles.top5Title}>{title} 수익률 TOP 5</div>
                  <table className={styles.top5Table}>
                    <thead><tr>
                      <th>순위</th><th>ETF명</th><th>유형</th><th>운용사</th>
                      <th>{title}</th><th>1주</th><th>1개월</th><th>운용규모</th>
                    </tr></thead>
                    <tbody>
                      {list.map((e,i)=>(
                        <tr key={e.code} className={i===0?styles.rank1:''}>
                          <td className={styles.rankNum}>{i+1}</td>
                          <td className={styles.etfName}>{e.name}</td>
                          <td>{e.cat}</td>
                          <td>{e.mgr}</td>
                          <td><RetSpan v={e[key]}/></td>
                          <td><RetSpan v={e.w1}/></td>
                          <td><RetSpan v={e.m1}/></td>
                          <td>{fmtAum(e.aum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* 펀드 섹션 */}
          {(reportType==='fund'||reportType==='both') && hasFund && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>🏦 펀드 수익률 TOP 5 — {fundData.length}개 기준 (레버리지·인버스 제외)</div>

              {[
                { title:'1개월', list:fundTop.m1, key:'m1' },
                { title:'3개월', list:fundTop.m3, key:'m3' },
                { title:'1년',   list:fundTop.y1, key:'y1' },
                { title:'3년',   list:fundTop.y3, key:'y3' },
              ].map(({ title, list, key }) => (
                <div key={key} className={styles.top5Block}>
                  <div className={styles.top5Title}>{title} 수익률 TOP 5</div>
                  <table className={styles.top5Table}>
                    <thead><tr>
                      <th>순위</th><th>펀드명</th><th>유형</th><th>운용사</th>
                      <th>{title}</th><th>1개월</th><th>1년</th><th>운용규모</th>
                    </tr></thead>
                    <tbody>
                      {list.map((f,i)=>(
                        <tr key={f.name} className={i===0?styles.rank1:''}>
                          <td className={styles.rankNum}>{i+1}</td>
                          <td className={styles.etfName}>{f.name.length>30?f.name.substring(0,30)+'…':f.name}</td>
                          <td>{f.cat1}</td>
                          <td>{f.mgr}</td>
                          <td><RetSpan v={f[key]}/></td>
                          <td><RetSpan v={f.m1}/></td>
                          <td><RetSpan v={f.y1}/></td>
                          <td>{fmtAum(f.aum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* 고지문 */}
          <div className={styles.disclaimer}>
            본 자료는 신한은행 PB팀 내부 참고용으로 작성되었으며, 투자 권유 자료가 아닙니다.<br/>
            수익률은 NAV 기준이며 실제 투자 성과와 다를 수 있습니다. 과거 수익률이 미래 수익을 보장하지 않습니다.<br/>
            데이터 출처: funetf.co.kr (ETF) · 금융투자협회 (펀드) · Yahoo Finance (시장 지표)
          </div>
        </div>
      )}
    </>
  )
}
