import React from 'react'
import { fmtPct, fmtAum } from '../utils/constants.js'
import styles from './KpiStrip.module.css'

export default function KpiStrip({ data }) {
  const totalAum = data.reduce((s, e) => s + e.aum, 0)
  const w1Top  = [...data].sort((a,b)=>b.w1-a.w1)[0]
  const m1Top  = [...data].sort((a,b)=>b.m1-a.m1)[0]
  const m3Top  = [...data].sort((a,b)=>b.m3-a.m3)[0]
  const m6Top  = [...data].sort((a,b)=>b.m6-a.m6)[0]
  const ytdTop = [...data].sort((a,b)=>b.ytd-a.ytd)[0]
  const y1Top  = [...data].sort((a,b)=>b.y1-a.y1)[0]

  const cards = [
    { label:'분석 종목 수', value:data.length.toLocaleString(), cls:'ink',  sub:'레버리지·인버스 제외', color:'#0EA5E9', w:100 },
    { label:'총 운용규모',  value:(totalAum/10000).toFixed(1)+'조', cls:'blue', sub:'순자산 합계', color:'var(--blue)', w:80 },
    { label:'주간 1위',     value:fmtPct(w1Top?.w1),   cls:'up',   sub:w1Top?.name?.substring(0,18),  color:'var(--up)',   w:100 },
    { label:'1개월 1위',    value:fmtPct(m1Top?.m1),   cls:'up',   sub:m1Top?.name?.substring(0,18),  color:'var(--up)',   w:100 },
    { label:'3개월 1위',    value:fmtPct(m3Top?.m3),   cls:'gold', sub:m3Top?.name?.substring(0,18),  color:'var(--gold)', w:100 },
    { label:'6개월 1위',    value:fmtPct(m6Top?.m6),   cls:'gold', sub:m6Top?.name?.substring(0,18),  color:'var(--gold)', w:100 },
    { label:'YTD 1위',      value:fmtPct(ytdTop?.ytd), cls:'up',   sub:ytdTop?.name?.substring(0,18), color:'var(--up)',   w:100 },
    { label:'1년 1위',      value:fmtPct(y1Top?.y1),   cls:'blue', sub:y1Top?.name?.substring(0,18),  color:'var(--blue)', w:100 },
  ]

  return (
    <div className={`${styles.strip} fade-up`}>
      {cards.map((c,i) => (
        <div key={i} className={styles.card}>
          <div className={styles.label}>{c.label}</div>
          <div className={`${styles.value} ${styles[c.cls]}`}>{c.value}</div>
          <div className={styles.sub}>{c.sub}</div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width:c.w+'%', background:c.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}
