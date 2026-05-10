import React from 'react'
import s from './Sidebar.module.css'
const NAV=[
  {id:'top',    icon:'📊',label:'ETF 수익률 대시보드'},
  {id:'const',  icon:'🔍',label:'구성종목 현황'},
  {id:'compare',icon:'📋',label:'멀티기간 비교'},
  {id:'stats',  icon:'📈',label:'전체 통계'},
  {id:'heat',   icon:'🌡', label:'수익률 히트맵'},
  {id:'accum',  icon:'🏆',label:'TOP5 누적 랭킹'},
  {id:'search', icon:'🔎',label:'ETF 검색'},
  {id:'news',   icon:'📰',label:'ETF 주요뉴스'},
]
export default function Sidebar({trust,pension,onOpenModal,onOpenUpload,historyCount,onBack}){
  const go=id=>document.getElementById('sec-'+id)?.scrollIntoView({behavior:'smooth',block:'start'})
  return(
    <nav className={s.sidebar}>
      <div className={s.logo} onClick={onBack} title="메인으로">
        <img src="./images/logo-gold-vertical.png" alt="신한 Premier" className={s.logoImg}/>
        <div className={s.logoDivider}/>
      </div>
      <div className={s.nav}>
        <button className={s.backToMain} onClick={onBack}>← 메인 화면으로</button>
        <div className={s.navLabel} style={{marginTop:8}}>메뉴</div>
        {NAV.map(item=>(
          <button key={item.id} className={s.navItem} onClick={()=>go(item.id)}>
            <span className={s.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id==='accum'&&historyCount>0&&<span className={s.badge}>{historyCount}주</span>}
            {item.id==='news'&&<span className={s.newBadge}>LIVE</span>}
          </button>
        ))}
        <div className={s.navLabel} style={{marginTop:12}}>데이터 관리</div>
        <button className={`${s.navItem} ${s.uploadItem}`} onClick={onOpenUpload}>
          <span className={s.navIcon}>📅</span><span>주간 데이터 업로드</span>
          <span className={s.newBadge}>매주</span>
        </button>
        <button className={s.navItem} onClick={()=>onOpenModal('trust')}>
          <span className={s.navIcon}>🏦</span><span>신탁 목록 업데이트</span>
        </button>
        <button className={s.navItem} onClick={()=>onOpenModal('pension')}>
          <span className={s.navIcon}>🏢</span><span>퇴직연금 목록 업데이트</span>
        </button>
      </div>
      <div className={s.footer}>
        <button className={s.eligItem} onClick={()=>onOpenModal('trust')}>
          <span className={s.eligLabel}>🏦 신탁 기준일</span>
          <span className={`${s.eligDate} ${trust.date?s.trust:s.none}`}>{trust.date||'미설정'}</span>
        </button>
        <button className={s.eligItem} onClick={()=>onOpenModal('pension')}>
          <span className={s.eligLabel}>🏢 퇴직연금 기준일</span>
          <span className={`${s.eligDate} ${pension.date?s.pension:s.none}`}>{pension.date||'미설정'}</span>
        </button>
      </div>
    </nav>
  )
}
