import React, { useState, useCallback } from 'react'
import { useFundHistory }   from '../hooks/useFundHistory.js'
import { fmtAum }          from '../utils/constants.js'
import FundSidebar          from './FundSidebar.jsx'
import FundUploadModal      from './FundUploadModal.jsx'
import NewsSection          from './NewsSection.jsx'
import SectionHeader        from './SectionHeader.jsx'
import s                    from './FundDashboard.module.css'

const RISK={'1':'1(매우高)','2':'2(高)','3':'3(중高)','4':'4(중低)','5':'5(低)','6':'6(매우低)'}
const CAT1C={'국내주식':'#10B981','해외주식':'#3B82F6','혼합':'#8B5CF6','국내채권':'#14B8A6','해외채권':'#6366F1','MMF':'#C9A84C','기타':'#94A3B8'}
const FNEWS=[{label:'펀드 전체',query:'국내 펀드 수익률'},{label:'주식형',query:'주식형펀드'},{label:'채권형',query:'채권형펀드'},{label:'해외펀드',query:'해외펀드 수익률'},{label:'퇴직연금',query:'퇴직연금 펀드'},{label:'공모펀드',query:'공모펀드'}]
const CATG=[{key:'전체',label:'전체',f:()=>true},{key:'주식형',label:'📈 주식형',f:f=>['국내주식','해외주식'].includes(f.cat1)},{key:'채권형',label:'📉 채권형',f:f=>['국내채권','해외채권'].includes(f.cat1)},{key:'혼합형',label:'⚖️ 혼합형',f:f=>f.cat1==='혼합'},{key:'기타',label:'기타',f:f=>['MMF','기타'].includes(f.cat1)}]

function Ret({v}){ if(v==null) return <span style={{color:'var(--muted)'}}>--</span>; const p=v>=0; return <span className={p?s.up:s.dn}>{p?'+':''}{v.toFixed(2)}%</span> }

function DateSel({dateList,selectedDate,onSelect}){
  if(!dateList.length) return null
  return <div className={s.dateSel}><span className={s.dateSelLabel}>📅 기준일</span><select className={s.dateSelInput} value={selectedDate||''} onChange={e=>onSelect(e.target.value||null)}><option value="">최신 ({dateList[0]?.load_date})</option>{dateList.slice(1).map(d=><option key={d.load_date} value={d.load_date}>{d.load_date}</option>)}</select><span className={s.dateSelCount}>{dateList.length}회</span></div>
}

function KPI({data}){
  const tot=data.reduce((a,f)=>a+f.aum,0)
  const m1t=[...data].filter(f=>f.m1!=null).sort((a,b)=>b.m1-a.m1)[0]
  const m3t=[...data].filter(f=>f.m3!=null).sort((a,b)=>b.m3-a.m3)[0]
  const y1t=[...data].filter(f=>f.y1!=null).sort((a,b)=>b.y1-a.y1)[0]
  return <div className={s.kpiStrip}>{[
    {l:'분석 펀드 수',v:data.length.toLocaleString(),sub:'레버리지·인버스 제외',c:'#0EA5E9'},
    {l:'총 운용규모',v:(tot/10000).toFixed(1)+'조',sub:'순자산 합계',c:'var(--blue)'},
    {l:'1개월 1위',v:m1t?(m1t.m1>=0?'+':'')+m1t.m1.toFixed(2)+'%':'--',sub:m1t?.name.substring(0,16)||'--',c:'var(--up)'},
    {l:'3개월 1위',v:m3t?(m3t.m3>=0?'+':'')+m3t.m3.toFixed(2)+'%':'--',sub:m3t?.name.substring(0,16)||'--',c:'var(--gold)'},
    {l:'1년 1위',v:y1t?(y1t.y1>=0?'+':'')+y1t.y1.toFixed(2)+'%':'--',sub:y1t?.name.substring(0,16)||'--',c:'#8B5CF6'},
  ].map((c,i)=><div key={i} className={s.kpiCard}><div className={s.kpiLabel}>{c.l}</div><div className={s.kpiVal} style={{color:c.c}}>{c.v}</div><div className={s.kpiSub}>{c.sub}</div><div className={s.kpiBarTrack}><div style={{width:'100%',height:'100%',background:c.c,borderRadius:2}}/></div></div>)}</div>
}

function Top5({title,data,metric,chipCls,sel,onSel}){
  const top5=[...data].filter(f=>f[metric]!=null).sort((a,b)=>b[metric]-a[metric]).slice(0,5)
  const maxA=Math.max(...top5.map(f=>f.aum),1)
  return <div className={s.panel}>
    <div className={s.panelHd}><span className={`${s.chip} ${s[chipCls]}`}>{title.split(' ')[0]}</span><span className={s.panelTitle}>{title}</span></div>
    {!top5.length&&<div style={{padding:'20px',textAlign:'center',color:'var(--muted)',fontSize:12}}>데이터 없음</div>}
    {top5.map((f,i)=><div key={i} className={`${s.rankCard} ${sel===f.name?s.rankActive:''}`} onClick={()=>onSel(f.name)}>
      <div className={s.rankRow}>
        <span className={`${s.rankNum} ${i===0?s.r1:i===1?s.r2:i===2?s.r3:''}`}>{String(i+1).padStart(2,'0')}</span>
        <div className={s.fundInfo}>
          <div className={s.fundName}>{f.name}</div>
          <div className={s.fundMeta}><span className={s.catChip} style={{background:CAT1C[f.cat1]+'22',color:CAT1C[f.cat1]}}>{f.cat1}</span><span className={s.mgrName}>{f.mgr}</span>{f.pension&&<span className={s.pensionBadge}>연금✓</span>}</div>
        </div>
        <div className={s.retCol}><div className={`${s.retMain} ${f[metric]>=0?s.up:s.dn}`}>{(f[metric]>=0?'+':'')+f[metric].toFixed(2)+'%'}</div><div className={s.retSub}>1월<Ret v={f.m1}/>&nbsp;1년<Ret v={f.y1}/></div></div>
      </div>
      <div className={s.aumRow}><div className={s.aumTrack}><div className={s.aumFill} style={{width:(f.aum/maxA*100).toFixed(1)+'%'}}/></div><span className={s.aumLabel}>AUM {fmtAum(f.aum)}</span></div>
    </div>)}
  </div>
}

function Top5Sec({data,sel,onSel}){
  const [cat,setCat]=useState('전체')
  const g=CATG.find(x=>x.key===cat)||CATG[0]
  const fd=data.filter(g.f)
  const R1=[{title:'1개월 TOP 5',metric:'m1',chipCls:'chipM'},{title:'3개월 TOP 5',metric:'m3',chipCls:'chipQ'},{title:'6개월 TOP 5',metric:'m6',chipCls:'chipH'}]
  const R2=[{title:'연초후 TOP 5',metric:'ytd',chipCls:'chipY'},{title:'1년 TOP 5',metric:'y1',chipCls:'chipA'},{title:'3년 TOP 5',metric:'y3',chipCls:'chipT'}]
  return <>
    <div className={s.catTabRow}>{CATG.map(g=><button key={g.key} className={`${s.catTab} ${cat===g.key?s.catTabActive:''}`} onClick={()=>setCat(g.key)}>{g.label}<span className={s.catTabCount}>{data.filter(g.f).length}</span></button>)}</div>
    <div className={s.rowLabel}>📅 단기 수익률</div>
    <div className={s.panelRow}>{R1.map(p=><Top5 key={p.metric} {...p} data={fd} sel={sel} onSel={onSel}/>)}</div>
    <div className={s.rowLabel}>📆 중장기 수익률</div>
    <div className={s.panelRow}>{R2.map(p=><Top5 key={p.metric} {...p} data={fd} sel={sel} onSel={onSel}/>)}</div>
  </>
}

function Detail({fund,onClose}){
  return <div className={s.detailCard}>
    <div className={s.detailHeader}>
      <div><div className={s.detailName}>{fund.name}</div><div className={s.detailMeta}><span className={s.catChip} style={{background:CAT1C[fund.cat1]+'22',color:CAT1C[fund.cat1]}}>{fund.cat1}</span><span style={{color:'rgba(255,255,255,.5)',fontSize:11}}>{fund.mgr}</span>{fund.pension&&<span className={s.pensionBadge}>연금✓</span>}</div></div>
      <button className={s.detailClose} onClick={onClose}>✕</button>
    </div>
    <div className={s.detailRetGrid}>{[['1주',fund.w1],['1개월',fund.m1],['3개월',fund.m3],['6개월',fund.m6],['연초후',fund.ytd],['1년',fund.y1],['3년',fund.y3]].map(([l,v])=><div key={l} className={s.detailRetCell}><div className={s.detailRetLabel}>{l}</div><div className={`${s.detailRetVal} ${v!=null?(v>=0?s.up:s.dn):''}`}>{v!=null?(v>=0?'+':'')+v.toFixed(2)+'%':'--'}</div></div>)}</div>
    <div className={s.detailInfoRow}>{[['운용규모',fmtAum(fund.aum),s.gold],['총보수',fund.fee!=null?fund.fee.toFixed(2)+'%':'--',''],['위험등급',RISK[fund.risk]||'--',''],['클래스',fund.classCount+'개',''],['설정일',fund.settleDate||'--','']].map(([l,v,c])=><div key={l} className={s.detailInfoItem}><span className={s.detailInfoLabel}>{l}</span><span className={`${s.detailInfoVal} ${c}`}>{v}</span></div>)}</div>
  </div>
}

function Stats({data}){
  const cm={},mm={}
  data.forEach(f=>{ if(!cm[f.cat1]) cm[f.cat1]={c:0,a:0}; cm[f.cat1].c++; cm[f.cat1].a+=f.aum; if(!mm[f.mgr]) mm[f.mgr]={c:0,a:0}; mm[f.mgr].c++; mm[f.mgr].a+=f.aum })
  const cats=Object.entries(cm).sort((a,b)=>b[1].a-a[1].a), mgrs=Object.entries(mm).sort((a,b)=>b[1].a-a[1].a).slice(0,7)
  const maxA=cats[0]?.[1].a||1, maxM=mgrs[0]?.[1].a||1
  const CLR=['#3B82F6','#10B981','#C9A84C','#8B5CF6','#EC4899','#14B8A6','#F97316']
  return <div className={s.statsGrid}>
    <div className={s.card}><div className={s.cardTitle}>유형별 펀드 수 &amp; 운용규모</div>{cats.map(([c,v])=><div key={c} className={s.catRow}><span className={s.catLabel}>{c}</span><div className={s.catTrack}><div className={s.catFill} style={{width:(v.a/maxA*100).toFixed(1)+'%',background:CAT1C[c]||'#94A3B8'}}/></div><span className={s.catVal}>{(v.a/10000).toFixed(1)}조·{v.c}개</span></div>)}</div>
    <div className={s.card}><div className={s.cardTitle}>운용사 TOP 7</div>{mgrs.map(([n,v],i)=><div key={n} className={s.mgrItem}><div className={s.mgrTop}><span className={s.mgrName}>{n}</span><span className={s.mgrVal}>{v.c}개·{(v.a/10000).toFixed(1)}조</span></div><div className={s.mgrTrack}><div className={s.mgrFill} style={{width:(v.a/maxM*100).toFixed(1)+'%',background:CLR[i]}}/></div></div>)}</div>
  </div>
}

function Table({data}){
  const [sk,setSk]=useState('aum'),[sd,setSd]=useState(-1),[cf,setCf]=useState('전체'),[q,setQ]=useState('')
  const cats=['전체',...new Set(data.map(f=>f.cat1))]
  const fd=data.filter(f=>{if(cf!=='전체'&&f.cat1!==cf)return false;if(q&&!f.name.toLowerCase().includes(q.toLowerCase())&&!f.mgr.toLowerCase().includes(q.toLowerCase()))return false;return true})
  const sorted=[...fd].sort((a,b)=>sd*((b[sk]??-Infinity)-(a[sk]??-Infinity)))
  const th=(key,lbl)=><th className={s.thR} onClick={()=>{setSk(key);setSd(d=>sk===key?d*-1:-1)}} style={{cursor:'pointer',userSelect:'none'}}>{lbl}{sk===key?(sd===-1?'▼':'▲'):''}</th>
  return <div className={s.tableWrap}>
    <div className={s.filterRow}>{cats.map(c=><button key={c} className={`${s.filterBtn} ${cf===c?s.filterActive:''}`} onClick={()=>setCf(c)}>{c}</button>)}<input className={s.searchInput} placeholder="펀드명·운용사..." value={q} onChange={e=>setQ(e.target.value)}/><span className={s.tableCount}>{sorted.length}개</span></div>
    <div style={{overflowX:'auto'}}><table className={s.table}><thead><tr><th>펀드명</th><th>유형</th><th>운용사</th>{th('w1','1주')}{th('m1','1개월')}{th('m3','3개월')}{th('m6','6개월')}{th('ytd','연초후')}{th('y1','1년')}{th('y3','3년')}{th('aum','운용규모')}<th className={s.thR}>총보수</th><th className={s.thC}>위험</th><th className={s.thC}>연금</th></tr></thead>
    <tbody>{sorted.slice(0,100).map((f,i)=><tr key={i}><td><div className={s.fn}>{f.name.length>28?f.name.substring(0,28)+'…':f.name}</div><div className={s.fc}>{f.cat2}</div></td><td><span className={s.catChip} style={{background:CAT1C[f.cat1]+'22',color:CAT1C[f.cat1]}}>{f.cat1}</span></td><td className={s.tdMgr}>{f.mgr}</td><td className={s.thR}><Ret v={f.w1}/></td><td className={s.thR}><Ret v={f.m1}/></td><td className={s.thR}><Ret v={f.m3}/></td><td className={s.thR}><Ret v={f.m6}/></td><td className={s.thR}><Ret v={f.ytd}/></td><td className={s.thR}><Ret v={f.y1}/></td><td className={s.thR}><Ret v={f.y3}/></td><td className={`${s.thR} ${s.gold}`}>{fmtAum(f.aum)}</td><td className={s.thR}>{f.fee!=null?f.fee.toFixed(2)+'%':'--'}</td><td className={s.thC}>{RISK[f.risk]||'--'}</td><td className={s.thC}>{f.pension?<span className={s.pensionBadge}>✓</span>:'--'}</td></tr>)}</tbody></table>
    {sorted.length>100&&<div className={s.moreHint}>상위 100개 표시</div>}</div>
  </div>
}

export default function FundDashboard({onBack}){
  const {dateList,selectedDate,currentData,loadingDB,loadingSnap,saving,hasData,isLatest,selectDate,saveFund}=useFundHistory()
  const [showUpload,setShowUpload]=useState(false)
  const [sel,setSel]=useState(null)
  const sf=currentData.find(f=>f.name===sel)||null
  const handleSave=useCallback(async(date,parsed)=>{ try{await saveFund(date,parsed);setShowUpload(false);setSel(null)}catch(e){alert('저장 실패: '+e.message)} },[saveFund])

  if(loadingDB) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'var(--bg)'}}><img src="./images/logo-gold-vertical.png" alt="신한 Premier" style={{width:100,marginBottom:16}}/><div style={{color:'var(--muted)',fontSize:13}}>펀드 데이터 불러오는 중...</div></div>

  return <div className={s.layout}>
    <FundSidebar onBack={onBack} onUpload={()=>setShowUpload(true)} loadedAt={selectedDate?new Date(selectedDate):null} count={currentData.length}/>
    <div className={s.body}>
      <div className={s.topbar}>
        <div className={s.topLeft}>
          <span className={s.breadcrumb}>Shinhan Premier <span className={s.sep}>›</span> <strong>펀드 대시보드</strong></span>
          <DateSel dateList={dateList} selectedDate={selectedDate} onSelect={selectDate}/>
        </div>
        <div className={s.topRight}>
          {hasData&&<span className={s.okBadge}>● {currentData.length}개 펀드 · 레버리지·인버스 제외</span>}
          <button className={s.uploadBtn} onClick={()=>setShowUpload(true)}>📂 펀드 데이터 업로드</button>
        </div>
      </div>
      <main className={s.main}>
        {loadingSnap&&<div style={{textAlign:'center',padding:'60px',color:'var(--muted)'}}><span className="spin">⟳</span> 불러오는 중...</div>}
        {!loadingSnap&&!hasData&&<div className={s.empty}><img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={s.emptyLogo}/><div className={s.emptyTitle}>펀드 데이터를 업로드하세요</div><div className={s.emptyDesc}>금융투자협회 펀드 엑셀 파일 업로드 →<br/><strong>종류 자동 합산</strong> · <strong>레버리지·인버스 제외</strong> · <strong>Supabase 공유 저장</strong></div><button className={s.emptyBtn} onClick={()=>setShowUpload(true)}>📂 지금 업로드하기</button></div>}
        {!loadingSnap&&hasData&&<>
          <div className={s.banner}><span className={s.bannerDot}/><span className={s.bannerDateLabel}>기준일</span><span className={s.bannerDateValue}>{selectedDate}</span><span className={s.bannerText}>기준 데이터</span>{!isLatest&&<button className={s.backToLatest} onClick={()=>selectDate(null)}>← 최신으로</button>}<span className={s.bannerRight}>{currentData.length}개 펀드 · 레버리지·인버스 제외 · 종류 합산</span></div>
          <KPI data={currentData}/>
          <SectionHeader id="fund-top" title="기간별 수익률 우수 펀드 TOP 5" desc={`${currentData.length}개 펀드 · 유형 탭으로 분류`}/>
          <Top5Sec data={currentData} sel={sel} onSel={setSel}/>
          {sf&&<><SectionHeader id="fund-detail" title="선택 펀드 상세" desc="전체 기간 수익률"/><Detail fund={sf} onClose={()=>setSel(null)}/></>}
          <SectionHeader id="fund-stats" title="전체 펀드 통계" desc={`${currentData.length}개 기준`}/>
          <Stats data={currentData}/>
          <SectionHeader id="fund-compare" title="전체 펀드 비교" desc="컬럼 클릭 정렬"/>
          <Table data={currentData}/>
          <SectionHeader id="fund-news" title="펀드 주요뉴스" desc="Google RSS 실시간"/>
          <NewsSection keywords={FNEWS}/>
        </>}
      </main>
      <footer className={s.footer}>데이터: 금융투자협회 · 레버리지·인버스 제외 · 수익률은 종류별 평균 · 투자 권유 자료 아님</footer>
    </div>
    {showUpload&&<FundUploadModal onSave={handleSave} onClose={()=>setShowUpload(false)} saving={saving}/>}
  </div>
}
