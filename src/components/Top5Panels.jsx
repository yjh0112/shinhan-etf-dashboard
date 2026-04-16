import React from 'react'
import { fmtPct, fmtAum, CAT_CLASS } from '../utils/constants.js'
import styles from './Top5Panels.module.css'

const PERIODS = [
  { key: 'w', metric: 'w1', label: '주간',   chipCls: styles.pcW, title: '주간 수익률 TOP 5' },
  { key: 'm', metric: 'm1', label: '1개월',  chipCls: styles.pcM, title: '1개월 수익률 TOP 5' },
  { key: 'q', metric: 'm3', label: '3개월',  chipCls: styles.pcQ, title: '3개월 수익률 TOP 5' },
]

function EligBadge({ code, elig }) {
  const t = elig(code, 'trust')
  const p = elig(code, 'pension')
  return (
    <>
      {t === true  && <span className="eb eb-t">신탁✓</span>}
      {t === false && <span className="eb eb-x">신탁✗</span>}
      {p === true  && <span className="eb eb-p">연금✓</span>}
      {p === false && <span className="eb eb-x">연금✗</span>}
    </>
  )
}

function RankCard({ etf, rank, metric, selected, onSelect, maxAum, elig }) {
  const pos = etf[metric] >= 0
  const aumPct = ((etf.aum / maxAum) * 100).toFixed(1)
  const rankCls = rank === 1 ? styles.rn1 : rank === 2 ? styles.rn2 : rank === 3 ? styles.rn3 : ''

  return (
    <div
      className={`${styles.card} ${selected ? styles.active : ''}`}
      onClick={() => onSelect(etf.code)}
    >
      <div className={styles.row}>
        <div className={`${styles.rankNum} ${rankCls}`}>{String(rank).padStart(2, '0')}</div>
        <div className={styles.info}>
          <div className={styles.name} title={etf.name}>{etf.name}</div>
          <div className={styles.meta}>
            <span className={`cat-chip ${CAT_CLASS[etf.cat] || 'cc-etc'}`}>{etf.cat}</span>
            <span className={styles.mgr}>{etf.mgr}</span>
            <EligBadge code={etf.code} elig={elig} />
          </div>
        </div>
        <div className={styles.ret}>
          <div className={`${styles.retMain} ${pos ? 'up' : 'dn'}`}>{fmtPct(etf[metric])}</div>
          <div className={styles.retSubs}>
            <span className={styles.retSub}>1주<span className={etf.w1 >= 0 ? 'up' : 'dn'}>{fmtPct(etf.w1)}</span></span>
            <span className={styles.retSub}>1월<span className={etf.m1 >= 0 ? 'up' : 'dn'}>{fmtPct(etf.m1)}</span></span>
          </div>
        </div>
      </div>
      <div className={styles.aumRow}>
        <div className={styles.aumTrack}><div className={styles.aumFill} style={{ width: aumPct + '%' }} /></div>
        <span className={styles.aumLabel}>AUM {fmtAum(etf.aum)}</span>
      </div>
    </div>
  )
}

export default function Top5Panels({ top5w, top5m, top5q, selectedCode, onSelect, elig }) {
  const lists = { w: top5w, m: top5m, q: top5q }

  return (
    <div className={styles.grid}>
      {PERIODS.map(p => {
        const list   = lists[p.key]
        const maxAum = Math.max(...list.map(e => e.aum))
        return (
          <div key={p.key} className={styles.panel}>
            <div className={styles.panelHd}>
              <span className={`${styles.chip} ${p.chipCls}`}>{p.label}</span>
              <span className={styles.panelTitle}>{p.title}</span>
            </div>
            <div>
              {list.map((etf, i) => (
                <RankCard
                  key={etf.code}
                  etf={etf} rank={i + 1}
                  metric={p.metric}
                  selected={selectedCode === etf.code}
                  onSelect={onSelect}
                  maxAum={maxAum}
                  elig={elig}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
