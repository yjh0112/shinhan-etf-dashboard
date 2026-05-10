import React, { useState, useCallback, useRef } from 'react'
import { fmtPct, fmtAum, CAT_CLASS } from '../utils/constants.js'
import styles from './EtfSearch.module.css'

// ── Claude API 공통 호출 ─────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  const text = data.content?.map(c => c.text || '').join('') || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('데이터 파싱 실패')
  return JSON.parse(match[0])
}

// ── ETF 전체 정보 웹검색 (없는 ETF용) ───────────────
async function searchEtfViaClaude(query) {
  return callClaude(
    `"${query}" ETF에 대해 검색해서 아래 JSON 형식으로만 반환하세요. 다른 설명 없이 JSON만 출력하세요.

{
  "name": "ETF 정식명칭",
  "code": "종목코드 6자리",
  "mgr": "운용사명",
  "cat": "대유형 (국내주식/해외주식/채권/원자재/부동산 중 하나)",
  "aum": "운용규모(억원, 숫자만)",
  "fee": "총보수(%,소수점포함 숫자만)",
  "w1": "1주 수익률(숫자만, 없으면 null)",
  "m1": "1개월 수익률(숫자만, 없으면 null)",
  "m3": "3개월 수익률(숫자만, 없으면 null)",
  "m6": "6개월 수익률(숫자만, 없으면 null)",
  "ytd": "연초후 수익률(숫자만, 없으면 null)",
  "y1": "1년 수익률(숫자만, 없으면 null)",
  "top1": "구성종목1 이름", "t1r": "비중(%,숫자만)",
  "top2": "구성종목2 이름", "t2r": "비중(%,숫자만)",
  "top3": "구성종목3 이름", "t3r": "비중(%,숫자만)",
  "top4": "구성종목4 이름", "t4r": "비중(%,숫자만)",
  "top5": "구성종목5 이름", "t5r": "비중(%,숫자만)",
  "desc1": "① 추종지수 및 투자전략 설명",
  "desc2": "② 주요 특징 (운용방식, 배당 등)",
  "desc3": "③ PB 고객 추천 시 참고사항 (리스크, 적합 투자자 등)"
}`
  )
}

// ── 로컬 ETF 보완 (top4~5, desc) ────────────────────
async function enrichLocalEtf(etf) {
  return callClaude(
    `"${etf.name}"(코드:${etf.code}) ETF에 대해 아래 JSON 형식으로만 반환하세요. 다른 설명 없이 JSON만 출력하세요.

{
  "top4": "구성종목4 이름 (없으면 null)", "t4r": "비중(%,숫자만, 없으면 null)",
  "top5": "구성종목5 이름 (없으면 null)", "t5r": "비중(%,숫자만, 없으면 null)",
  "desc1": "① 추종지수 및 투자전략 설명",
  "desc2": "② 주요 특징 (운용방식, 배당 등)",
  "desc3": "③ PB 고객 추천 시 참고사항 (리스크, 적합 투자자 등)"
}`
  )
}

// ── 수익률 셀 ────────────────────────────────────────
function RetCell({ label, value }) {
  if (value == null) return (
    <div className={styles.retCell}>
      <div className={styles.retLabel}>{label}</div>
      <div className={styles.retValue} style={{ color:'var(--muted)' }}>--</div>
    </div>
  )
  const pos = value >= 0
  return (
    <div className={styles.retCell}>
      <div className={styles.retLabel}>{label}</div>
      <div className={`${styles.retValue} ${pos ? styles.up : styles.dn}`}>
        {pos ? '+' : ''}{Number(value).toFixed(2)}%
      </div>
    </div>
  )
}

// ── 구성종목 바 ──────────────────────────────────────
const BAR_COLORS = ['#3B82F6','#10B981','#C9A84C','#8B5CF6','#EC4899']

function HoldingBar({ rank, name, pct, color }) {
  if (!name) return null
  return (
    <div className={styles.holdingRow}>
      <span className={styles.holdingRank}>{rank}</span>
      <span className={styles.holdingName}>{name}</span>
      <div className={styles.holdingBarWrap}>
        <div className={styles.holdingBar} style={{
          width: Math.min((Number(pct) / 15) * 100, 100) + '%',
          background: color,
        }} />
      </div>
      <span className={styles.holdingPct}>{pct ? Number(pct).toFixed(1) + '%' : '--'}</span>
    </div>
  )
}

// ── ETF 상세 카드 ─────────────────────────────────────
function EtfDetailCard({ etf, source, enriching, onClose }) {
  const isLocal = source === 'local'

  return (
    <div className={styles.detailCard}>

      {/* 헤더 — 네이비 배경 */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <div className={styles.detailName}>{etf.name}</div>
          <div className={styles.detailMeta}>
            <span className={styles.detailCode}>{etf.code}</span>
            <span className={`cat-chip ${CAT_CLASS[etf.cat] || 'cc-etc'}`}>{etf.cat}</span>
            <span className={styles.detailMgr}>{etf.mgr}</span>
            {isLocal
              ? <span className={styles.sourceBadgeLocal}>📊 업로드 데이터</span>
              : <span className={styles.sourceBadgeAi}>🤖 AI 검색</span>
            }
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* 요약 설명 3줄 */}
      {(etf.desc1 || etf.desc2 || etf.desc3) ? (
        <div className={styles.descSection}>
          {etf.desc1 && <div className={styles.descItem}>{etf.desc1}</div>}
          {etf.desc2 && <div className={styles.descItem}>{etf.desc2}</div>}
          {etf.desc3 && <div className={`${styles.descItem} ${styles.descNote}`}>{etf.desc3}</div>}
        </div>
      ) : enriching ? (
        <div className={styles.enrichingBox}>
          <span className="spin">⟳</span>&nbsp; AI가 상세 정보를 보완 중입니다...
        </div>
      ) : null}

      {/* 수익률 그리드 */}
      <div className={styles.retGrid}>
        <RetCell label="1주"   value={etf.w1} />
        <RetCell label="1개월" value={etf.m1} />
        <RetCell label="3개월" value={etf.m3} />
        <RetCell label="6개월" value={etf.m6} />
        <RetCell label="YTD"   value={etf.ytd} />
        <RetCell label="1년"   value={etf.y1} />
      </div>

      {/* 운용 정보 */}
      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>운용규모</span>
          <span className={`${styles.infoValue} ${styles.gold}`}>
            {etf.aum ? fmtAum(Number(etf.aum)) : '--'}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>총보수</span>
          <span className={styles.infoValue}>
            {etf.fee ? Number(etf.fee).toFixed(2) + '%' : '--'}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>🏦 신탁</span>
          <span className={styles.infoValue}>
            {etf._trust === true  ? <span className="eb eb-t">가능✓</span>
            : etf._trust === false ? <span className="eb eb-x">불가</span>
            : <span style={{color:'var(--muted)'}}>미확인</span>}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>🏢 퇴직연금</span>
          <span className={styles.infoValue}>
            {etf._pension === true  ? <span className="eb eb-p">가능✓</span>
            : etf._pension === false ? <span className="eb eb-x">불가</span>
            : <span style={{color:'var(--muted)'}}>미확인</span>}
          </span>
        </div>
      </div>

      {/* 구성종목 TOP 5 */}
      <div className={styles.holdingSection}>
        <div className={styles.holdingTitle}>
          📦 구성종목 TOP 5
          {enriching && <span className={styles.enrichingHint}>&nbsp;<span className="spin">⟳</span> 보완 중...</span>}
        </div>
        {[
          { name: etf.top1, pct: etf.t1r },
          { name: etf.top2, pct: etf.t2r },
          { name: etf.top3, pct: etf.t3r },
          { name: etf.top4, pct: etf.t4r },
          { name: etf.top5, pct: etf.t5r },
        ].map((h, i) => (
          <HoldingBar key={i} rank={i+1} name={h.name} pct={h.pct} color={BAR_COLORS[i]} />
        ))}
        {!etf.top1 && !enriching && (
          <div style={{ color:'var(--muted)', fontSize:11 }}>구성종목 정보 없음</div>
        )}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function EtfSearch({ allData, elig }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [detail,   setDetail]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [enriching,setEnriching]= useState(false)
  const [aiUsed,   setAiUsed]   = useState(false)
  const inputRef = useRef()

  const searchLocal = useCallback((q) => {
    if (!q.trim()) return []
    const lo = q.toLowerCase().replace(/\s/g, '')
    return allData.filter(e =>
      e.name.toLowerCase().replace(/\s/g, '').includes(lo) ||
      e.code.includes(q.trim())
    ).slice(0, 8)
  }, [allData])

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setDetail(null)
    setAiUsed(false)

    const local = searchLocal(q)
    if (local.length > 0) {
      setResults(local)
      return
    }

    // 로컬에 없으면 AI 검색
    setLoading(true)
    try {
      const aiEtf = await searchEtfViaClaude(q)
      setResults([])
      setAiUsed(true)
      const enriched = { ...aiEtf, _trust: elig(aiEtf.code, 'trust'), _pension: elig(aiEtf.code, 'pension') }
      setDetail({ etf: enriched, source: 'ai' })
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, searchLocal, elig])

  // 로컬 ETF 선택 → top4/5 + desc AI 보완
  const handleSelect = useCallback(async (etf) => {
    const enriched = { ...etf, _trust: elig(etf.code, 'trust'), _pension: elig(etf.code, 'pension') }
    setDetail({ etf: enriched, source: 'local' })
    setResults([])
    setEnriching(true)
    try {
      const extra = await enrichLocalEtf(etf)
      setDetail(prev => ({
        ...prev,
        etf: { ...prev.etf, ...extra }
      }))
    } catch (e) {
      console.error('보완 실패:', e)
    } finally {
      setEnriching(false)
    }
  }, [elig])

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch() }

  return (
    <div className={styles.wrap}>
      {/* 검색창 */}
      <div className={styles.searchBox}>
        <div className={styles.searchInputWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="ETF 이름 또는 코드 입력 (예: KODEX 200, 069500, S&P500)"
            value={query}
            onChange={e => { setQuery(e.target.value); setResults([]); setDetail(null) }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => { setQuery(''); setResults([]); setDetail(null) }}>✕</button>
          )}
        </div>
        <button className={styles.searchBtn} onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? <span className="spin">⟳</span> : '검색'}
        </button>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className={styles.loadingBox}>
          <span className="spin">⟳</span>&nbsp; AI가 ETF 정보를 검색 중입니다... (10~20초 소요)
        </div>
      )}

      {/* AI 사용 안내 */}
      {aiUsed && !loading && (
        <div className={styles.aiNotice}>
          🤖 업로드 데이터에 없어 AI 웹검색으로 조회했습니다. 수익률은 실시간이 아닐 수 있습니다.
        </div>
      )}

      {/* 검색 결과 목록 */}
      {results.length > 0 && !detail && (
        <div className={styles.resultList}>
          {results.map(etf => (
            <button key={etf.code} className={styles.resultItem} onClick={() => handleSelect(etf)}>
              <div className={styles.resultLeft}>
                <span className={styles.resultName}>{etf.name}</span>
                <span className={styles.resultCode}>{etf.code}</span>
                <span className={`cat-chip ${CAT_CLASS[etf.cat]||'cc-etc'}`}>{etf.cat}</span>
              </div>
              <div className={styles.resultRight}>
                <span className={`${styles.resultRet} ${etf.w1>=0?styles.up:styles.dn}`}>
                  주간 {fmtPct(etf.w1)}
                </span>
                <span className={styles.resultAum}>{fmtAum(etf.aum)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 결과 없음 */}
      {!loading && query && results.length === 0 && !detail && (
        <div className={styles.noResult}>
          <div>"{query}"에 해당하는 ETF를 찾지 못했습니다</div>
          <button className={styles.aiSearchBtn} onClick={handleSearch}>🤖 AI로 검색해보기</button>
        </div>
      )}

      {/* 상세 카드 */}
      {detail && (
        <EtfDetailCard
          etf={detail.etf}
          source={detail.source}
          enriching={enriching}
          onClose={() => { setDetail(null); setAiUsed(false) }}
        />
      )}

      {/* 초기 안내 */}
      {!query && !detail && (
        <div className={styles.guide}>
          <div className={styles.guideTitle}>💡 이렇게 검색하세요</div>
          <div className={styles.guideGrid}>
            {['KODEX 200', 'TIGER 미국S&P500', '379800', 'ACE 글로벌반도체', 'RISE 건설', '퇴직연금 채권'].map(ex => (
              <button key={ex} className={styles.exampleBtn}
                onClick={() => { setQuery(ex); setTimeout(() => handleSearch(), 50) }}>
                {ex}
              </button>
            ))}
          </div>
          <div className={styles.guideDesc}>
            업로드된 {allData.length.toLocaleString()}개 ETF 즉시 검색 · 없으면 AI가 웹에서 찾아드립니다
          </div>
        </div>
      )}
    </div>
  )
}
