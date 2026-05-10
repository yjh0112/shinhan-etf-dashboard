import { createClient } from '@supabase/supabase-js'
const URL = 'https://pygnuabndmnmtrtlmdio.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Z251YWJuZG1ubXRydGxtZGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTIyODQsImV4cCI6MjA5MjA4ODI4NH0.7DDT9hc3vNG1dwXATShECJ-t6AnKlup0DNmzM_dRmhE'
export const supabase = createClient(URL, KEY)

// ── ETF 히스토리 ──
export async function saveWeekToDB(date, weekKey, snapshot, top5w, top5m, top5q) {
  const { error } = await supabase.from('etf_history')
    .upsert({ week_date:date, week_key:weekKey, snapshot, top5w, top5m, top5q }, { onConflict:'week_date' })
  if (error) throw error
}
export async function loadHistoryFromDB() {
  const { data, error } = await supabase.from('etf_history')
    .select('*').order('week_date', { ascending:false })
  if (error) throw error
  return data || []
}

// ── 펀드 히스토리 ──
export async function saveFundToDB(date, snapshot) {
  const { error } = await supabase.from('fund_history')
    .upsert({ load_date:date, snapshot }, { onConflict:'load_date' })
  if (error) throw error
}
export async function loadFundDateListFromDB() {
  const { data, error } = await supabase.from('fund_history')
    .select('id, load_date').order('load_date', { ascending:false })
  if (error) throw error
  return data || []
}
export async function loadFundSnapshotFromDB(date) {
  const { data, error } = await supabase.from('fund_history')
    .select('snapshot').eq('load_date', date).single()
  if (error) throw error
  return data?.snapshot || []
}
