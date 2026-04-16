import { useState, useCallback } from 'react'

function loadStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { date: null, codes: new Set() }
    const obj = JSON.parse(raw)
    return { date: obj.date || null, codes: new Set(obj.codes || []) }
  } catch {
    return { date: null, codes: new Set() }
  }
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      date:  data.date,
      codes: [...data.codes],
    }))
  } catch (e) {
    console.warn('localStorage 저장 실패', e)
  }
}

/**
 * 신탁 / 퇴직연금 가능 목록 상태 훅
 * - localStorage에 영속 저장
 * - ETF 코드와 매칭하는 elig(code, type) 함수 제공
 */
export function useEligibility() {
  const [trust,   setTrustRaw]   = useState(() => loadStorage('trust_data'))
  const [pension, setPensionRaw] = useState(() => loadStorage('pension_data'))

  const setTrust = useCallback((data) => {
    setTrustRaw(data)
    saveStorage('trust_data', data)
  }, [])

  const setPension = useCallback((data) => {
    setPensionRaw(data)
    saveStorage('pension_data', data)
  }, [])

  /** null = 미설정, true = 가능, false = 불가 */
  const elig = useCallback((code, type) => {
    const d = type === 'trust' ? trust : pension
    if (!d || d.codes.size === 0) return null
    return d.codes.has(code)
  }, [trust, pension])

  /**
   * 텍스트(줄바꿈·쉼표 구분) + ETF 데이터로 코드 집합 생성
   * 6자리 숫자 코드 우선, 없으면 종목명으로 매칭
   */
  const matchCodes = useCallback((rawText, etfData) => {
    const lines = rawText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    const matched = new Set()

    lines.forEach(line => {
      const codeMatch = line.match(/\b(\d{6})\b/)
      if (codeMatch) {
        matched.add(codeMatch[1])
        return
      }
      if (etfData.length > 0) {
        const lo = line.toLowerCase().replace(/\s/g, '')
        const found = etfData.find(e =>
          e.name.toLowerCase().replace(/\s/g,'').includes(lo) ||
          lo.includes(e.name.toLowerCase().replace(/\s/g,'').substring(0, 6))
        )
        if (found) matched.add(found.code)
        else matched.add(line) // 그대로 저장 (나중에 데이터 로드 시 매칭 가능)
      } else {
        matched.add(line)
      }
    })

    return matched
  }, [])

  return { trust, pension, setTrust, setPension, elig, matchCodes }
}
