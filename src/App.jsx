import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useEligibility }    from './hooks/useEligibility.js'
import { useHistory }        from './hooks/useHistory.js'
import Sidebar               from './components/Sidebar.jsx'
import Topbar                from './components/Topbar.jsx'
import LoaderCard            from './components/LoaderCard.jsx'
import KpiStrip              from './components/KpiStrip.jsx'
import Top5Panels            from './components/Top5Panels.jsx'
import ConstituentPanel      from './components/ConstituentPanel.jsx'
import CompareTable          from './components/CompareTable.jsx'
import StatsSection          from './components/StatsSection.jsx'
import Heatmap               from './components/Heatmap.jsx'
import AccumRanking          from './components/AccumRanking.jsx'
import EligibilityModal      from './components/EligibilityModal.jsx'
import WeeklyUploadModal     from './components/WeeklyUploadModal.jsx'
import DateSelector          from './components/DateSelector.jsx'
import SectionHeader         from './components/SectionHeader.jsx'
import styles                from './App.module.css'

function useTop5(data) {
  return useMemo(() => {
    if (!data.length) return { top5w:[], top5m:[], top5q:[], allUnique:[] }
    const top5w = [...data].sort((a,b)=>b.w1-a.w1).slice(0,5)
    const top5m = [...data].sort((a,b)=>b.m1-a.m1).slice(0,5)
    const top5q = [...data].sort((a,b)=>b.m3-a.m3).slice(0,5)
    const map = new Map()
    ;[[top5w,'w'],[top5m,'m'],[top5q,'q']].forEach(([list,p])=>
      list.forEach(e=>{
        if(!map.has(e.code)) map.set(e.code,{...e,periods:[]})
        map.get(e.code).periods.push(p)
      })
    )
    return { top5w, top5m, top5q, allUnique:[...map.values()] }
  }, [data])
}

export default function App() {
  const { trust, pension, setTrust, setPension, elig, matchCodes } = useEligibility()
  const {
    history, currentEntry, selectedDate, setSelectedDate,
    dateList, saveWeek, accumRanking, hasHistory,
  } = useHistory()

  // 현재 보여줄 데이터 — 선택된 날짜의 스냅샷 or 빈 배열
  const currentData = currentEntry?.snapshot || []

  // 로딩 상태 (업로드 전용)
  const [uploadStatus, setUploadStatus] = useState(
    hasHistory ? 'ok' : 'idle'
  )

  const { top5w, top5m, top5q, allUnique } = useTop5(currentData)
  const [selectedCode, setSelectedCode] = useState(null)
  const effectiveCode = selectedCode || top5w[0]?.code || null

  // 모달 상태
  const [modalType,    setModalType]    = useState(null)
  const [showUpload,   setShowUpload]   = useState(false)

  // 히스토리 있으면 자동으로 ok 상태
  useEffect(() => {
    if (hasHistory) setUploadStatus('ok')
  }, [hasHistory])

  // 가능 목록 저장
  const handleEligSave = useCallback(({ date, codes }) => {
    if (modalType === 'trust') setTrust({ date, codes })
    else setPension({ date, codes })
    setModalType(null)
  }, [modalType, setTrust, setPension])

  // 주간 데이터 저장
  const handleWeekSave = useCallback((date, parsedData) => {
    saveWeek(date, parsedData)
    setShowUpload(false)
    setUploadStatus('ok')
    setSelectedDate(null) // 최신 데이터로 전환
  }, [saveWeek, setSelectedDate])

  const hasData = currentData.length > 0

  return (
    <div className={styles.layout}>
      <Sidebar
        trust={trust}
        pension={pension}
        onOpenModal={setModalType}
        onOpenUpload={() => setShowUpload(true)}
        historyCount={history.length}
      />

      <div className={styles.body}>
        <Topbar
          status={uploadStatus}
          loadedAt={currentEntry ? new Date(currentEntry.date) : null}
          onOpenUpload={() => setShowUpload(true)}
          onOpenModal={setModalType}
          extraLeft={
            <DateSelector
              dateList={dateList}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          }
        />

        <main className={styles.main}>

          {/* 데이터 없을 때 */}
          {!hasData && (
            <div className={styles.emptyCard}>
              <div className={styles.emptyLogo}>𝑃</div>
              <div className={styles.emptyTitle}>첫 번째 주간 데이터를 업로드하세요</div>
              <div className={styles.emptyDesc}>
                매주 일요일 funetf.co.kr에서 엑셀을 다운받아 업로드하면<br/>
                대시보드가 자동으로 구성되고 데이터가 누적됩니다.<br/>
                한 번 업로드하면 다음엔 자동으로 마지막 데이터가 표시됩니다.
              </div>
              <button className={styles.emptyBtn} onClick={() => setShowUpload(true)}>
                📅 지금 첫 데이터 업로드하기
              </button>
            </div>
          )}

          {/* 대시보드 */}
          {hasData && (
            <>
              {/* 현재 기준일 배너 */}
              {currentEntry && (
                <div className={styles.currentBanner}>
                  <span className={styles.bannerDot} />
                  <span className={styles.bannerDateLabel}>기준일</span>
                  <span className={styles.bannerDateValue}>{currentEntry.date}</span>
                  <span className={styles.bannerText}>기준 데이터</span>
                  {selectedDate && (
                    <button className={styles.backToLatest} onClick={() => setSelectedDate(null)}>
                      ← 최신으로
                    </button>
                  )}
                  <span className={styles.bannerRight}>
                    {currentData.length}종목 · 레버리지·인버스 제외
                  </span>
                </div>
              )}

              <KpiStrip data={currentData} />

              <SectionHeader id="sec-top" title="기간별 수익률 우수 ETF TOP 5"
                desc={`${currentEntry?.date} 기준 · ${currentData.length}종목`} />
              <Top5Panels
                top5w={top5w} top5m={top5m} top5q={top5q}
                selectedCode={effectiveCode}
                onSelect={setSelectedCode}
                elig={elig}
              />

              <SectionHeader id="sec-const" title="우수 ETF 구성종목 현황" desc="상위 3개 구성종목" />
              <ConstituentPanel
                allUnique={allUnique}
                selectedCode={effectiveCode}
                onSelect={setSelectedCode}
                allData={currentData}
                elig={elig}
              />

              <SectionHeader id="sec-compare" title="우수 ETF 멀티기간 비교" desc="신탁·퇴직연금 가능 여부 포함" />
              <CompareTable allUnique={allUnique} elig={elig} />

              <SectionHeader id="sec-stats" title="전체 ETF 통계"
                desc={`레버리지·인버스 제외 ${currentData.length}종목`} />
              <StatsSection data={currentData} />

              <SectionHeader id="sec-heat" title="주간 수익률 TOP 15 히트맵" desc="레버리지·인버스 제외" />
              <Heatmap data={currentData} onSelect={setSelectedCode} elig={elig} />

              {/* 누적 랭킹 */}
              <SectionHeader
                id="sec-accum"
                title="TOP5 누적 랭킹"
                desc={`${history.length}주 누적 · 매주 일요일 자동 업데이트`}
              />
              <AccumRanking ranking={accumRanking} totalWeeks={history.length} />
            </>
          )}
        </main>

        <footer className={styles.footer}>
          데이터: <strong>funetf.co.kr</strong> (삼성자산운용) · 레버리지·인버스 제외 ·
          수익률은 NAV 기준이며 실제 투자성과와 다를 수 있습니다. 본 자료는 투자 권유 자료가 아닙니다.
        </footer>
      </div>

      {/* 모달들 */}
      {modalType && (
        <EligibilityModal
          type={modalType}
          existing={modalType === 'trust' ? trust : pension}
          etfData={currentData}
          onSave={handleEligSave}
          onClose={() => setModalType(null)}
        />
      )}
      {showUpload && (
        <WeeklyUploadModal
          onSave={handleWeekSave}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
