import React from 'react'
import styles from './SectionHeader.module.css'

export default function SectionHeader({ title, desc, id }) {
  return (
    <div id={id}>
      <div className={styles.hd}>
        <div className={styles.line} />
        <span className={styles.title}>{title}</span>
        {desc && <span className={styles.desc}>{desc}</span>}
      </div>
      <div className={styles.rule} />
    </div>
  )
}
