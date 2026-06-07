import React, { useState, useMemo } from 'react'
import { fmtPct, fmtAum, CAT_CLASS } from '../utils/constants.js'
import styles from './EtfCompare.module.css'

const PERIODS = [
  { key:'d1',  label:'1일' },
  { key:'w1',  label:'1주' },
  { key:'m1',  label:'1개월' },
  { key:'m3',  label:'3개월' },
  { key:'m6',  label:'6개월' },
  { key:'ytd', label:'YTD' },
  { key:'y1',  label:'1년' },
]

const COLORS = ['#1A56FF','#10B981','#C9A84C']

export default function EtfCompare({ allData }) {
  const [selected, setSelected] = useState([])  // 최대 3개 코드
  const [search,   setSearch]   = useState('')
  const [showList, setShowList] = useState(false)

  const results = useMemo(() => {
    if (!search.trim()) return []
    const lo = search.toLowerCase()
    return allData.filter(e =>
      e.name.toLowerCase().includes(lo) || e.code.includes(search.trim())
    ).slice(0, 8)
  }, [search, allData])

  const selectedEtfs = selected.map(code => allData.find(e => e.code === code)).filter(Boolean)

  const addEtf = (etf) => {
    if (selected.includes(etf.code)) return
    if (selected.length >= 3) {
      setSelected(prev => [...prev.slice(1), etf.code])
    } else {
      setSelected(prev => [...prev, etf.code])
    }
    setSearch('')
    setShowList(false)
  }

  const removeEtf = (code) => setSelected(prev => prev.filter(c => c !== code))

  // 기간별 최고 수익률 찾기
  const getBest = (period) => {
    if (!selectedEtfs.length) return null
    return selectedEtfs.reduce((best, e) =>
      (e[period] ?? -Infinity) > (best[period] ?? -Infinity) ? e : best
    )
  }

  if (!allData.length) return (
    <div className={styles.empty}>
      ETF 데이터를 먼저 업로드해주세요
    </div>
  )

  return (
    <div className={styles.wrap}>
      {/* 검색 & 선택 */}
      <div className={styles.searchArea}>
        <div className={styles.searchBox}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder={`ETF 이름 또는 코드 입력 — 최대 3개 선택 (현재 ${selected.length}개)`}
              value={search}
              onChange={e => { setSearch(e.target.value); setShowList(true) }}
              onFocus={() => setShowList(true)}
              onBlur={() => setTimeout(() => setShowList(false), 200)}
            />
            {search && <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>}
          </div>
          {showList && results.length > 0 && (
            <div className={styles.dropdown}>
              {results.map(etf => (
                <button key={etf.code} className={`${styles.dropItem} ${selected.includes(etf.code)?styles.dropItemSelected:''}`}
                  onClick={() => addEtf(etf)}>
                  <div className={styles.dropLeft}>
                    <span className={styles.dropName}>{etf.name}</span>
                    <span className={`cat-chip ${CAT_CLASS[etf.cat]||'cc-etc'}`}>{etf.cat}</span>
                  </div>
                  <div className={styles.dropRight}>
                    <span className={etf.w1>=0?styles.up:styles.dn}>주간 {fmtPct(etf.w1)}</span>
                    <span className={styles.dropAum}>{fmtAum(etf.aum)}</span>
                  </div>
                  {selected.includes(etf.code) && <span className={styles.checkMark}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 ETF 배지 */}
        <div className={styles.selectedBadges}>
          {selectedEtfs.map((etf, i) => (
            <div key={etf.code} className={styles.badge} style={{ borderColor: COLORS[i] }}>
              <span className={styles.badgeColor} style={{ background: COLORS[i] }}/>
              <span className={styles.badgeName}>{etf.name.length > 18 ? etf.name.substring(0,18)+'…' : etf.name}</span>
              <button className={styles.badgeRemove} onClick={() => removeEtf(etf.code)}>✕</button>
            </div>
          ))}
          {selected.length === 0 && (
            <div className={styles.hint}>위에서 ETF를 검색해 최대 3개까지 선택하세요</div>
          )}
        </div>
      </div>

      {selectedEtfs.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>비교할 ETF를 선택하세요</div>
          <div className={styles.emptyDesc}>예시: KODEX 200 vs TIGER 미국S&P500 vs ACE 글로벌반도체</div>
        </div>
      )}

      {selectedEtfs.length > 0 && (
        <>
          {/* 수익률 비교 바 차트 */}
          <div className={styles.barSection}>
            <div className={styles.barSectionTitle}>📊 기간별 수익률 비교</div>
            {PERIODS.map(period => {
              const best = getBest(period.key)
              const max  = Math.max(...selectedEtfs.map(e => Math.abs(e[period.key] ?? 0)), 0.1)
              return (
                <div key={period.key} className={styles.barRow}>
                  <div className={styles.barLabel}>{period.label}</div>
                  <div className={styles.barGroup}>
                    {selectedEtfs.map((etf, i) => {
                      const val = etf[period.key]
                      const pct = val != null ? (Math.abs(val) / max) * 100 : 0
                      const isBest = best?.code === etf.code && val != null
                      return (
                        <div key={etf.code} className={styles.barItem}>
                          <div className={styles.barTrackWrap}>
                            {val != null && val < 0 && (
                              <div className={styles.barNeg}
                                style={{ width: pct + '%', background: COLORS[i], opacity: .7 }}/>
                            )}
                            {val != null && val >= 0 && (
                              <div className={styles.barPos}
                                style={{ width: pct + '%', background: COLORS[i] }}/>
                            )}
                          </div>
                          <span className={`${styles.barVal} ${val!=null?(val>=0?styles.up:styles.dn):''} ${isBest?styles.barBest:''}`}>
                            {val != null ? (val >= 0 ? '+' : '') + val.toFixed(2) + '%' : '--'}
                            {isBest && ' 🏆'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 상세 비교 테이블 */}
          <div className={styles.tableSection}>
            <div className={styles.tableSectionTitle}>📋 상세 비교표</div>
            <div className={styles.compareTable}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.thLabel}>항목</th>
                    {selectedEtfs.map((etf, i) => (
                      <th key={etf.code} style={{ borderBottom: `3px solid ${COLORS[i]}` }}>
                        <div className={styles.thEtfName}>{etf.name.length>20?etf.name.substring(0,20)+'…':etf.name}</div>
                        <div className={styles.thEtfMeta}>{etf.mgr} · {etf.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 유형 */}
                  <tr className={styles.trCategory}>
                    <td>ETF 유형</td>
                    {selectedEtfs.map(etf => (
                      <td key={etf.code}>
                        <span className={`cat-chip ${CAT_CLASS[etf.cat]||'cc-etc'}`}>{etf.cat}</span>
                      </td>
                    ))}
                  </tr>
                  {/* 수익률 */}
                  {PERIODS.map(p => {
                    const best = getBest(p.key)
                    return (
                      <tr key={p.key}>
                        <td className={styles.tdLabel}>{p.label} 수익률</td>
                        {selectedEtfs.map(etf => (
                          <td key={etf.code} className={`${styles.tdNum} ${etf[p.key]!=null?(etf[p.key]>=0?styles.up:styles.dn):''} ${best?.code===etf.code&&etf[p.key]!=null?styles.bestCell:''}`}>
                            {etf[p.key] != null ? (etf[p.key] >= 0 ? '+' : '') + etf[p.key].toFixed(2) + '%' : '--'}
                            {best?.code===etf.code && etf[p.key]!=null && ' 🏆'}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  {/* 운용규모 */}
                  <tr>
                    <td className={styles.tdLabel}>운용규모</td>
                    {selectedEtfs.map(etf=>(
                      <td key={etf.code} className={`${styles.tdNum} ${styles.gold}`}>{fmtAum(etf.aum)}</td>
                    ))}
                  </tr>
                  {/* 총보수 */}
                  <tr>
                    <td className={styles.tdLabel}>총보수</td>
                    {selectedEtfs.map(etf=>(
                      <td key={etf.code} className={styles.tdNum}>
                        {etf.fee ? etf.fee.toFixed(3)+'%' : '--'}
                        {selectedEtfs.length > 1 && etf.fee === Math.min(...selectedEtfs.filter(e=>e.fee).map(e=>e.fee)) && ' ✓'}
                      </td>
                    ))}
                  </tr>
                  {/* 구성종목 */}
                  {[1,2,3].map(n => (
                    <tr key={'top'+n}>
                      <td className={styles.tdLabel}>구성종목 {n}위</td>
                      {selectedEtfs.map(etf=>(
                        <td key={etf.code} className={styles.tdConst}>
                          {etf[`top${n}`]
                            ? <><span className={styles.constName}>{etf[`top${n}`]}</span><span className={styles.constPct}>{etf[`t${n}r`]?.toFixed(1)}%</span></>
                            : '--'
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 총평 */}
          <div className={styles.summary}>
            <div className={styles.summaryTitle}>💡 비교 요약</div>
            <div className={styles.summaryGrid}>
              {PERIODS.slice(1).map(p => {
                const best = getBest(p.key)
                if (!best || best[p.key] == null) return null
                return (
                  <div key={p.key} className={styles.summaryItem}>
                    <span className={styles.summaryPeriod}>{p.label} 1위</span>
                    <span className={styles.summaryWinner} style={{ color: COLORS[selectedEtfs.indexOf(best)] }}>
                      {best.name.length > 16 ? best.name.substring(0, 16) + '…' : best.name}
                    </span>
                    <span className={styles.summaryRet}>{fmtPct(best[p.key])}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
