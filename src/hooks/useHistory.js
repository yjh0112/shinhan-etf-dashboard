/**
 * useHistory — 주차별 ETF 데이터 누적 관리
 *
 * localStorage 구조:
 * etf_history = [
 *   {
 *     date: "2026-04-13",        // 기준일 (일요일)
 *     week: "2026-W15",          // 주차 키
 *     top5w: [...],              // 주간 TOP5
 *     top5m: [...],              // 1개월 TOP5
 *     top5q: [...],              // 3개월 TOP5
 *     snapshot: [...],           // 전체 데이터 스냅샷 (레버리지 제외)
 *   },
 *   ...
 * ]
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'etf_history'
const MAX_WEEKS   = 52   // 최대 1년치 보관

// ── 주차 키 계산 (ISO 주차) ──────────────────────────
function getWeekKey(dateStr) {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - jan4.getDay() + 1)
  const diff = d - startOfWeek1
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

// ── localStorage 로드 ────────────────────────────────
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

// ── localStorage 저장 ────────────────────────────────
function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (e) {
    console.warn('히스토리 저장 실패:', e)
  }
}

// ── TOP5 추출 ────────────────────────────────────────
function getTop5(data, key) {
  return [...data]
    .sort((a, b) => b[key] - a[key])
    .slice(0, 5)
    .map(e => ({
      code: e.code, name: e.name, cat: e.cat, mgr: e.mgr,
      d1: e.d1, w1: e.w1, m1: e.m1, m3: e.m3,
      m6: e.m6, ytd: e.ytd, fee: e.fee, aum: e.aum,
    }))
}

// ── TOP5 누적 랭킹 계산 ──────────────────────────────
export function calcAccumRanking(history) {
  // code → { name, cat, mgr, counts: {w, m, q}, weeks: [] }
  const map = {}

  history.forEach(entry => {
    const addToMap = (list, type) => {
      list.forEach((etf, rank) => {
        if (!map[etf.code]) {
          map[etf.code] = {
            code: etf.code, name: etf.name,
            cat: etf.cat, mgr: etf.mgr,
            counts: { w: 0, m: 0, q: 0 },
            total: 0,
            weeks: [],
          }
        }
        map[etf.code].counts[type]++
        map[etf.code].total++
        if (!map[etf.code].weeks.includes(entry.week)) {
          map[etf.code].weeks.push(entry.week)
        }
      })
    }
    if (entry.top5w) addToMap(entry.top5w, 'w')
    if (entry.top5m) addToMap(entry.top5m, 'm')
    if (entry.top5q) addToMap(entry.top5q, 'q')
  })

  return Object.values(map).sort((a, b) => b.total - a.total)
}

// ── 훅 ──────────────────────────────────────────────
export function useHistory() {
  const [history, setHistoryState] = useState(() => loadHistory())

  // 선택된 날짜 (null = 최신)
  const [selectedDate, setSelectedDate] = useState(null)

  // 새 주차 데이터 저장
  const saveWeek = useCallback((date, allData) => {
    const week     = getWeekKey(date)
    const top5w    = getTop5(allData, 'w1')
    const top5m    = getTop5(allData, 'm1')
    const top5q    = getTop5(allData, 'm3')

    // 전체 스냅샷 (용량 절약을 위해 핵심 필드만)
    const snapshot = allData.map(e => ({
      code: e.code, name: e.name, cat: e.cat, mgr: e.mgr,
      d1: e.d1, w1: e.w1, m1: e.m1, m3: e.m3,
      m6: e.m6, ytd: e.ytd, y1: e.y1, fee: e.fee, aum: e.aum,
      top1: e.top1, t1r: e.t1r,
      top2: e.top2, t2r: e.t2r,
      top3: e.top3, t3r: e.t3r,
    }))

    const newEntry = { date, week, top5w, top5m, top5q, snapshot }

    setHistoryState(prev => {
      // 같은 주차 있으면 덮어쓰기
      const filtered = prev.filter(e => e.week !== week)
      const updated  = [newEntry, ...filtered]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, MAX_WEEKS)
      saveHistory(updated)
      return updated
    })

    return newEntry
  }, [])

  // 선택된 날짜의 데이터 반환 (없으면 최신)
  const currentEntry = selectedDate
    ? history.find(e => e.date === selectedDate) || history[0]
    : history[0]

  // 누적 랭킹
  const accumRanking = calcAccumRanking(history)

  // 날짜 목록 (드롭다운용)
  const dateList = history.map(e => ({ date: e.date, week: e.week }))

  return {
    history,
    currentEntry,
    selectedDate,
    setSelectedDate,
    dateList,
    saveWeek,
    accumRanking,
    hasHistory: history.length > 0,
  }
}
