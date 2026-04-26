import React, { useState, useMemo, useRef, useCallback } from 'react'
import { parseFundWorkbook } from '../utils/parseFund.js'
import { fmtPct, fmtAum } from '../utils/constants.js'
import FundSidebar from './FundSidebar.jsx'
import NewsSection from './NewsSection.jsx'
import SectionHeader from './SectionHeader.jsx'
import styles from './FundDashboard.module.css'

const RISK_LABEL = { '1':'1(매우高)', '2':'2(高)', '3':'3(중高)', '4':'4(중低)', '5':'5(低)', '6':'6(매우低)' }
const CAT1_COLORS = {
  '국내주식':'#10B981','해외주식':'#3B82F6','혼합':'#8B5CF6',
  '국내채권':'#14B8A6','해외채권':'#6366F1','MMF':'#C9A84C','기타':'#94A3B8',
}

function RetBadge({ v }) {
  if (v == null) return <span style={{color:'var(--muted)'}}>--</span>
  const pos = v >= 0
  return <span className={pos ? styles.up : styles.dn}>{pos?'+':''}{v.toFixed(2)}%</span>
}

// ── KPI 스트립 ─────────────────────────────────────────
function FundKpiStrip({ data, stats }) {
  const totalAum = data.reduce((s,f) => s+f.aum, 0)
  const cards = [
    { label:'분석 펀드 수',  value:data.length.toLocaleString(), sub:'레버리지·인버스 제외', color:'#0EA5E9', w:100 },
    { label:'총 운용규모',   value:(totalAum/10000).toFixed(1)+'조', sub:'순자산 합계',     color:'var(--blue)', w:80 },
    { label:'1개월 1위',     value:stats.m1Top?(stats.m1Top.m1>=0?'+':'')+stats.m1Top.m1.toFixed(2)+'%':'--',
      sub:stats.m1Top?.name.substring(0,16)||'--', color:'var(--up)', w:100 },
    { label:'3개월 1위',     value:stats.m3Top?(stats.m3Top.m3>=0?'+':'')+stats.m3Top.m3.toFixed(2)+'%':'--',
      sub:stats.m3Top?.name.substring(0,16)||'--', color:'var(--gold)', w:100 },
    { label:'1년 1위',       value:stats.y1Top?(stats.y1Top.y1>=0?'+':'')+stats.y1Top.y1.toFixed(2)+'%':'--',
      sub:stats.y1Top?.name.substring(0,16)||'--', color:'#8B5CF6', w:100 },
  ]
  return (
    <div className={styles.kpiStrip}>
      {cards.map((c,i) => (
        <div key={i} className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{c.label}</div>
          <div className={styles.kpiVal} style={{color:c.color}}>{c.value}</div>
          <div className={styles.kpiSub}>{c.sub}</div>
          <div className={styles.kpiBarTrack}>
            <div style={{width:c.w+'%',height:'100%',background:c.color,borderRadius:2}} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── TOP5 패널 ─────────────────────────────────────────
function FundTop5({ title, data, metric, chipCls, selectedName, onSelect }) {
  const top5   = [...data].filter(f=>f[metric]!=null).sort((a,b)=>b[metric]-a[metric]).slice(0,5)
  const maxAum = Math.max(...top5.map(f=>f.aum), 1)

  return (
    <div className={styles.panel}>
      <div className={styles.panelHd}>
        <span className={`${styles.chip} ${styles[chipCls]}`}>{title.split(' ')[0]}</span>
        <span className={styles.panelTitle}>{title}</span>
      </div>
      {top5.map((f,i) => (
        <div key={f.name+i}
          className={`${styles.rankCard} ${selectedName===f.name?styles.rankActive:''}`}
          onClick={() => onSelect(f.name)}
        >
          <div className={styles.rankRow}>
            <span className={`${styles.rankNum} ${i===0?styles.r1:i===1?styles.r2:i===2?styles.r3:''}`}>
              {String(i+1).padStart(2,'0')}
            </span>
            <div className={styles.fundInfo}>
              <div className={styles.fundName} title={f.name}>{f.name}</div>
              <div className={styles.fundMeta}>
                <span className={styles.catChip} style={{background:CAT1_COLORS[f.cat1]+'22',color:CAT1_COLORS[f.cat1]}}>{f.cat1}</span>
                <span className={styles.mgrName}>{f.mgr}</span>
                {f.pension && <span className={styles.pensionBadge}>연금✓</span>}
                {f.risk && <span className={styles.riskBadge}>위험{f.risk}등급</span>}
              </div>
            </div>
            <div className={styles.retCol}>
              <div className={`${styles.retMain} ${(f[metric]??0)>=0?styles.up:styles.dn}`}>
                {(f[metric]>=0?'+':'')+f[metric].toFixed(2)+'%'}
              </div>
              <div className={styles.retSub}>
                1월<RetBadge v={f.m1}/>&nbsp;&nbsp;1년<RetBadge v={f.y1}/>
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

// ── 펀드 상세 카드 ─────────────────────────────────────
function FundDetail({ fund }) {
  if (!fund) return null
  return (
    <div className={styles.detailCard}>
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailName}>{fund.name}</div>
          <div className={styles.detailMeta}>
            <span className={styles.catChip} style={{background:CAT1_COLORS[fund.cat1]+'22',color:CAT1_COLORS[fund.cat1]}}>{fund.cat1}</span>
            <span style={{color:'rgba(255,255,255,.5)',fontSize:11}}>{fund.cat2}</span>
            <span style={{color:'rgba(255,255,255,.5)',fontSize:11}}>{fund.mgr}</span>
            {fund.pension && <span className={styles.pensionBadge}>연금✓</span>}
          </div>
        </div>
      </div>
      <div className={styles.detailRetGrid}>
        {[['1주',fund.w1],['1개월',fund.m1],['3개월',fund.m3],['6개월',fund.m6],['연초후',fund.ytd],['1년',fund.y1],['3년',fund.y3]].map(([lbl,v])=>(
          <div key={lbl} className={styles.detailRetCell}>
            <div className={styles.detailRetLabel}>{lbl}</div>
            <div className={`${styles.detailRetVal} ${v!=null?(v>=0?styles.up:styles.dn):''}`}>
              {v!=null?(v>=0?'+':'')+v.toFixed(2)+'%':'--'}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.detailInfoRow}>
        <div className={styles.detailInfoItem}><span className={styles.detailInfoLabel}>운용규모</span><span className={`${styles.detailInfoVal} ${styles.gold}`}>{fmtAum(fund.aum)}</span></div>
        <div className={styles.detailInfoItem}><span className={styles.detailInfoLabel}>총보수</span><span className={styles.detailInfoVal}>{fund.fee!=null?fund.fee.toFixed(2)+'%':'--'}</span></div>
        <div className={styles.detailInfoItem}><span className={styles.detailInfoLabel}>위험등급</span><span className={styles.detailInfoVal}>{RISK_LABEL[fund.risk]||fund.risk||'--'}</span></div>
        <div className={styles.detailInfoItem}><span className={styles.detailInfoLabel}>클래스 수</span><span className={styles.detailInfoVal}>{fund.classCount}개</span></div>
        <div className={styles.detailInfoItem}><span className={styles.detailInfoLabel}>설정일</span><span className={styles.detailInfoVal}>{fund.settleDate||'--'}</span></div>
      </div>
    </div>
  )
}

// ── 통계 섹션 ─────────────────────────────────────────
function FundStats({ data }) {
  const catMap = {}
  data.forEach(f=>{ if(!catMap[f.cat1]) catMap[f.cat1]={c:0,a:0}; catMap[f.cat1].c++; catMap[f.cat1].a+=f.aum })
  const cats   = Object.entries(catMap).sort((a,b)=>b[1].a-a[1].a)
  const maxAum = cats[0]?.[1].a || 1

  const mgrMap = {}
  data.forEach(f=>{ if(!mgrMap[f.mgr]) mgrMap[f.mgr]={c:0,a:0}; mgrMap[f.mgr].c++; mgrMap[f.mgr].a+=f.aum })
  const mgrs   = Object.entries(mgrMap).sort((a,b)=>b[1].a-a[1].a).slice(0,7)
  const maxMgr = mgrs[0]?.[1].a || 1

  return (
    <div className={styles.statsGrid}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>유형별 펀드 수 &amp; 운용규모</div>
        {cats.map(([cat,v])=>(
          <div key={cat} className={styles.catRow}>
            <span className={styles.catLabel}>{cat}</span>
            <div className={styles.catTrack}><div className={styles.catFill} style={{width:(v.a/maxAum*100).toFixed(1)+'%',background:CAT1_COLORS[cat]||'#94A3B8'}} /></div>
            <span className={styles.catVal}>{(v.a/10000).toFixed(1)}조·{v.c}개</span>
          </div>
        ))}
      </div>
      <div className={styles.card}>
        <div className={styles.cardTitle}>운용사 TOP 7 (AUM 기준)</div>
        {mgrs.map(([name,v],i)=>(
          <div key={name} className={styles.mgrItem}>
            <div className={styles.mgrTop}><span className={styles.mgrName}>{name}</span><span className={styles.mgrVal}>{v.c}개·{(v.a/10000).toFixed(1)}조</span></div>
            <div className={styles.mgrTrack}><div className={styles.mgrFill} style={{width:(v.a/maxMgr*100).toFixed(1)+'%',background:['#3B82F6','#10B981','#C9A84C','#8B5CF6','#EC4899','#14B8A6','#F97316'][i]}} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 비교 테이블 ───────────────────────────────────────
function FundTable({ data }) {
  const [sortKey, setSortKey] = useState('aum')
  const [sortDir, setSortDir] = useState(-1)
  const [catFilter,setCatFilter] = useState('전체')
  const [search, setSearch]  = useState('')

  const cats    = ['전체',...new Set(data.map(f=>f.cat1))]
  const filtered= data.filter(f=>{
    if (catFilter!=='전체' && f.cat1!==catFilter) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.mgr.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const sorted  = [...filtered].sort((a,b)=> sortDir*((b[sortKey]??-Infinity)-(a[sortKey]??-Infinity)))

  const th = (key,lbl) => (
    <th className={styles.thR} onClick={()=>{ setSortKey(key); setSortDir(d=>sortKey===key?d*-1:-1) }} style={{cursor:'pointer',userSelect:'none'}}>
      {lbl}{sortKey===key?(sortDir===-1?'▼':'▲'):''}
    </th>
  )

  return (
    <div className={styles.tableWrap}>
      <div className={styles.filterRow}>
        {cats.map(c=>(
          <button key={c} className={`${styles.filterBtn} ${catFilter===c?styles.filterActive:''}`} onClick={()=>setCatFilter(c)}>{c}</button>
        ))}
        <input className={styles.searchInput} placeholder="펀드명·운용사 검색..." value={search} onChange={e=>setSearch(e.target.value)} />
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
            {sorted.slice(0,100).map((f,i)=>(
              <tr key={f.name+i}>
                <td><div className={styles.fn}>{f.name.length>28?f.name.substring(0,28)+'…':f.name}</div><div className={styles.fc}>{f.cat2}</div></td>
                <td><span className={styles.catChip} style={{background:CAT1_COLORS[f.cat1]+'22',color:CAT1_COLORS[f.cat1]}}>{f.cat1}</span></td>
                <td className={styles.tdMgr}>{f.mgr}</td>
                <td className={styles.thR}><RetBadge v={f.w1}/></td>
                <td className={styles.thR}><RetBadge v={f.m1}/></td>
                <td className={styles.thR}><RetBadge v={f.m3}/></td>
                <td className={styles.thR}><RetBadge v={f.m6}/></td>
                <td className={styles.thR}><RetBadge v={f.ytd}/></td>
                <td className={styles.thR}><RetBadge v={f.y1}/></td>
                <td className={styles.thR}><RetBadge v={f.y3}/></td>
                <td className={`${styles.thR} ${styles.gold}`}>{fmtAum(f.aum)}</td>
                <td className={styles.thR}>{f.fee!=null?f.fee.toFixed(2)+'%':'--'}</td>
                <td className={styles.thC}>{RISK_LABEL[f.risk]||f.risk||'--'}</td>
                <td className={styles.thC}>{f.pension?<span className={styles.pensionBadge}>✓</span>:'--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length>100 && <div className={styles.moreHint}>상위 100개 표시 · 검색 또는 필터로 범위 조정</div>}
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────
export default function FundDashboard({ onBack }) {
  const [data,     setData]     = useState([])
  const [loadedAt, setLoadedAt] = useState(null)
  const [selectedName, setSelectedName] = useState(null)
  const fileRef = useRef()

  const handleFile = useCallback((e) => {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseFundWorkbook(ev.target.result)
        setData(rows); setLoadedAt(new Date())
        setSelectedName(null)
      } catch(err) { alert('파일 파싱 오류: ' + err.message) }
    }
    reader.readAsArrayBuffer(f)
  }, [])

  const stats = useMemo(() => {
    if (!data.length) return { m1Top:null, m3Top:null, y1Top:null }
    return {
      m1Top: [...data].filter(f=>f.m1!=null).sort((a,b)=>b.m1-a.m1)[0] || null,
      m3Top: [...data].filter(f=>f.m3!=null).sort((a,b)=>b.m3-a.m3)[0] || null,
      y1Top: [...data].filter(f=>f.y1!=null).sort((a,b)=>b.y1-a.y1)[0] || null,
    }
  }, [data])

  const selectedFund = data.find(f=>f.name===selectedName) || null
  const hasData = data.length > 0

  return (
    <div className={styles.layout}>
      {/* 사이드바 */}
      <FundSidebar onBack={onBack} onUpload={()=>fileRef.current.click()} loadedAt={loadedAt} count={data.length} />
      <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{display:'none'}} onChange={handleFile} />

      {/* 본문 */}
      <div className={styles.body}>
        {/* 상단바 */}
        <div className={styles.topbar}>
          <div className={styles.topLeft}>
            <span className={styles.breadcrumb}>
              Shinhan Premier <span className={styles.sep}>›</span>
              <strong>펀드 대시보드</strong>
            </span>
            {loadedAt && (
              <div className={styles.dateBadge}>
                <span className={styles.dateLabel}>기준일</span>
                <span className={styles.dateValue}>{loadedAt.toLocaleDateString('ko-KR')}</span>
              </div>
            )}
          </div>
          <div className={styles.topRight}>
            {hasData && <span className={styles.okBadge}>● {data.length}개 펀드 · 레버리지·인버스 제외</span>}
            <button className={styles.uploadBtn} onClick={()=>fileRef.current.click()}>
              📂 펀드 엑셀 업로드
            </button>
          </div>
        </div>

        <main className={styles.main}>
          {/* 빈 화면 */}
          {!hasData && (
            <div className={styles.empty}>
              <img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={styles.emptyLogo} />
              <div className={styles.emptyTitle}>펀드 데이터를 업로드하세요</div>
              <div className={styles.emptyDesc}>
                금융투자협회 펀드 데이터 엑셀 파일을 업로드하면<br/>
                <strong>종류A/B/C 자동 합산</strong> · <strong>레버리지·인버스 자동 제외</strong><br/>
                수익률은 종류별 평균값으로 단일화됩니다
              </div>
              <button className={styles.emptyBtn} onClick={()=>fileRef.current.click()}>
                📂 펀드 엑셀 업로드
              </button>
            </div>
          )}

          {/* 대시보드 */}
          {hasData && (
            <>
              {/* 기준일 배너 */}
              <div className={styles.banner}>
                <span className={styles.bannerDot} />
                <span className={styles.bannerDateLabel}>기준일</span>
                <span className={styles.bannerDateValue}>{loadedAt?.toLocaleDateString('ko-KR')}</span>
                <span className={styles.bannerText}>기준 데이터</span>
                <span className={styles.bannerRight}>{data.length}개 펀드 · 레버리지·인버스 제외</span>
              </div>

              {/* KPI */}
              <FundKpiStrip data={data} stats={stats} />

              {/* TOP5 — 1행 단기 */}
              <SectionHeader id="fund-top" title="기간별 수익률 우수 펀드 TOP 5" desc={`${data.length}개 펀드 · 종류별 수익률 평균`} />
              <div className={styles.rowLabel}>📅 단기 수익률</div>
              <div className={styles.panelRow}>
                <FundTop5 title="1개월 TOP 5" data={data} metric="m1" chipCls="chipM" selectedName={selectedName} onSelect={setSelectedName} />
                <FundTop5 title="3개월 TOP 5" data={data} metric="m3" chipCls="chipQ" selectedName={selectedName} onSelect={setSelectedName} />
                <FundTop5 title="6개월 TOP 5" data={data} metric="m6" chipCls="chipH" selectedName={selectedName} onSelect={setSelectedName} />
              </div>

              {/* TOP5 — 2행 중장기 */}
              <div className={styles.rowLabel}>📆 중장기 수익률</div>
              <div className={styles.panelRow}>
                <FundTop5 title="연초후 TOP 5" data={data} metric="ytd" chipCls="chipY" selectedName={selectedName} onSelect={setSelectedName} />
                <FundTop5 title="1년 TOP 5"   data={data} metric="y1"  chipCls="chipA" selectedName={selectedName} onSelect={setSelectedName} />
                <FundTop5 title="3년 TOP 5"   data={data} metric="y3"  chipCls="chipT" selectedName={selectedName} onSelect={setSelectedName} />
              </div>

              {/* 선택된 펀드 상세 */}
              {selectedFund && (
                <>
                  <SectionHeader id="fund-detail" title="선택 펀드 상세" desc="클릭한 펀드의 전체 기간 수익률" />
                  <FundDetail fund={selectedFund} />
                </>
              )}

              {/* 통계 */}
              <SectionHeader id="fund-stats" title="전체 펀드 통계" desc={`레버리지·인버스 제외 ${data.length}개 기준`} />
              <FundStats data={data} />

              {/* 비교 테이블 */}
              <SectionHeader id="fund-compare" title="전체 펀드 비교" desc="컬럼 클릭 시 정렬 · 검색 가능" />
              <FundTable data={data} />

              {/* 펀드 검색 */}
              <SectionHeader id="fund-search" title="펀드 검색" desc={`${data.length}개 즉시 검색`} />
              <div className={styles.fundSearchWrap}>
                <input className={styles.fundSearchInput} placeholder="펀드명 또는 운용사 입력..."
                  onChange={e => {
                    const q = e.target.value.toLowerCase()
                    const found = data.find(f => f.name.toLowerCase().includes(q) || f.mgr.toLowerCase().includes(q))
                    if (found) setSelectedName(found.name)
                  }}
                />
                <p className={styles.fundSearchHint}>입력하면 해당 펀드 상세가 위에 표시됩니다</p>
              </div>

              {/* 뉴스 */}
              <SectionHeader id="fund-news" title="펀드 주요뉴스" desc="구글 뉴스 RSS 실시간" />
              <NewsSection defaultKeyword="펀드" keywords={[
                { label:'펀드 전체',  query:'국내 펀드 수익률' },
                { label:'주식형',     query:'주식형펀드' },
                { label:'채권형',     query:'채권형펀드 금리' },
                { label:'해외펀드',   query:'해외펀드 수익률' },
                { label:'퇴직연금',   query:'퇴직연금 펀드' },
                { label:'공모펀드',   query:'공모펀드' },
              ]} />
            </>
          )}
        </main>

        <footer className={styles.footer}>
          데이터: 금융투자협회 · 레버리지·인버스 펀드 자동 제외 · 수익률은 종류별 평균이며 실제 성과와 다를 수 있습니다. 본 자료는 투자 권유 자료가 아닙니다.
        </footer>
      </div>
    </div>
  )
}
