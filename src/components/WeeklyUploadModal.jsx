import React, { useState, useRef } from 'react'
import { parseWorkbook } from '../utils/parseXlsx.js'
import styles from './WeeklyUploadModal.module.css'

/**
 * 주간 데이터 업로드 모달
 * - 기준일 입력 (기본값: 가장 가까운 일요일)
 * - 엑셀 파일 업로드
 * - 저장 시 히스토리에 추가
 */

function getLastSunday() {
  const d = new Date()
  const day = d.getDay() // 0=일, 1=월 ...
  d.setDate(d.getDate() - day)
  return d.toISOString().split('T')[0]
}

export default function WeeklyUploadModal({ onSave, onClose }) {
  const [date,     setDate]     = useState(getLastSunday())
  const [file,     setFile]     = useState(null)
  const [status,   setStatus]   = useState('idle') // idle | parsing | done | error
  const [msg,      setMsg]      = useState('')
  const [rowCount, setRowCount] = useState(0)
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setStatus('parsing')
    setMsg('파일 분석 중...')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rows = parseWorkbook(e.target.result)
        setRowCount(rows.length)
        setStatus('done')
        setMsg(`✅ ${rows.length}개 ETF 파싱 완료 (레버리지·인버스 제외)`)
        // 파싱된 데이터를 임시 저장
        fileRef._parsedData = rows
      } catch (err) {
        setStatus('error')
        setMsg('❌ 파일 오류: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  const handleSave = () => {
    if (!date) { alert('기준일을 선택해주세요.'); return }
    if (!fileRef._parsedData) { alert('엑셀 파일을 업로드해주세요.'); return }
    if (status !== 'done') { alert('파일 파싱이 완료된 후 저장해주세요.'); return }
    onSave(date, fileRef._parsedData)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>📅</span>
            <div>
              <div className={styles.title}>주간 데이터 업로드</div>
              <div className={styles.subtitle}>매주 일요일 업로드 · 히스토리 자동 누적</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* 기준일 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              📅 기준일 <span className={styles.labelHint}>(해당 주 일요일)</span>
            </label>
            <input
              type="date"
              className={styles.input}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <div className={styles.hint}>
              매주 일요일 날짜를 선택하세요. 같은 주차 데이터는 덮어씌워집니다.
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              📊 funetf 엑셀 파일
            </label>
            <div
              className={`${styles.dropZone} ${file ? styles.hasFile : ''}`}
              onClick={() => {
                const inp = document.createElement('input')
                inp.type = 'file'; inp.accept = '.xlsx,.xls'
                inp.onchange = e => handleFile(e.target.files[0])
                inp.click()
              }}
            >
              {file ? (
                <>
                  <div className={styles.fileIcon}>✅</div>
                  <div className={styles.fileName}>{file.name}</div>
                </>
              ) : (
                <>
                  <div className={styles.fileIcon}>📂</div>
                  <div className={styles.dropTitle}>클릭해서 파일 선택</div>
                  <div className={styles.dropDesc}>funetf.co.kr에서 다운받은 .xlsx 파일</div>
                </>
              )}
            </div>
          </div>

          {/* 파싱 상태 */}
          {status !== 'idle' && (
            <div className={`${styles.statusBox} ${styles['s_' + status]}`}>
              {msg}
              {status === 'done' && (
                <div className={styles.statsRow}>
                  <span>📦 {rowCount}개 종목</span>
                  <span>📅 기준일: {date}</span>
                </div>
              )}
            </div>
          )}

          {/* 안내 */}
          <div className={styles.infoBox}>
            <div className={styles.infoTitle}>💡 이렇게 사용하세요</div>
            <div className={styles.infoText}>
              1. 매주 일요일 funetf.co.kr 접속<br/>
              2. ETF 필터링 검색 → 엑셀 다운로드<br/>
              3. 이 버튼으로 업로드 → 자동 누적 저장<br/>
              4. 과거 데이터는 날짜 선택으로 언제든 조회 가능
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnGhost} onClick={onClose}>취소</button>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={status !== 'done'}
          >
            💾 저장 ({date})
          </button>
        </div>
      </div>
    </div>
  )
}
