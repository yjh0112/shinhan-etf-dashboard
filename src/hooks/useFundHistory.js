import { useState, useEffect, useCallback } from 'react'
import { saveFundToDB, loadFundDateListFromDB, loadFundSnapshotFromDB } from '../utils/supabase.js'

export function useFundHistory() {
  const [dateList,    setDateList]    = useState([])
  const [selectedDate,setSelectedDate]= useState(null)
  const [currentData, setCurrentData] = useState([])
  const [loadingDB,   setLoadingDB]   = useState(true)
  const [loadingSnap, setLoadingSnap] = useState(false)
  const [saving,      setSaving]      = useState(false)

  const loadSnapshot = useCallback(async(date)=>{
    setLoadingSnap(true)
    try {
      const snap = await loadFundSnapshotFromDB(date)
      setCurrentData(snap); setSelectedDate(date)
    } catch(e){ console.error('펀드 스냅샷 로드 실패:',e) }
    finally { setLoadingSnap(false); setLoadingDB(false) }
  },[])

  useEffect(()=>{
    loadFundDateListFromDB().then(rows=>{
      setDateList(rows)
      if (rows.length>0) loadSnapshot(rows[0].load_date)
      else setLoadingDB(false)
    }).catch(e=>{ console.error('펀드 날짜 목록 로드 실패:',e); setLoadingDB(false) })
  },[])

  const selectDate = useCallback((date)=>{
    if (!date) { if(dateList.length>0) loadSnapshot(dateList[0].load_date) }
    else loadSnapshot(date)
  },[dateList,loadSnapshot])

  const saveFund = useCallback(async(date,parsedData)=>{
    setSaving(true)
    try {
      await saveFundToDB(date,parsedData)
      const rows = await loadFundDateListFromDB()
      setDateList(rows); setCurrentData(parsedData); setSelectedDate(date)
    } catch(e){ throw e }
    finally { setSaving(false) }
  },[])

  const latestDate = dateList[0]?.load_date || null
  const isLatest   = !selectedDate || selectedDate===latestDate

  return { dateList, selectedDate, currentData, loadingDB, loadingSnap, saving, hasData:currentData.length>0, isLatest, latestDate, selectDate, saveFund }
}
