import { useState, useCallback } from 'react'
import { parseWorkbook } from '../utils/parseXlsx.js'
import { FUNETF_URL, PROXY_URL } from '../utils/constants.js'

export function useEtfData() {
  const [data,     setData]     = useState([])
  const [status,   setStatus]   = useState('idle')   // idle | loading | ok | error
  const [progress, setProgress] = useState({ pct: 0, label: '' })
  const [loadedAt, setLoadedAt] = useState(null)

  /** funetf.co.kr에서 자동 로드 */
  const autoLoad = useCallback(async () => {
    setStatus('loading')
    setProgress({ pct: 10, label: 'funetf 서버 연결 중...' })
    try {
      setProgress({ pct: 35, label: '파일 다운로드 중...' })
      const res = await fetch(PROXY_URL + encodeURIComponent(FUNETF_URL), {
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setProgress({ pct: 65, label: '데이터 파싱 중...' })
      const buf = await res.arrayBuffer()
      const rows = parseWorkbook(buf)

      setProgress({ pct: 100, label: '완료!' })
      setData(rows)
      setLoadedAt(new Date())
      setStatus('ok')
    } catch (e) {
      console.error('autoLoad 실패:', e)
      setStatus('error')
    } finally {
      setTimeout(() => setProgress({ pct: 0, label: '' }), 800)
    }
  }, [])

  /** 파일 직접 업로드 */
  const loadFile = useCallback((file) => {
    setStatus('loading')
    setProgress({ pct: 30, label: '파일 분석 중...' })
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        setProgress({ pct: 70, label: '파싱 중...' })
        const rows = parseWorkbook(e.target.result)
        setProgress({ pct: 100, label: '완료!' })
        setData(rows)
        setLoadedAt(new Date())
        setStatus('ok')
      } catch (err) {
        console.error('loadFile 실패:', err)
        setStatus('error')
      } finally {
        setTimeout(() => setProgress({ pct: 0, label: '' }), 600)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  return { data, status, progress, loadedAt, autoLoad, loadFile }
}
