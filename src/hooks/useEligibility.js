import { useState, useCallback } from 'react'
function loadLS(k) {
  try { const r=localStorage.getItem(k); if(!r) return{date:null,codes:new Set()}; const o=JSON.parse(r); return{date:o.date||null,codes:new Set(o.codes||[])} } catch { return{date:null,codes:new Set()} }
}
function saveLS(k,d) { try { localStorage.setItem(k,JSON.stringify({date:d.date,codes:[...d.codes]})) } catch {} }
export function useEligibility() {
  const [trust,  setTrustRaw]  = useState(()=>loadLS('trust_data'))
  const [pension,setPensionRaw]= useState(()=>loadLS('pension_data'))
  const setTrust  = useCallback(d=>{ setTrustRaw(d);  saveLS('trust_data',d)  },[])
  const setPension= useCallback(d=>{ setPensionRaw(d); saveLS('pension_data',d)},[])
  const elig = useCallback((code,type)=>{
    const d=type==='trust'?trust:pension
    if(!d||d.codes.size===0) return null
    return d.codes.has(code)
  },[trust,pension])
  return { trust, pension, setTrust, setPension, elig }
}
