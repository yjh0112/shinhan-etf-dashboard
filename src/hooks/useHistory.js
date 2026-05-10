import { useState, useEffect, useCallback } from 'react'
import { saveWeekToDB, loadHistoryFromDB } from '../utils/supabase.js'

function getWeekKey(dateStr) {
  const d=new Date(dateStr), jan4=new Date(d.getFullYear(),0,4)
  const sw=new Date(jan4); sw.setDate(jan4.getDate()-jan4.getDay()+1)
  const week=Math.floor((d-sw)/(7*24*60*60*1000))+1
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`
}
function getTop5(data,key) {
  return [...data].sort((a,b)=>b[key]-a[key]).slice(0,5).map(e=>({
    code:e.code,name:e.name,cat:e.cat,mgr:e.mgr,
    d1:e.d1,w1:e.w1,m1:e.m1,m3:e.m3,m6:e.m6,ytd:e.ytd,fee:e.fee,aum:e.aum,
  }))
}
export function calcAccumRanking(history) {
  const map={}
  history.forEach(entry=>{
    const add=(list,type)=>{ if(!list) return; list.forEach(etf=>{ if(!map[etf.code]) map[etf.code]={code:etf.code,name:etf.name,cat:etf.cat,mgr:etf.mgr,counts:{w:0,m:0,q:0},total:0,weeks:[]}; map[etf.code].counts[type]++; map[etf.code].total++; const wk=entry.week_key||entry.week; if(!map[etf.code].weeks.includes(wk)) map[etf.code].weeks.push(wk) }) }
    add(entry.top5w,'w'); add(entry.top5m,'m'); add(entry.top5q,'q')
  })
  return Object.values(map).sort((a,b)=>b.total-a.total)
}
export function useHistory() {
  const [history,     setHistory]     = useState([])
  const [selectedDate,setSelectedDate]= useState(null)
  const [loadingDB,   setLoadingDB]   = useState(true)
  useEffect(()=>{
    loadHistoryFromDB().then(rows=>{
      const converted=rows.map(r=>({
        date:r.week_date, week:r.week_key, week_key:r.week_key,
        snapshot:r.snapshot, top5w:r.top5w, top5m:r.top5m, top5q:r.top5q,
      }))
      setHistory(converted)
    }).catch(e=>console.error('ETF 히스토리 로드 실패:',e)).finally(()=>setLoadingDB(false))
  },[])
  const saveWeek = useCallback(async(date,allData)=>{
    const weekKey=getWeekKey(date)
    const top5w=getTop5(allData,'w1'), top5m=getTop5(allData,'m1'), top5q=getTop5(allData,'m3')
    const snapshot=allData.map(e=>({
      code:e.code,name:e.name,cat:e.cat,mgr:e.mgr,
      d1:e.d1,w1:e.w1,m1:e.m1,m3:e.m3,m6:e.m6,ytd:e.ytd,y1:e.y1,fee:e.fee,aum:e.aum,
      top1:e.top1,t1r:e.t1r,top2:e.top2,t2r:e.t2r,top3:e.top3,t3r:e.t3r,
    }))
    await saveWeekToDB(date,weekKey,snapshot,top5w,top5m,top5q)
    const newEntry={date,week:weekKey,week_key:weekKey,snapshot,top5w,top5m,top5q}
    setHistory(prev=>{
      const filtered=prev.filter(e=>e.date!==date)
      return [newEntry,...filtered].sort((a,b)=>new Date(b.date)-new Date(a.date))
    })
    return newEntry
  },[])
  const currentEntry = selectedDate ? history.find(e=>e.date===selectedDate)||history[0] : history[0]
  const accumRanking = calcAccumRanking(history)
  const dateList     = history.map(e=>({date:e.date,week:e.week_key}))
  return { history, currentEntry, selectedDate, setSelectedDate, dateList, saveWeek, accumRanking, hasHistory:history.length>0, loadingDB }
}
