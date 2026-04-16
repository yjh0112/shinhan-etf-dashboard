import React from 'react'
import { fmtPct, CAT_CLASS } from '../utils/constants.js'
import styles from './Heatmap.module.css'

function EligBadges({ code, elig }) {
  const t = elig(code, 'trust')
  const p = elig(code, 'pension')
  const badges = []
  if (t === true)  badges.push(<span key="t" className="eb eb-t">신탁✓</span>)
  if (t === false) badges.push(<span key="t" className="eb eb-x">신탁✗</span>)
  if (p === true)  badges.push(<span key="p" className="eb eb-p">연금✓</span>)
  if (p === false) badges.push(<span key="p" className="eb eb-x">연금✗</span>)
  return badges.length > 0 ? <>{badges}</> : <span className={`cat-chip ${CAT_CLASS[null] || 'cc-etc'}`} style={{ fontSize:8, padding:'1px 4px' }}>—</span>
}

export default function Heatmap({ data, onSelect, elig }) {
  const top15  = [...data].sort((a, b) => b.w1 - a.w1).slice(0, 15)
  const maxAbs = Math.max(...top15.map(e => Math.abs(e.w1)))

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Weekly Return Heatmap — Top 15</span>
        <span className={styles.hint}>셀 클릭 → 상세 보기</span>
      </div>
      <div className={styles.grid}>
        {top15.map(e => {
          const pos    = e.w1 >= 0
          const inten  = Math.abs(e.w1) / maxAbs
          const alpha  = (0.06 + inten * 0.28).toFixed(2)
          const bdAlph = (0.12 + inten * 0.30).toFixed(2)
          const bg = pos ? `rgba(13,148,136,${alpha})`  : `rgba(220,38,38,${alpha})`
          const bd = pos ? `rgba(13,148,136,${bdAlph})` : `rgba(220,38,38,${bdAlph})`

          return (
            <div
              key={e.code}
              className={styles.cell}
              style={{ background: bg, borderColor: bd }}
              onClick={() => onSelect(e.code)}
            >
              <div className={styles.code}>{e.code.substring(0, 6)}</div>
              <div className={styles.name}>
                {e.name.replace(/(TIGER|KODEX|RISE|KBSTAR|ACE|HANARO)\s*/i, '').substring(0, 14)}
              </div>
              <div className={`${styles.pct} ${pos ? 'up' : 'dn'}`}>{fmtPct(e.w1)}</div>
              <div className={styles.badges}>
                <EligBadges code={e.code} elig={elig} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
