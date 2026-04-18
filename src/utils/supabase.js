import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pygnuabndmnmtrtlmdio.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Z251YWJuZG1ubXRydGxtZGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTIyODQsImV4cCI6MjA5MjA4ODI4NH0.7DDT9hc3vNG1dwXATShECJ-t6AnKlup0DNmzM_dRmhE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── 주간 데이터 저장 (관리자) ─────────────────────
export async function saveWeekToDB(date, weekKey, snapshot, top5w, top5m, top5q) {
  const { error } = await supabase
    .from('etf_history')
    .upsert({
      week_date: date,
      week_key:  weekKey,
      snapshot:  snapshot,
      top5w:     top5w,
      top5m:     top5m,
      top5q:     top5q,
    }, { onConflict: 'week_date' })

  if (error) throw error
}

// ── 전체 히스토리 불러오기 (모든 사용자) ──────────
export async function loadHistoryFromDB() {
  const { data, error } = await supabase
    .from('etf_history')
    .select('*')
    .order('week_date', { ascending: false })

  if (error) throw error
  return data || []
}

// ── 네이버 뉴스 검색 ──────────────────────────────
// CORS 우회용 프록시 사용
const NAVER_PROXY = 'https://api.allorigins.win/raw?url='
const NAVER_ID    = 'RTdxrbmuRrMDlHo_8_S4'
const NAVER_SEC   = '0jVoZP3aF3'

export async function searchNaverNews(query, display = 5) {
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`
  try {
    const res = await fetch(NAVER_PROXY + encodeURIComponent(url), {
      headers: {
        'X-Naver-Client-Id':     NAVER_ID,
        'X-Naver-Client-Secret': NAVER_SEC,
      }
    })
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}
