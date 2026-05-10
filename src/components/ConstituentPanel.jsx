import React from 'react'
import { fmtPct, fmtAum, CAT_CLASS } from '../utils/constants.js'
import styles from './ConstituentPanel.module.css'

function EligRow({ code, elig }) {
  const t = elig(code, 'trust')
  const p = elig(code, 'pension')
  const badge = (v, cls, label) => {
    if (v === true)  return <span className={`eb ${cls}`}>{label} ✓</span>
    if (v === false) return <span className="eb eb-x">{label} 불가</span>
    return <span style={{ color: 'var(--muted)', fontSize: 11 }}>미확인</span>
  }
  return (
    <>
      <tr>
        <td>🏦 신탁 가능</td>
        <td>{badge(t, 'eb-t', '가능')}</td>
      </tr>
      <tr>
        <td>🏢 퇴직연금</td>
        <td>{badge(p, 'eb-p', '가능')}</td>
      </tr>
    </>
  )
}

export default function ConstituentPanel({ allUnique, selectedCode, onSelect, allData, elig }) {
  const etf = allData.find(e => e.code === selectedCode)
  const barColors = ['#3B82F6', '#10B981', '#C9A84C']
  const maxR = etf ? Math.max(etf.t1r, etf.t2r, etf.t3r, 1) : 1

  return (
    <div style={{ marginBottom: 32 }}>
      {/* 셀렉터 버튼 */}
      <div className={styles.selRow}>
        {allUnique.map(e => (
          <button
            key={e.code}
            className={`${styles.selBtn} ${selectedCode === e.code ? styles.active : ''}`}
            onClick={() => onSelect(e.code)}
          >
            {e.name.length > 16 ? e.name.substring(0, 16) + '…' : e.name}
          </button>
        ))}
      </div>

      {etf && (
        <div className={styles.grid}>
          {/* 구성종목 바 차트 */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              구성종목 TOP 3
              <span className={styles.tag}>{etf.code}</span>
            </div>
            <p className={styles.etfName}>{etf.name}</p>
            {[
              { n: etf.top1, r: etf.t1r },
              { n: etf.top2, r: etf.t2r },
              { n: etf.top3, r: etf.t3r },
            ].map((c, i) => (
              <div key={i} className={styles.barItem}>
                <span className={styles.barRank}>{i + 1}</span>
                <span className={styles.barName} title={c.n}>{c.n || '--'}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: c.r && maxR ? (c.r / maxR * 100).toFixed(1) + '%' : '0%',
                      background: barColors[i],
                    }}
                  />
                </div>
                <span className={styles.barPct}>{c.r ? c.r.toFixed(1) + '%' : '--'}</span>
              </div>
            ))}
            <p className={styles.note}>※ 상위 3개만 표시. 전체 구성은 funetf.co.kr 확인</p>
          </div>

          {/* ETF 정보 테이블 */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>ETF 주요 정보</div>
            <table className={styles.infoTbl}>
              <tbody>
                <tr><td>ETF명</td>    <td style={{ fontSize: 11 }}>{etf.name}</td></tr>
                <tr><td>코드</td>     <td>{etf.code}</td></tr>
                <tr><td>대유형</td>   <td><span className={`cat-chip ${CAT_CLASS[etf.cat] || 'cc-etc'}`}>{etf.cat}</span></td></tr>
                <tr><td>운용사</td>   <td>{etf.mgr}</td></tr>
                <tr><td>운용규모</td> <td className="gold">{fmtAum(etf.aum)}</td></tr>
                <tr><td>총보수</td>   <td>{etf.fee.toFixed(2)}%</td></tr>
                <EligRow code={etf.code} elig={elig} />
                <tr><td>1일 수익률</td>   <td className={etf.d1  >= 0 ? 'up' : 'dn'}>{fmtPct(etf.d1)}</td></tr>
                <tr><td>주간 수익률</td>  <td className={etf.w1  >= 0 ? 'up' : 'dn'}>{fmtPct(etf.w1)}</td></tr>
                <tr><td>1개월 수익률</td> <td className={etf.m1  >= 0 ? 'up' : 'dn'}>{fmtPct(etf.m1)}</td></tr>
                <tr><td>3개월 수익률</td> <td className={etf.m3  >= 0 ? 'up' : 'dn'}>{fmtPct(etf.m3)}</td></tr>
                <tr><td>6개월 수익률</td> <td className={etf.m6  >= 0 ? 'up' : 'dn'}>{fmtPct(etf.m6)}</td></tr>
                <tr><td>YTD 수익률</td>   <td className={etf.ytd >= 0 ? 'up' : 'dn'}>{fmtPct(etf.ytd)}</td></tr>
                <tr><td>1년 수익률</td>   <td className={etf.y1  >= 0 ? 'up' : 'dn'}>{fmtPct(etf.y1)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
