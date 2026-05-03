/**
 * useFundHistory — Supabase 기반 펀드 데이터 히스토리 관리
 * - 업로드 시 DB 저장 → 모든 사용자 공유
 * - 날짜 선택으로 과거 데이터 조회
 */
import { useState, useEffect, useCallback } from 'react'
import {
  saveFundToDB,
  loadFundDateListFromDB,
  loadFundSnapshotFromDB,
} from '../utils/supabase.js'

export function useFundHistory() {
  const [dateList,     setDateList]     = useState([])   // [{id, load_date}]
  const [selectedDate, setSelectedDate] = useState(null) // null = 최신
  const [currentData,  setCurrentData]  = useState([])   // 현재 보여줄 스냅샷
  const [loadingDB,    setLoadingDB]    = useState(true)
  const [loadingSnap,  setLoadingSnap]  = useState(false)
  const [saving,       setSaving]       = useState(false)

  // ── 날짜 목록 로드 (앱 시작 시) ─────────────────────
  useEffect(() => {
    loadFundDateListFromDB()
      .then(rows => {
        setDateList(rows)
        // 최신 데이터 자동 로드
        if (rows.length > 0) {
          loadSnapshot(rows[0].load_date)
        } else {
          setLoadingDB(false)
        }
      })
      .catch(e => { console.error('펀드 날짜 목록 로드 실패:', e); setLoadingDB(false) })
  }, [])

  // ── 스냅샷 로드 ──────────────────────────────────────
  const loadSnapshot = useCallback(async (date) => {
    setLoadingSnap(true)
    try {
      const snap = await loadFundSnapshotFromDB(date)
      setCurrentData(snap)
      setSelectedDate(date)
    } catch (e) {
      console.error('펀드 스냅샷 로드 실패:', e)
    } finally {
      setLoadingSnap(false)
      setLoadingDB(false)
    }
  }, [])

  // ── 날짜 선택 ────────────────────────────────────────
  const selectDate = useCallback((date) => {
    if (!date) {
      // 최신으로 돌아가기
      if (dateList.length > 0) loadSnapshot(dateList[0].load_date)
    } else {
      loadSnapshot(date)
    }
  }, [dateList, loadSnapshot])

  // ── 펀드 데이터 저장 ──────────────────────────────────
  const saveFund = useCallback(async (date, parsedData) => {
    setSaving(true)
    try {
      await saveFundToDB(date, parsedData)
      // 날짜 목록 갱신
      const rows = await loadFundDateListFromDB()
      setDateList(rows)
      // 방금 올린 날짜로 전환
      setCurrentData(parsedData)
      setSelectedDate(date)
    } catch (e) {
      console.error('펀드 저장 실패:', e)
      throw e
    } finally {
      setSaving(false)
    }
  }, [])

  const latestDate  = dateList[0]?.load_date || null
  const isLatest    = !selectedDate || selectedDate === latestDate
  const hasData     = currentData.length > 0

  return {
    dateList,
    selectedDate,
    currentData,
    loadingDB,
    loadingSnap,
    saving,
    hasData,
    isLatest,
    latestDate,
    selectDate,
    saveFund,
  }
}
