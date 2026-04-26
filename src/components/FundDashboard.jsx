import React, { useState, useMemo, useRef } from 'react'
import { parseFundWorkbook } from '../utils/parseFund.js'
import { fmtPct, fmtAum, CAT_COLORS } from '../utils/constants.js'
import styles from './FundDashboard.module.css'

const RISK_LABEL = { '1':'1(매우高)', '2':'2(高)', '3':'3(중高)', '4':'4(중低)', '5':'5(低)', '6':'6(매우低)' }
const CAT1_COLORS = {
  '국내주식': '#10B981', '해외주식': '#3B82F6', '혼합': '#8B5CF6',
  '국내채권': '#14B8A6', '해외채권': '#6366F1', 'MMF': '#C9A84C', '기타': '#94A3B8',
}
const MGR_COLORS = ['#3B82F6','#10B981','#C9A84C','#8B5CF6','#EC4899','#14B8A6','#F97316']

function RetBadge({ v }) {
  if (v == null) return <span style={{color:'var(--muted)'}}>--</span>
  const pos = v >= 0
  return <span className={pos ? styles.up : styles.dn}>{pos?'+':''}{v.toFixed(2)}%</span>
}

// ── TOP5 패널 ──────────────────────────────────────────
function FundTop5({ title, data, metric, chipCls }) {
  const top5 = [...data].sort((a,b) => (b[metric]??-999) - (a[metric]??-999)).slice(0,5)
  const maxAum = Math.max(...top5.map(f=>f.aum), 1)

  return (
    <div className={styles.panel}>
      <div className={styles.panelHd}>
        <span className={`${styles.chip} ${styles[chipCls]}`}>{title.split(' ')[0]}</span>
        <span className={styles.panelTitle}>{title}</span>
      </div>
      {top5.map((f,i) => (
        <div key={f.name+i} className={styles.rankCard}>
          <div className={styles.rankRow}>
            <span className={`${styles.rankNum} ${i===0?styles.r1:i===1?styles.r2:i===2?styles.r3:''}`}>
              {String(i+1).padStart(2,'0')}
            </span>
            <div className={styles.fundInfo}>
              <div className={styles.fundName} title={f.name}>{f.name}</div>
              <div className={styles.fundMeta}>
                <span className={styles.catChip}
                  style={{background:CAT1_COLORS[f.cat1]+'20',color:CAT1_COLORS[f.cat1]}}>
                  {f.cat1}
                </span>
                <span className={styles.mgrName}>{f.mgr}</span>
                {f.pension && <span className={styles.pensionBadge}>연금✓</span>}
              </div>
            </div>
            <div className={styles.retCol}>
              <div className={`${styles.retMain} ${(f[metric]??0)>=0?styles.up:styles.dn}`}>
                {f[metric]!=null ? (f[metric]>=0?'+':'')+f[metric].toFixed(2)+'%' : '--'}
              </div>
              <div className={styles.retSub}>
                1월<RetBadge v={f.m1} /> 1년<RetBadge v={f.y1} />
              </div>
            </div>
          </div>
          <div className={styles.aumRow}>
            <div className={styles.aumTrack}>
              <div className={styles.aumFill} style={{width:(f.aum/maxAum*100).toFixed(1)+'%'}} />
            </div>
            <span className={styles.aumLabel}>AUM {fmtAum(f.aum)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 비교 테이블 ────────────────────────────────────────
function FundTable({ data }) {
  const [sortKey, setSortKey] = useState('aum')
  const [sortDir, setSortDir] = useState(-1)
  const [catFilter, setCatFilter] = useState('전체')

  const cats = ['전체', ...new Set(data.map(f=>f.cat1))]
  const filtered = catFilter === '전체' ? data : data.filter(f=>f.cat1===catFilter)
  const sorted = [...filtered].sort((a,b) => {
    const av = a[sortKey] ?? -Infinity
    const bv = b[sortKey] ?? -Infinity
    return sortDir * (bv - av)
  })

  const th = (key, label) => (
    <th className={styles.thR} onClick={() => { setSortKey(key); setSortDir(k => sortKey===key ? k*-1 : -1) }}
        style={{cursor:'pointer', userSelect:'none'}}>
      {label}{sortKey===key ? (sortDir===-1?'▼':'▲') : ''}
    </th>
  )

  return (
    <div className={styles.tableWrap}>
      <div className={styles.filterRow}>
        {cats.map(c => (
          <button key={c} className={`${styles.filterBtn} ${catFilter===c?styles.filterActive:''}`}
            onClick={() => setCatFilter(c)}>{c}</button>
        ))}
        <span className={styles.tableCount}>{sorted.length}개</span>
      </div>
      <div style={{overflowX:'auto'}}>
        <table className={styles.table}>
          <thead><tr>
            <th>펀드명</th><th>유형</th><th>운용사</th>
            {th('w1','1주')} {th('m1','1개월')} {th('m3','3개월')}
            {th('m6','6개월')} {th('ytd','연초후')} {th('y1','1년')} {th('y3','3년')}
            {th('aum','운용규모')} <th className={styles.thR}>총보수</th>
            <th className={styles.thC}>위험</th><th className={styles.thC}>연금</th>
          </tr></thead>
          <tbody>
            {sorted.slice(0,50).map((f,i) => (
              <tr key={f.name+i}>
                <td><div className={styles.fn}>{f.name.length>28?f.name.substring(0,28)+'…':f.name}</div>
                    <div className={styles.fc}>{f.cat2}</div></td>
                <td><span className={styles.catChip} style={{background:CAT1_COLORS[f.cat1]+'20',color:CAT1_COLORS[f.cat1]}}>{f.cat1}</span></td>
                <td className={styles.tdMgr}>{f.mgr}</td>
                <td className={styles.thR}><RetBadge v={f.w1} /></td>
                <td className={styles.thR}><RetBadge v={f.m1} /></td>
                <td className={styles.thR}><RetBadge v={f.m3} /></td>
                <td className={styles.thR}><RetBadge v={f.m6} /></td>
                <td className={styles.thR}><RetBadge v={f.ytd} /></td>
                <td className={styles.thR}><RetBadge v={f.y1} /></td>
                <td className={styles.thR}><RetBadge v={f.y3} /></td>
                <td className={`${styles.thR} ${styles.gold}`}>{fmtAum(f.aum)}</td>
                <td className={styles.thR}>{f.fee!=null?f.fee.toFixed(2)+'%':'--'}</td>
                <td className={styles.thC}>{RISK_LABEL[f.risk]||f.risk||'--'}</td>
                <td className={styles.thC}>{f.pension?<span className={styles.pensionBadge}>✓</span>:'--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 50 && <div className={styles.moreHint}>상위 50개 표시 · 필터로 범위 조정</div>}
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────
export default function FundDashboard({ onBack }) {
  const [data,    setData]    = useState([])
  const [status,  setStatus]  = useState('idle')
  const [loadedAt,setLoadedAt]= useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setStatus('loading')
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseFundWorkbook(ev.target.result)
        setData(rows)
        setLoadedAt(new Date())
        setStatus('ok')
      } catch(err) {
        setStatus('error')
        console.error(err)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  // 통계
  const stats = useMemo(() => {
    if (!data.length) return null
    const totalAum = data.reduce((s,f)=>s+f.aum, 0)
    const m1Top  = [...data].filter(f=>f.m1!=null).sort((a,b)=>b.m1-a.m1)[0]
    const m3Top  = [...data].filter(f=>f.m3!=null).sort((a,b)=>b.m3-a.m3)[0]
    const y1Top  = [...data].filter(f=>f.y1!=null).sort((a,b)=>b.y1-a.y1)[0]
    const catMap = {}
    data.forEach(f=>{ if(!catMap[f.cat1]) catMap[f.cat1]={c:0,a:0}; catMap[f.cat1].c++; catMap[f.cat1].a+=f.aum })
    return { totalAum, m1Top, m3Top, y1Top, catMap }
  }, [data])

  const hasData = data.length > 0

  return (
    <div className={styles.wrap}>
      {/* 상단 바 */}
      <div className={styles.topbar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={onBack}>← 메인</button>
          <span className={styles.breadcrumb}>Shinhan Premier <span>›</span> <strong>펀드 대시보드</strong></span>
          {loadedAt && <span className={styles.loadedDate}>{loadedAt.toLocaleDateString('ko-KR')} 기준</span>}
        </div>
        <div className={styles.topRight}>
          {hasData && <span className={styles.okBadge}>● {data.length}개 펀드</span>}
          <button className={styles.uploadBtn} onClick={() => fileRef.current.click()}>
            📂 펀드 엑셀 업로드
          </button>
          <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{display:'none'}} onChange={handleFile} />
        </div>
      </div>

      <main className={styles.main}>
        {/* 미업로드 */}
        {!hasData && (
          <div className={styles.empty}>
            <img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={styles.emptyLogo} />
            <div className={styles.emptyTitle}>펀드 데이터를 업로드하세요</div>
            <div className={styles.emptyDesc}>
              금융투자협회 또는 신한자산운용 펀드 데이터 엑셀 파일을 업로드하면<br/>
              <strong>종류A/B/C 자동 합산</strong>으로 펀드별 대시보드가 구성됩니다
            </div>
            <button className={styles.emptyBtn} onClick={() => fileRef.current.click()}>
              📂 펀드 엑셀 업로드
            </button>
          </div>
        )}

        {/* 대시보드 */}
        {hasData && stats && (
          <>
            {/* KPI */}
            <div className={styles.kpiStrip}>
              {[
                { label:'총 펀드 수',    value:data.length.toLocaleString(), sub:'종류 합산 기준',     color:'#0EA5E9' },
                { label:'총 운용규모',   value:(stats.totalAum/10000).toFixed(1)+'조', sub:'순자산 합계', color:'var(--blue)' },
                { label:'1개월 1위',     value:stats.m1Top ? (stats.m1Top.m1>=0?'+':'')+stats.m1Top.m1.toFixed(2)+'%' : '--',
                  sub: stats.m1Top?.name.substring(0,16)||'--', color:'var(--up)' },
                { label:'3개월 1위',     value:stats.m3Top ? (stats.m3Top.m3>=0?'+':'')+stats.m3Top.m3.toFixed(2)+'%' : '--',
                  sub: stats.m3Top?.name.substring(0,16)||'--', color:'var(--gold)' },
                { label:'1년 1위',       value:stats.y1Top ? (stats.y1Top.y1>=0?'+':'')+stats.y1Top.y1.toFixed(2)+'%' : '--',
                  sub: stats.y1Top?.name.substring(0,16)||'--', color:'#8B5CF6' },
              ].map((k,i) => (
                <div key={i} className={styles.kpiCard}>
                  <div className={styles.kpiLabel}>{k.label}</div>
                  <div className={styles.kpiVal} style={{color:k.color}}>{k.value}</div>
                  <div className={styles.kpiSub}>{k.sub}</div>
                  <div className={styles.kpiBar}><div style={{width:'100%',height:'100%',background:k.color,borderRadius:2}} /></div>
                </div>
              ))}
            </div>

            {/* TOP5 패널 2행 */}
            <div className={styles.sectionHd}>
              <div className={styles.sectionLine} />
              <span className={styles.sectionTitle}>기간별 수익률 우수 펀드 TOP 5</span>
              <span className={styles.sectionDesc}>{data.length}개 펀드 · 종류별 수익률 평균</span>
            </div>
            <div className={styles.panelRow}>
              <FundTop5 title="1개월 TOP 5" data={data} metric="m1" chipCls="chipM" />
              <FundTop5 title="3개월 TOP 5" data={data} metric="m3" chipCls="chipQ" />
              <FundTop5 title="6개월 TOP 5" data={data} metric="m6" chipCls="chipH" />
            </div>
            <div className={styles.panelRow}>
              <FundTop5 title="연초후 TOP 5" data={data} metric="ytd" chipCls="chipY" />
              <FundTop5 title="1년 TOP 5"   data={data} metric="y1"  chipCls="chipA" />
              <FundTop5 title="3년 TOP 5"   data={data} metric="y3"  chipCls="chipT" />
            </div>

            {/* 전체 펀드 테이블 */}
            <div className={styles.sectionHd}>
              <div className={styles.sectionLine} />
              <span className={styles.sectionTitle}>전체 펀드 비교</span>
              <span className={styles.sectionDesc}>컬럼 클릭 시 정렬 · 상위 50개 표시</span>
            </div>
            <FundTable data={data} />
          </>
        )}
      </main>
    </div>
  )
}
