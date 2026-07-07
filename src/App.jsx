import React,{useState,useMemo,useCallback,useEffect} from 'react'
import {useEligibility}   from './hooks/useEligibility.js'
import {useHistory}       from './hooks/useHistory.js'
import LandingPage        from './components/LandingPage.jsx'
import FundDashboard      from './components/FundDashboard.jsx'
import MarketIndicators   from './components/MarketIndicators.jsx'
import Sidebar            from './components/Sidebar.jsx'
import Topbar             from './components/Topbar.jsx'
import KpiStrip           from './components/KpiStrip.jsx'
import Top5Panels         from './components/Top5Panels.jsx'
import ConstituentPanel   from './components/ConstituentPanel.jsx'
import CompareTable       from './components/CompareTable.jsx'
import StatsSection       from './components/StatsSection.jsx'
import Heatmap            from './components/Heatmap.jsx'
import AccumRanking       from './components/AccumRanking.jsx'
import NewsSection        from './components/NewsSection.jsx'
import EtfSearch          from './components/EtfSearch.jsx'
import EtfCompare         from './components/EtfCompare.jsx'
import PdfReport          from './components/PdfReport.jsx'
import EligibilityModal   from './components/EligibilityModal.jsx'
import WeeklyUploadModal  from './components/WeeklyUploadModal.jsx'
import DateSelector       from './components/DateSelector.jsx'
import SectionHeader      from './components/SectionHeader.jsx'
import styles             from './App.module.css'
import { COPYRIGHT } from './utils/constants.js'


function useTop5(data){
  return useMemo(()=>{
    if(!data.length) return{top5w:[],top5m:[],top5q:[],top5m6:[],top5ytd:[],top5y1:[],allUnique:[]}
    const top5w=[...data].sort((a,b)=>b.w1-a.w1).slice(0,5)
    const top5m=[...data].sort((a,b)=>b.m1-a.m1).slice(0,5)
    const top5q=[...data].sort((a,b)=>b.m3-a.m3).slice(0,5)
    const top5m6=[...data].sort((a,b)=>b.m6-a.m6).slice(0,5)
    const top5ytd=[...data].sort((a,b)=>b.ytd-a.ytd).slice(0,5)
    const top5y1=[...data].sort((a,b)=>b.y1-a.y1).slice(0,5)
    const map=new Map()
    ;[[top5w,'w'],[top5m,'m'],[top5q,'q'],[top5m6,'m6'],[top5ytd,'ytd'],[top5y1,'y1']].forEach(([list,p])=>
      list.forEach(e=>{ if(!map.has(e.code)) map.set(e.code,{...e,periods:[]}); if(!map.get(e.code).periods.includes(p)) map.get(e.code).periods.push(p) })
    )
    return{top5w,top5m,top5q,top5m6,top5ytd,top5y1,allUnique:[...map.values()]}
  },[data])
}

function IndicatorPage({onBack}){
  return <div className={styles.indicatorWrap}>
    <div className={styles.indicatorTopbar}>
      <button className={styles.backBtn} onClick={onBack}>← 메인</button>
      <span className={styles.breadcrumb}>Shinhan Premier <span>›</span> <strong>주요 지표 현황</strong></span>
    </div>
    <div className={styles.indicatorMain}><MarketIndicators/></div>
  </div>
}

function EtfPage({onBack}){
  const{trust,pension,setTrust,setPension,elig}=useEligibility()
  const{history,currentEntry,selectedDate,setSelectedDate,dateList,saveWeek,accumRanking,hasHistory,loadingDB}=useHistory()
  const currentData=currentEntry?.snapshot||[]
  const{top5w,top5m,top5q,top5m6,top5ytd,top5y1,allUnique}=useTop5(currentData)
  const[selectedCode,setSelectedCode]=useState(null)
  const effectiveCode=selectedCode||top5w[0]?.code||null
  const[modalType,setModalType]=useState(null)
  const[showUpload,setShowUpload]=useState(false)
  const handleEligSave=useCallback(({date,codes})=>{ if(modalType==='trust') setTrust({date,codes}); else setPension({date,codes}); setModalType(null) },[modalType,setTrust,setPension])
  const handleWeekSave=useCallback(async(date,parsed)=>{ await saveWeek(date,parsed); setShowUpload(false); setSelectedDate(null) },[saveWeek,setSelectedDate])
  const hasData=currentData.length>0

  if(loadingDB) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'var(--bg)'}}><img src="./images/logo-gold-vertical.png" alt="신한 Premier" style={{width:100,marginBottom:16}}/><div style={{color:'var(--muted)',fontSize:13}}>데이터 불러오는 중...</div></div>

  return <div className={styles.layout}>
    <Sidebar trust={trust} pension={pension} onOpenModal={setModalType} onOpenUpload={()=>setShowUpload(true)} historyCount={history.length} onBack={onBack}/>
    <div className={styles.body}>
      <Topbar status={hasData?'ok':'idle'} loadedAt={currentEntry?new Date(currentEntry.date):null} onOpenUpload={()=>setShowUpload(true)} onOpenModal={setModalType}
        extraLeft={<DateSelector dateList={dateList} selectedDate={selectedDate} onSelect={setSelectedDate}/>}/>
      <main className={styles.main}>
        {!hasData&&<div className={styles.emptyCard}>
          <img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={styles.emptyLogoImg}/>
          <div className={styles.emptyTitle}>첫 번째 주간 데이터를 업로드하세요</div>
          <div className={styles.emptyDesc}>매주 일요일 funetf.co.kr에서 엑셀을 다운받아 업로드하면<br/>대시보드가 구성되고 <strong>모든 사용자가 함께 볼 수 있습니다.</strong></div>
          <button className={styles.emptyBtn} onClick={()=>setShowUpload(true)}>📅 지금 첫 데이터 업로드하기</button>
        </div>}
        {hasData&&<>
          {currentEntry&&<div className={styles.currentBanner}>
            <span className={styles.bannerDot}/>
            <span className={styles.bannerDateLabel}>기준일</span>
            <span className={styles.bannerDateValue}>{currentEntry.date}</span>
            <span className={styles.bannerText}>기준 데이터</span>
            {selectedDate&&<button className={styles.backToLatest} onClick={()=>setSelectedDate(null)}>← 최신으로</button>}
            <span className={styles.bannerRight}>{currentData.length}종목 · 레버리지·인버스 제외</span>
          </div>}
          <KpiStrip data={currentData}/>
          <SectionHeader id="sec-top" title="기간별 수익률 우수 ETF TOP 5" desc={`${currentEntry?.date} 기준 · ${currentData.length}종목`}/>
          <Top5Panels top5w={top5w} top5m={top5m} top5q={top5q} top5m6={top5m6} top5ytd={top5ytd} top5y1={top5y1} selectedCode={effectiveCode} onSelect={setSelectedCode} elig={elig}/>
          <SectionHeader id="sec-const" title="우수 ETF 구성종목 현황" desc="상위 3개 구성종목"/>
          <ConstituentPanel allUnique={allUnique} selectedCode={effectiveCode} onSelect={setSelectedCode} allData={currentData} elig={elig}/>
          <SectionHeader id="sec-compare" title="우수 ETF 멀티기간 비교" desc="신탁·퇴직연금 가능 여부 포함"/>
          <CompareTable allUnique={allUnique} elig={elig}/>
          <SectionHeader id="sec-stats" title="전체 ETF 통계" desc={`레버리지·인버스 제외 ${currentData.length}종목`}/>
          <StatsSection data={currentData}/>
          <SectionHeader id="sec-heat" title="주간 수익률 TOP 15 히트맵" desc="레버리지·인버스 제외"/>
          <Heatmap data={currentData} onSelect={setSelectedCode} elig={elig}/>
          <SectionHeader id="sec-accum" title="TOP5 누적 랭킹" desc={`${history.length}주 누적`}/>
          <AccumRanking ranking={accumRanking} totalWeeks={history.length}/>
          <SectionHeader id="sec-etfcompare" title="ETF 비교 모드" desc="최대 3개 선택 → 기간별 수익률 한눈에 비교"/>
          <EtfCompare allData={currentData}/>
          <SectionHeader id="sec-search" title="ETF 검색" desc={`${currentData.length}종목 즉시검색 · 없으면 AI가 찾아드립니다`}/>
          <EtfSearch allData={currentData} elig={elig}/>
          <SectionHeader id="sec-report" title="PDF 보고서 생성" desc="ETF · 펀드 TOP5 자동 생성 → 인쇄 / PDF 저장"/>
          <PdfReport etfData={currentData} fundData={[]} selectedDate={currentEntry?.date} fearGreed={null} quotes={{}}/>
          <SectionHeader id="sec-news" title="ETF 주요뉴스" desc="구글 뉴스 RSS 실시간"/>
          <NewsSection/>
        </>}
      </main>
      <footer className={styles.footer}>데이터: <strong>funetf.co.kr</strong> · 레버리지·인버스 제외 · 수익률은 NAV 기준 · 본 자료는 투자 권유 자료가 아닙니다.<br/>{COPYRIGHT}</footer>
    </div>
    {modalType&&<EligibilityModal type={modalType} existing={modalType==='trust'?trust:pension} etfData={currentData} onSave={handleEligSave} onClose={()=>setModalType(null)}/>}
    {showUpload&&<WeeklyUploadModal onSave={handleWeekSave} onClose={()=>setShowUpload(false)}/>}
  </div>
}

export default function App(){
  const[page,setPage]=useState('landing')
  if(page==='indicator') return <IndicatorPage onBack={()=>setPage('landing')}/>
  if(page==='etf')       return <EtfPage onBack={()=>setPage('landing')}/>
  if(page==='fund')      return <FundDashboard onBack={()=>setPage('landing')}/>
  return <LandingPage onSelect={setPage}/>
}
