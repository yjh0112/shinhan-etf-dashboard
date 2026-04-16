import React, { useState, useMemo, useCallback } from 'react'
import { useEtfData }      from './hooks/useEtfData.js'
import { useEligibility }  from './hooks/useEligibility.js'
import Sidebar             from './components/Sidebar.jsx'
import Topbar              from './components/Topbar.jsx'
import LoaderCard          from './components/LoaderCard.jsx'
import KpiStrip            from './components/KpiStrip.jsx'
import Top5Panels          from './components/Top5Panels.jsx'
import ConstituentPanel    from './components/ConstituentPanel.jsx'
import CompareTable        from './components/CompareTable.jsx'
import StatsSection        from './components/StatsSection.jsx'
import Heatmap             from './components/Heatmap.jsx'
import EligibilityModal    from './components/EligibilityModal.jsx'
import SectionHeader       from './components/SectionHeader.jsx'
import styles              from './App.module.css'

/** TOP5 데이터 + 중복 제거된 통합 목록 계산 */
function useTop5(data) {
  return useMemo(() => {
    if (!data.length) return { top5w:[], top5m:[], top5q:[], allUnique:[] }
    const top5w = [...data].sort((a, b) => b.w1 - a.w1).slice(0, 5)
    const top5m = [...data].sort((a, b) => b.m1 - a.m1).slice(0, 5)
    const top5q = [...data].sort((a, b) => b.m3 - a.m3).slice(0, 5)

    const map = new Map()
    ;[[top5w,'w'],[top5m,'m'],[top5q,'q']].forEach(([list, p]) =>
      list.forEach(e => {
        if (!map.has(e.code)) map.set(e.code, { ...e, periods: [] })
        map.get(e.code).periods.push(p)
      })
    )
    return { top5w, top5m, top5q, allUnique: [...map.values()] }
  }, [data])
}

export default function App() {
  const { data, status, progress, loadedAt, autoLoad, loadFile } = useEtfData()
  const { trust, pension, setTrust, setPension, elig, matchCodes } = useEligibility()

  const { top5w, top5m, top5q, allUnique } = useTop5(data)

  // 선택된 ETF 코드
  const [selectedCode, setSelectedCode] = useState(null)
  const effectiveCode = selectedCode || top5w[0]?.code || null

  // 가능 목록 모달
  const [modalType, setModalType] = useState(null)  // null | 'trust' | 'pension'

  const openModal  = useCallback((type) => setModalType(type), [])
  const closeModal = useCallback(() => setModalType(null), [])

  const handleSave = useCallback(({ date, codes }) => {
    const payload = { date, codes }
    if (modalType === 'trust') setTrust(payload)
    else setPension(payload)
    closeModal()
  }, [modalType, setTrust, setPension, closeModal])

  const hasData = data.length > 0

  return (
    <div className={styles.layout}>
      {/* 사이드바 */}
      <Sidebar trust={trust} pension={pension} onOpenModal={openModal} />

      {/* 오른쪽 본문 영역 */}
      <div className={styles.body}>
        {/* 상단 바 */}
        <Topbar
          status={status}
          loadedAt={loadedAt}
          onAutoLoad={autoLoad}
          onFileLoad={loadFile}
          onOpenModal={openModal}
        />

        {/* 메인 콘텐츠 */}
        <main className={styles.main}>

          {/* 데이터 로더 */}
          <LoaderCard
            status={status}
            progress={progress}
            onAutoLoad={autoLoad}
            onFileLoad={loadFile}
          />

          {/* 데이터 없을 때 빈 화면 */}
          {!hasData && status !== 'loading' && status !== 'error' && (
            <div className={styles.emptyCard}>
              <div className={styles.emptyLogo}>𝑃</div>
              <div className={styles.emptyTitle}>수익률 데이터를 먼저 불러오세요</div>
              <div className={styles.emptyDesc}>
                위 <strong>funetf 자동 로드</strong> 버튼을 클릭하거나<br />
                funetf.co.kr에서 다운받은 엑셀 파일을 업로드하면 대시보드가 표시됩니다.<br />
                신탁·퇴직연금 가능 목록은 좌측 메뉴에서 별도로 등록할 수 있습니다.
              </div>
              <button className={styles.emptyBtn} onClick={autoLoad}>
                funetf 자동 로드 시작
              </button>
            </div>
          )}

          {/* 대시보드 본문 */}
          {hasData && (
            <>
              {/* 01 KPI */}
              <KpiStrip data={data} />

              {/* 02 TOP 5 */}
              <SectionHeader
                id="sec-top"
                title="기간별 수익률 우수 ETF TOP 5"
                desc={`레버리지·인버스 제외 · ${data.length}종목`}
              />
              <Top5Panels
                top5w={top5w} top5m={top5m} top5q={top5q}
                selectedCode={effectiveCode}
                onSelect={setSelectedCode}
                elig={elig}
              />

              {/* 03 구성종목 */}
              <SectionHeader
                id="sec-const"
                title="우수 ETF 구성종목 현황"
                desc="상위 3개 구성종목"
              />
              <ConstituentPanel
                allUnique={allUnique}
                selectedCode={effectiveCode}
                onSelect={setSelectedCode}
                allData={data}
                elig={elig}
              />

              {/* 04 비교 테이블 */}
              <SectionHeader
                id="sec-compare"
                title="우수 ETF 멀티기간 비교"
                desc="신탁·퇴직연금 가능 여부 포함"
              />
              <CompareTable allUnique={allUnique} elig={elig} />

              {/* 05 통계 */}
              <SectionHeader
                id="sec-stats"
                title="전체 ETF 통계"
                desc={`레버리지·인버스 제외 ${data.length}종목 기준`}
              />
              <StatsSection data={data} />

              {/* 06 히트맵 */}
              <SectionHeader
                id="sec-heat"
                title="주간 수익률 TOP 15 히트맵"
                desc="레버리지·인버스 제외"
              />
              <Heatmap data={data} onSelect={setSelectedCode} elig={elig} />
            </>
          )}
        </main>

        <footer className={styles.footer}>
          데이터 출처: <strong>funetf.co.kr</strong> (삼성자산운용) ·
          레버리지·인버스 ETF 자동 제외 · 수익률은 NAV 기준이며 실제 투자성과와 다를 수 있습니다.
          본 자료는 투자 권유 자료가 아닙니다.
        </footer>
      </div>

      {/* 가능 목록 모달 */}
      {modalType && (
        <EligibilityModal
          type={modalType}
          existing={modalType === 'trust' ? trust : pension}
          etfData={data}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
