import React, { useState, useRef } from 'react'
import { parseFundWorkbook } from '../utils/parseFund.js'
import styles from './WeeklyUploadModal.module.css'  // ETF와 동일 스타일 재사용

function getToday() {
  return new Date().toISOString().split('T')[0]
}

export default function FundUploadModal({ onSave, onClose, saving }) {
  const [date,     setDate]     = useState(getToday())
  const [file,     setFile]     = useState(null)
  const [status,   setStatus]   = useState('idle')
  const [msg,      setMsg]      = useState('')
  const [rowCount, setRowCount] = useState(0)
  const parsedRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setStatus('parsing')
    setMsg('파일 분석 중...')
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const rows = parseFundWorkbook(e.target.result)
        parsedRef.current = rows
        setRowCount(rows.length)
        setStatus('done')
        setMsg(`✅ ${rows.length}개 펀드 파싱 완료 (레버리지·인버스 제외, 종류 합산)`)
      } catch (err) {
        setStatus('error')
        setMsg('❌ 파일 오류: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  const handleSave = () => {
    if (!date)               { alert('기준일을 선택해주세요.'); return }
    if (!parsedRef.current)  { alert('엑셀 파일을 업로드해주세요.'); return }
    if (status !== 'done')   { alert('파일 파싱 완료 후 저장해주세요.'); return }
    onSave(date, parsedRef.current)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>🏦</span>
            <div>
              <div className={styles.title}>펀드 데이터 업로드</div>
              <div className={styles.subtitle}>종류A/B/C 자동 합산 · 레버리지·인버스 자동 제외 · Supabase 공유 저장</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label className={styles.label}>📅 기준일 <span style={{fontWeight:400,color:'var(--muted)'}}>
              (데이터 기준 날짜)
            </span></label>
            <input type="date" className={styles.input} value={date} onChange={e => setDate(e.target.value)} />
            <div className={styles.hint}>같은 날짜로 다시 올리면 덮어씌워집니다</div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>📊 펀드 엑셀 파일</label>
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
                <><div className={styles.fileIcon}>✅</div><div className={styles.fileName}>{file.name}</div></>
              ) : (
                <><div className={styles.fileIcon}>📂</div>
                <div className={styles.dropTitle}>클릭해서 파일 선택</div>
                <div className={styles.dropDesc}>금융투자협회 펀드 필터링 .xlsx 파일</div></>
              )}
            </div>
          </div>

          {status !== 'idle' && (
            <div className={`${styles.statusBox} ${styles['s_' + status]}`}>
              {msg}
              {status === 'done' && (
                <div className={styles.statsRow}>
                  <span>📦 {rowCount}개 펀드</span>
                  <span>📅 {date}</span>
                  <span>☁️ Supabase 저장 → 전체 공유</span>
                </div>
              )}
            </div>
          )}

          <div className={styles.infoBox}>
            <div className={styles.infoTitle}>💡 저장 후 모든 사용자가 즉시 조회 가능</div>
            <div className={styles.infoText}>
              관리자가 업로드하면 Supabase DB에 저장됩니다.<br/>
              다른 사람이 접속하면 자동으로 최신 데이터를 불러옵니다.<br/>
              날짜 선택으로 과거 데이터도 언제든지 조회할 수 있습니다.
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnGhost} onClick={onClose}>취소</button>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={status !== 'done' || saving}
          >
            {saving ? '저장 중...' : `💾 저장 (${date})`}
          </button>
        </div>
      </div>
    </div>
  )
}
