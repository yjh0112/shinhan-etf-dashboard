import React, { useState } from 'react'
import { fmtPct, fmtAum, CAT_CLASS, PERIOD_STYLE, PERIOD_LABEL } from '../utils/constants.js'
import styles from './CompareTable.module.css'

function EligCell({ code, type, elig }) {
  const v = elig(code, type)
  if (v === null) return <td className={styles.center} style={{ color:'var(--muted)', fontSize:11 }}>—</td>
  if (v === true) return <td className={styles.center}><span className={`eb ${type==='trust'?'eb-t':'eb-p'}`}>✓</span></td>
  return <td className={styles.center}><span className="eb eb-x">✗</span></td>
}

const SORT_COLS = [
  { key:'w1',  label:'1주' },
  { key:'m1',  label:'1개월' },
  { key:'m3',  label:'3개월' },
  { key:'m6',  label:'6개월' },
  { key:'ytd', label:'YTD' },
  { key:'y1',  label:'1년' },
  { key:'aum', label:'운용규모' },
]

export default function CompareTable({ allUnique, elig }) {
  const [sortKey, setSortKey] = useState('w1')
  const [sortDir, setSortDir] = useState(-1) // -1 내림, 1 오름

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1)
    else { setSortKey(key); setSortDir(-1) }
  }

  const sorted = [...allUnique].sort((a,b) => sortDir * (b[sortKey] - a[sortKey]))

  const thSort = (key, label) => (
    <th className={styles.r} onClick={() => handleSort(key)} style={{ cursor:'pointer', userSelect:'none' }}>
      {label}
      {sortKey === key && <span style={{ marginLeft:3, fontSize:9 }}>{sortDir === -1 ? '▼' : '▲'}</span>}
    </th>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.sortHint}>컬럼 클릭 시 정렬 · 현재: <strong>{SORT_COLS.find(c=>c.key===sortKey)?.label}</strong> {sortDir===-1?'내림':'오름'}</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ETF 종목명</th>
            <th>유형</th>
            <th className={styles.r}>1일</th>
            {thSort('w1',  '1주')}
            {thSort('m1',  '1개월')}
            {thSort('m3',  '3개월')}
            {thSort('m6',  '6개월')}
            {thSort('ytd', 'YTD')}
            {thSort('y1',  '1년')}
            {thSort('aum', '운용규모')}
            <th className={styles.r}>총보수</th>
            <th>선정기간</th>
            <th className={styles.center}>🏦신탁</th>
            <th className={styles.center}>🏢퇴직연금</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(e => (
            <tr key={e.code}>
              <td>
                <div className={styles.n1}>{e.name.length>24?e.name.substring(0,24)+'…':e.name}</div>
                <div className={styles.n2}>{e.mgr} · {e.code}</div>
              </td>
              <td><span className={`cat-chip ${CAT_CLASS[e.cat]||'cc-etc'}`}>{e.cat}</span></td>
              <td className={`${styles.r} ${e.d1  >=0?'up':'dn'}`}>{fmtPct(e.d1)}</td>
              <td className={`${styles.r} ${e.w1  >=0?'up':'dn'}`}>{fmtPct(e.w1)}</td>
              <td className={`${styles.r} ${e.m1  >=0?'up':'dn'}`}>{fmtPct(e.m1)}</td>
              <td className={`${styles.r} ${e.m3  >=0?'up':'dn'}`}>{fmtPct(e.m3)}</td>
              <td className={`${styles.r} ${e.m6  >=0?'up':'dn'}`}>{fmtPct(e.m6)}</td>
              <td className={`${styles.r} ${e.ytd >=0?'up':'dn'}`}>{fmtPct(e.ytd)}</td>
              <td className={`${styles.r} ${e.y1  >=0?'up':'dn'}`}>{fmtPct(e.y1)}</td>
              <td className={`${styles.r} gold`}>{fmtAum(e.aum)}</td>
              <td className={styles.r}>{e.fee.toFixed(2)}%</td>
              <td>
                {e.periods.map(p=>(
                  <span key={p} className={styles.pbadge}
                    style={PERIOD_STYLE[p]?Object.fromEntries(PERIOD_STYLE[p].split(';').filter(Boolean).map(s=>s.split(':').map(x=>x.trim()))):{}}
                  >{PERIOD_LABEL[p]}</span>
                ))}
              </td>
              <EligCell code={e.code} type="trust"   elig={elig} />
              <EligCell code={e.code} type="pension" elig={elig} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
