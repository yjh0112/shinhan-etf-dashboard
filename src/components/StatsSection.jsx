import React, { useEffect, useRef } from 'react'
import { CAT_COLORS, MGR_COLORS } from '../utils/constants.js'
import styles from './StatsSection.module.css'

function DonutChart({ data, total }) {
  const svgRef = useRef()
  const cx = 60, cy = 60, r = 44, sw = 14
  const circ = 2 * Math.PI * r

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''
    // 배경 링
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r)
    bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', '#E8EAED')
    bg.setAttribute('stroke-width', sw)
    svg.appendChild(bg)

    let offset = 0
    data.forEach(([cat, v]) => {
      const frac = v.count / total
      const dash = frac * circ
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r)
      c.setAttribute('fill', 'none')
      c.setAttribute('stroke', CAT_COLORS[cat] || '#CBD5E1')
      c.setAttribute('stroke-width', sw)
      c.setAttribute('stroke-dasharray', `${dash} ${circ - dash}`)
      c.setAttribute('stroke-dashoffset', (-offset * circ).toString())
      c.style.transform = 'rotate(-90deg)'
      c.style.transformOrigin = '50% 50%'
      svg.appendChild(c)
      offset += frac
    })

    // 중앙 텍스트
    const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    t1.setAttribute('x', cx); t1.setAttribute('y', cy - 4); t1.setAttribute('text-anchor', 'middle')
    t1.style.cssText = 'fill:#111827;font-size:14px;font-family:DM Mono,monospace;font-weight:600'
    t1.textContent = total; svg.appendChild(t1)

    const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    t2.setAttribute('x', cx); t2.setAttribute('y', cy + 12); t2.setAttribute('text-anchor', 'middle')
    t2.style.cssText = 'fill:#9CA3AF;font-size:9px;font-family:Noto Sans KR,sans-serif'
    t2.textContent = '종목'; svg.appendChild(t2)
  }, [data, total])

  return <svg ref={svgRef} width="120" height="120" viewBox="0 0 120 120" />
}

export default function StatsSection({ data }) {
  // 카테고리 집계
  const catMap = {}
  data.forEach(e => {
    if (!catMap[e.cat]) catMap[e.cat] = { count: 0, aum: 0 }
    catMap[e.cat].count++
    catMap[e.cat].aum += e.aum
  })
  const cats   = Object.entries(catMap).sort((a, b) => b[1].aum - a[1].aum)
  const maxAum = cats[0]?.[1].aum || 1

  // 운용사 집계
  const mgrMap = {}
  data.forEach(e => {
    const m = e.mgr || '기타'
    if (!mgrMap[m]) mgrMap[m] = { count: 0, aum: 0 }
    mgrMap[m].count++; mgrMap[m].aum += e.aum
  })
  const mgrs   = Object.entries(mgrMap).sort((a, b) => b[1].aum - a[1].aum).slice(0, 7)
  const maxMgr = mgrs[0]?.[1].aum || 1

  return (
    <div className={styles.grid}>
      {/* 대유형별 바 차트 */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>대유형별 ETF 수 &amp; 운용규모</div>
        {cats.map(([cat, v]) => (
          <div key={cat} className={styles.catRow}>
            <span className={styles.catLabel}>{cat}</span>
            <div className={styles.catTrack}>
              <div className={styles.catFill}
                   style={{ width: (v.aum / maxAum * 100).toFixed(1) + '%', background: CAT_COLORS[cat] || '#CBD5E1' }} />
            </div>
            <span className={styles.catVal}>{(v.aum / 10000).toFixed(1)}조·{v.count}종</span>
          </div>
        ))}
      </div>

      {/* 도넛 차트 */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>종목 수 비중</div>
        <div className={styles.donutWrap}>
          <DonutChart data={cats} total={data.length} />
        </div>
        <div>
          {cats.slice(0, 6).map(([cat, v]) => (
            <div key={cat} className={styles.legendRow}>
              <div className={styles.legendDot} style={{ background: CAT_COLORS[cat] || '#CBD5E1' }} />
              <span className={styles.legendName}>{cat}</span>
              <span className={styles.legendVal}>{v.count}개</span>
            </div>
          ))}
        </div>
      </div>

      {/* 운용사 랭킹 */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>운용사 TOP 7 (AUM 기준)</div>
        {mgrs.map(([name, v], i) => (
          <div key={name} className={styles.mgrItem}>
            <div className={styles.mgrTop}>
              <span className={styles.mgrName}>{name}</span>
              <span className={styles.mgrVal}>{v.count}개·{(v.aum / 10000).toFixed(1)}조</span>
            </div>
            <div className={styles.mgrTrack}>
              <div className={styles.mgrFill}
                   style={{ width: (v.aum / maxMgr * 100).toFixed(1) + '%', background: MGR_COLORS[i] || '#CBD5E1' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
