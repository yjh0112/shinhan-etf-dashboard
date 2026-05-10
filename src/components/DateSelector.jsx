import React from 'react'
import styles from './DateSelector.module.css'

/**
 * 날짜 선택 드롭다운
 * - 저장된 주차 목록 표시
 * - 선택 시 해당 날짜 데이터로 전환
 */
export default function DateSelector({ dateList, selectedDate, onSelect }) {
  if (!dateList.length) return null

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>📅 기준일</span>
      <select
        className={styles.select}
        value={selectedDate || ''}
        onChange={e => onSelect(e.target.value || null)}
      >
        <option value="">최신 ({dateList[0]?.date})</option>
        {dateList.slice(1).map(d => (
          <option key={d.date} value={d.date}>
            {d.date} ({d.week})
          </option>
        ))}
      </select>
      <span className={styles.count}>{dateList.length}주 누적</span>
    </div>
  )
}
