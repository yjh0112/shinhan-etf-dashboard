import React, { useState, useRef } from 'react'
import styles from './EligibilityModal.module.css'

export default function EligibilityModal({ type, existing, etfData, onSave, onClose }) {
  const [date,    setDate]    = useState(existing.date || '')
  const [text,    setText]    = useState([...existing.codes].join('\n'))
  const [ocrSt,   setOcrSt]   = useState(null)   // null | 'running' | 'ok' | 'error'
  const [ocrMsg,  setOcrMsg]  = useState('')
  const [preview, setPreview] = useState([])
  const [fileName,setFileName]= useState('')
  const fileRef = useRef()

  const isTrust = type === 'trust'
  const typeLabel = isTrust ? '🏦 신탁 가능 ETF 목록' : '🏢 퇴직연금 가능 ETF 목록'

  // ── OCR ──────────────────────────────
  const runOCR = async (base64, mime) => {
    setOcrSt('running')
    setOcrMsg('Claude AI가 ETF 목록을 추출 중입니다...')
    setPreview([])
    try {
      const isImg = mime.startsWith('image/')
      const item  = isImg
        ? { type: 'image',    source: { type: 'base64', media_type: mime,                 data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages:   [{
            role:    'user',
            content: [
              item,
              { type: 'text', text: `이 문서는 신한은행의 ETF 가능 목록입니다.\nETF 종목코드(6자리 숫자)와 종목명을 모두 추출하세요.\n\n출력 형식(JSON 배열만):\n[{"code":"069500","name":"KODEX 200"}]\n\n코드가 없으면 name만, 이름이 없으면 code만 넣어도 됩니다. 최대한 빠짐없이 추출하세요.` },
            ],
          }],
        }),
      })
      const data   = await res.json()
      const raw    = data.content?.map(c => c.text || '').join('') || ''
      const match  = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('JSON 추출 실패')

      const parsed = JSON.parse(match[0])
      const lines  = parsed.map(e => e.code && e.name ? `${e.code}  ${e.name}` : e.code || e.name || '').filter(Boolean)
      setText(lines.join('\n'))
      setPreview(lines.slice(0, 25))
      setOcrSt('ok')
      setOcrMsg(`✓ ${parsed.length}개 ETF 추출 완료 — 아래에서 확인 후 저장`)
    } catch (e) {
      setOcrSt('error')
      setOcrMsg('⚠ OCR 오류: ' + e.message + ' — 수동 입력을 이용하세요')
    }
  }

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFileName(f.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target.result.split(',')[1]
      runOCR(b64, f.type)
    }
    reader.readAsDataURL(f)
  }

  // ── 저장 ─────────────────────────────
  const handleSave = () => {
    if (!date) { alert('기준일을 입력해주세요.'); return }
    if (!text.trim()) { alert('ETF 목록을 입력하거나 PDF를 업로드해주세요.'); return }

    const lines   = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    const matched = new Set()
    lines.forEach(line => {
      const cm = line.match(/\b(\d{6})\b/)
      if (cm) { matched.add(cm[1]); return }
      if (etfData.length > 0) {
        const lo    = line.toLowerCase().replace(/\s/g, '')
        const found = etfData.find(e =>
          e.name.toLowerCase().replace(/\s/g,'').includes(lo) ||
          lo.includes(e.name.toLowerCase().replace(/\s/g,'').substring(0, 6))
        )
        if (found) matched.add(found.code); else matched.add(line)
      } else { matched.add(line) }
    })

    if (!matched.size) { alert('매칭된 ETF가 없습니다.'); return }
    onSave({ date, codes: matched })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>{isTrust ? '신탁 가능 목록 업데이트' : '퇴직연금 가능 목록 업데이트'}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <span className={`${styles.typeTag} ${isTrust ? styles.trust : styles.pension}`}>
            {typeLabel}
          </span>

          {/* 기준일 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>📅 기준일 (공문·목록 날짜)</label>
            <input type="date" className={styles.input} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* PDF 드롭존 */}
          <div className={`${styles.dropZone} ${fileName ? styles.hasFile : ''}`}
               onClick={() => fileRef.current.click()}>
            <div className={styles.dropIcon}>📄</div>
            <div className={styles.dropTitle}>PDF·이미지 파일 클릭하여 선택</div>
            <div className={styles.dropDesc}>스캔본 포함 — Claude AI가 자동 추출</div>
            {fileName && <div className={styles.dropName}>✓ {fileName}</div>}
          </div>
          <input type="file" ref={fileRef} accept=".pdf,image/*" style={{ display:'none' }} onChange={onFileChange} />

          {/* OCR 상태 */}
          {ocrSt && (
            <div className={`${styles.ocrBox} ${styles['ocr_' + ocrSt]}`}>
              {ocrSt === 'running' && <span className="spin">⟳</span>}
              {' '}{ocrMsg}
            </div>
          )}
          {preview.length > 0 && (
            <div className={styles.preview}>
              {preview.join('\n')}{preview.length < [...text.split('\n')].length && `\n...`}
            </div>
          )}

          {/* 수동 입력 */}
          <div className={styles.manualWrap}>
            <div className={styles.manualLabel}>✏️ 직접 입력 (ETF 코드 6자리 또는 종목명, 줄바꿈·쉼표 구분)</div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'예시:\n069500\nKODEX 200\n379800, TIGER 미국S&P500TR'}
            />
            <div className={styles.hint}>코드 또는 종목명 입력 시 funetf 데이터와 자동 매칭됩니다</div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnGhost}   onClick={onClose}>취소</button>
          <button className={styles.btnPrimary} onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  )
}
