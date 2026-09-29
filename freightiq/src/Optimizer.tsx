import {useEffect,useState} from 'react'
import {Bar,BarChart,CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis,Legend} from 'recharts'
import {PORTS,check} from './engine'
const C=[['MV Ocean Atlas','Panamax',12.4,4.6,.3],['MV Bay Trader','Panamax',12.9,4.4,.2],['MV Utkal Pride','Panamax',13.4,4.0,.5],['MV Coral Sun','Supramax',14.0,3.1,.4],['MV Delta Wave','Supramax',14.5,3.0,.3],['MV Sea Falcon','Handysize',15.6,2.6,.6],['MV Titan Cape','Capesize',11.2,5.8,.5],['MV Grand Cape','Capesize',11.6,5.6,.4]]
const STEPS=['Ingesting market signals (Baltic · AIS · bunker · port)','Forecasting freight trend (ensemble)','Finding candidate vessels','Validating port draft & beam','Optimising cargo ↔ vessel ↔ route','Generating recommendation']
const rank=(port:string,mt:number,shock:number,mom:number,fx:number)=>{
 const P=PORTS[port],rows=C.map(([n,cls,fr,baf,rk]:any)=>{const b=baf*(1+shock/100),f=fr*(1+mom/300),d=.025*(160+f+b),usd=160+f+b+P.tariff+d+P.rail+rk,chk=check(cls,port)
  return {n,cls,usd,cr:usd*mt*fx/1e7,f,ok:chk.status!=='FAIL',why:chk.msgs[0]}})
 const ok=rows.filter(r=>r.ok).sort((a,b)=>a.usd-b.usd);return {ok,bad:rows.filter(r=>!r.ok),best:ok[0],gap:ok[1].usd-ok[0].usd}}
export default function Optimizer({shock,mom,fx,fc,add,cmd}:any){
 const [mt,setMt]=useState(50000),[port,setPort]=useState('Paradip'),[stage,setStage]=useState(-1),[show,setShow]=useState(''),[brief,setBrief]=useState(''),[ans,setAns]=useState(false)
 useEffect(()=>{if(stage<0||stage>=STEPS.length)return;const t=setTimeout(()=>setStage(s=>s+1),650);return()=>clearTimeout(t)},[stage])
 const R=rank(port,mt,shock,mom,fx),B=rank(port,mt,0,0,fx),done=stage>=STEPS.length,flip=done&&R.best.n!==B.best.n
 const conf=Math.min(95,Math.round(60+R.gap*20)),risk=R.best.usd-R.best.f>0&&R.gap>.3?'Low':R.gap>.1?'Medium':'High'
 const up=fc[2].BCI>fc[0].BCI*1.02
 return <div className="space-y-3">
  <div className="rounded-lg border border-cyan-400/30 bg-slate-900/80 p-3">
   <h2 className="font-h text-sm font-bold uppercase tracking-wider text-cyan-300">Charter Optimizer — Demo Scenario</h2>
   <div className="mt-2 flex flex-wrap items-end gap-3 text-sm">
    <label>Cargo (MT)<input type="number" value={mt} onChange={e=>setMt(+e.target.value||1)} className="mt-1 block w-32 rounded border border-slate-500 bg-slate-800 p-1"/></label>
    <label>Destination<select value={port} onChange={e=>setPort(e.target.value)} className="mt-1 block rounded border border-slate-500 bg-slate-800 p-1">{Object.keys(PORTS).map(p=><option key={p}>{p}</option>)}</select></label>
    <span className="text-slate-300">Window: next 14 days · Origin: overseas</span>
    <button className="btn btn-p ml-auto" onClick={()=>{setStage(0);setShow('')}}>▶ Analyze</button></div>
   <span className="mt-2 inline-block rounded bg-amber-900 px-2 py-0.5 text-xs text-amber-100">Synthetic demo data — not live market output</span></div>
  {stage>=0&&<div className="rounded-lg border border-slate-700 bg-slate-900 p-3"><ol className="space-y-1 text-sm">{STEPS.map((s,i)=><li key={s} className={i<stage?'text-emerald-300':i===stage?'animate-pulse text-cyan-200':'text-slate-500'}>{i<stage?'✓':i===stage?'◔':'○'} {s}{i===2&&stage>2?` — ${C.length} candidates`:''}{i===3&&stage>3?` — ${R.bad.length} eliminated (draft/beam)`:''}</li>)}</ol></div>}
  {done&&<div className="rounded-lg border-2 border-emerald-400/60 bg-slate-900 p-3">
   <div className="font-h text-xs font-bold uppercase text-emerald-300">Recommended charter option</div>
   <div className="mt-1 text-xl font-black">{R.best.n} <span className="text-sm font-normal text-slate-300">({R.best.cls})</span></div>
   <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-5">{[['Route','Overseas → '+port],['Freight','$'+R.best.f.toFixed(1)+'/MT'],['Landed cost','$'+R.best.usd.toFixed(1)+' · ₹'+R.best.cr.toFixed(1)+' Cr'],['Risk',risk],['Confidence',conf+'% (est.)']].map(([k,v])=><div key={k} className="rounded bg-slate-800 p-2"><div className="text-xs text-slate-300">{k}</div><b>{v}</b></div>)}</div>
   {flip&&<p className="mt-2 rounded bg-amber-900 p-2 text-sm text-amber-100">⚠ Decision changed vs baseline ({B.best.n}) — driven by your scenario sliders.</p>}
   <div className="mt-3 flex flex-wrap gap-2"><button className="btn btn-g" onClick={()=>setShow(show==='why'?'':'why')}>Why?</button><button className="btn btn-g" onClick={()=>setShow(show==='not'?'':'not')}>Why not others?</button>
    <button className="btn btn-a" onClick={()=>setShow('what')}>What if? (use sliders →)</button>
    <button className="btn btn-p" onClick={()=>{setBrief(`CHARTER DECISION BRIEF (synthetic demo)\nCargo: ${mt} MT → ${port}\nRecommended: ${R.best.n} (${R.best.cls})\nLanded cost: $${R.best.usd.toFixed(2)}/MT = ₹${R.best.cr.toFixed(1)} Cr @ ₹${fx}\nRejected: ${R.bad.map(b=>b.n).join(', ')} — ${R.bad[0]?.why}\nScenario: bunker ${shock}%, momentum ${mom}%\nMarket view: freight ${up?'firming':'stable/softening'} over 3 months.`);add(`BRIEF generated: ${R.best.n} → ${port} ₹${R.best.cr.toFixed(1)}Cr`)}}>Generate brief</button>
    <button className="btn btn-g" disabled={!cmd} title={cmd?'':'Requires SAIL Logistics Command role'} onClick={()=>add(`APPROVE OPTIMIZER RECOMMENDATION ${R.best.n} → ${port}`)}>Approve (Command)</button></div>
   {show==='why'&&<div className="mt-2 h-56"><ResponsiveContainer><BarChart data={R.ok.map(r=>({n:r.n.replace('MV ',''),TLC:+r.usd.toFixed(2)}))}><CartesianGrid stroke="#334155"/><XAxis dataKey="n" stroke="#cbd5e1" fontSize={11}/><YAxis domain={['dataMin-1','dataMax+1']} stroke="#cbd5e1"/><Tooltip contentStyle={{background:'#0f172a'}}/><Bar dataKey="TLC" fill="#22d3ee"/></BarChart></ResponsiveContainer></div>}
   {show==='not'&&<ul className="mt-2 space-y-1 text-sm">{R.bad.map(b=><li key={b.n} className="rounded bg-red-950 p-2"><b>{b.n}</b> — {b.why}</li>)}{R.ok.slice(1).map(b=><li key={b.n} className="rounded bg-slate-800 p-2"><b>{b.n}</b> — +${(b.usd-R.best.usd).toFixed(2)}/MT higher landed cost</li>)}</ul>}
   {brief&&<pre className="mt-2 whitespace-pre-wrap rounded bg-slate-800 p-2 text-xs">{brief}</pre>}</div>}
  <div className="rounded-lg border border-slate-700 bg-slate-900 p-3"><h2 className="font-h text-sm font-bold uppercase tracking-wider text-cyan-300">FreightIQ Copilot</h2>
   <button className="btn btn-g mt-2" onClick={()=>setAns(!ans)}>Should we charter now or wait?</button>
   {ans&&<div className="mt-2 text-sm"><p><b>Decision:</b> {up?'Charter now — capesize/panamax indices forecast to firm.':'Hold a short window — indices forecast stable/softer.'} <span className="text-slate-300">(model estimate, synthetic)</span></p>
    <div className="mt-2 h-40"><ResponsiveContainer><LineChart data={fc}><CartesianGrid stroke="#334155"/><XAxis dataKey="m" stroke="#cbd5e1"/><YAxis domain={['auto','auto']} stroke="#cbd5e1"/><Tooltip contentStyle={{background:'#0f172a'}}/><Legend/><Line dataKey="BCI" stroke="#f59e0b" dot={false}/><Line dataKey="BPI" stroke="#38bdf8" dot={false}/></LineChart></ResponsiveContainer></div><p className="text-xs text-slate-300">Evidence: ensemble forecast (momentum + seasonality + covariates).</p></div>}</div></div>}
