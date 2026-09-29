import {useEffect,useMemo,useRef,useState} from 'react'
import {Bar,BarChart,CartesianGrid,Cell,ComposedChart,Legend,Line,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import Hero3D from './Hero3D'
import Optimizer from './Optimizer'
import {CLS,ORIGINS,PORTS,check,tlc,sha,forecast,charter} from './engine'

const X=(lon:number)=>(lon-25)*7.7,Y=(lat:number)=>(30-lat)*7.7
const poly=(pts:number[][])=>pts.map(([a,b])=>`${X(a)},${Y(b)}`).join(' ')
const LAND=[[[68,23],[72,21],[73,16],[77,8],[80,13],[85,19],[87,21.5],[89,22],[92,22],[92,27],[78,32],[70,28]],
[[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[151,-34],[146,-39],[138,-35],[131,-31],[115,-34]],
[[95,5],[106,-6],[104,-6],[96,2]],[[105,-6],[114,-7],[114,-8.5],[106,-7.5]],[[109,1],[117,7],[119,1],[116,-4],[110,-3]],
[[15,-34],[32,-28],[40,-15],[40,-2],[51,11],[43,12],[35,30],[25,30],[15,-10]]]
const PRE={All:[0,0,1000,540],'East Coast India':[380,30,240,150],Australia:[700,300,300,240],Indonesia:[520,140,260,200]}
const CC={Capesize:'#f59e0b',Panamax:'#38bdf8',Supramax:'#4ade80',Handysize:'#c084fc'}
const V0=[
{id:'IMO9811',name:'MV Coral Ridge',cls:'Capesize',o:'Hay Point',d:'Vizag',cargo:'Coking coal',mt:170000,prog:.55,spd:12.4,fob:225,fr:18.5,baf:6.2,lay:96,dwell:0},
{id:'IMO9702',name:'MV Bulk Sagar',cls:'Capesize',o:'Newcastle',d:'Haldia',cargo:'Coking coal',mt:165000,prog:.35,spd:11.8,fob:218,fr:20.1,baf:6.9,lay:96,dwell:0},
{id:'IMO9555',name:'MV Kalimantan Star',cls:'Panamax',o:'Samarinda',d:'Paradip',cargo:'Coking coal',mt:72000,prog:.7,spd:12.9,fob:160,fr:11.4,baf:3.9,lay:72,dwell:30},
{id:'IMO9433',name:'MV Java Pioneer',cls:'Supramax',o:'Tanjung Priok',d:'Haldia',cargo:'Limestone',mt:52000,prog:.6,spd:13.1,fob:38,fr:9.2,baf:3.1,lay:60,dwell:66},
{id:'IMO9377',name:'MV Zulu Breeze',cls:'Handysize',o:'Richards Bay',d:'Paradip',cargo:'Coking coal',mt:32000,prog:.25,spd:12.0,fob:190,fr:24.0,baf:7.5,lay:48,dwell:0}]
const API=[
['Baltic Exchange API','GET /v1/indices/{BCI|BPI|BSI}?from=&to= — daily routes/indices','{"index":"BCI","date":"2026-09-29","value":2410.0,"currency":"USD"}'],
['Spire Global / AIS','WSS /ais/v2/stream?mmsi= — position, SOG, COG, draught','{"mmsi":419000001,"lat":-12.4,"lon":93.1,"sog":12.4,"cog":312,"draught":17.6}'],
['S&P Platts Bunkerwire','GET /bunker/v1/assessments?grade=VLSFO&port=Singapore','{"grade":"VLSFO","port":"Singapore","price":584.5,"unit":"USD/MT"}'],
['IMO GISIS','GET /gisis/ships/{imo} — particulars & PSC status','{"imo":9811000,"flag":"MH","dwt":180000,"beam":45}'],
['SAP / Oracle ERP','POST /odata/PurchaseOrder — parcel PO & goods receipt (OData v4 / REST)','{"PO":"4500012345","material":"COKING_COAL","qty":170000,"uom":"MT","tlcUSD":268.4}']]

const Card=({t,children,c=''}:any)=><section className={`rounded-lg border border-slate-700 bg-slate-900 p-3 ${c}`}><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">{t}</h2>{children}</section>
const Sl=({l,v,set,min,max,u}:any)=><label className="block text-sm text-slate-200">{l}: <b className="text-amber-300">{v}{u}</b><input aria-label={l} type="range" min={min} max={max} value={v} onChange={e=>set(+e.target.value)} className="w-full accent-amber-400"/></label>
const badge=(s:string)=>s==='OK'?'bg-emerald-900 text-emerald-200':s==='LIGHTER'?'bg-amber-900 text-amber-100':'bg-red-900 text-red-100'

export default function App(){
 const [tab,setTab]=useState('Optimizer'),[role,setRole]=useState('Procurement Officer'),[sel,setSel]=useState(V0[0].id)
 const [vs,setVs]=useState(V0),[fx,setFx]=useState(84),[shock,setShock]=useState(0),[mom,setMom]=useState(0),[vb,setVb]=useState(PRE.All)
 const [chain,setChain]=useState<any[]>([]),[st,setSt]=useState<Record<string,string>>({}),[ver,setVer]=useState('')
 const cr=useRef<any[]>([]),drag=useRef<any>(null)
 const cmd=role==='SAIL Logistics Command'
 const add=async(a:string,r=role)=>{const p=cr.current[cr.current.length-1],e:any={i:cr.current.length,ts:new Date().toISOString(),role:r,a,prev:p?p.hash:'0'.repeat(64)}
  e.hash=await sha(JSON.stringify([e.i,e.ts,e.role,e.a,e.prev]));cr.current=[...cr.current,e];setChain(cr.current)}
 useEffect(()=>{add('GENESIS: FreightIQ ledger initialised','System')},[])
 useEffect(()=>{const t=setInterval(()=>setVs(a=>a.map(v=>({...v,prog:Math.min(.98,v.prog+.0008),dwell:v.dwell+(v.prog>.6?.05:0)}))),2000);return()=>clearInterval(t)},[])
 const pos=(v:any)=>{const o=ORIGINS[v.o],d=PORTS[v.d].pos;return [o[0]+(d[0]-o[0])*v.prog,o[1]+(d[1]-o[1])*v.prog]}
 const hdg=(v:any)=>{const o=ORIGINS[v.o],d=PORTS[v.d].pos;return Math.round((Math.atan2(d[0]-o[0],d[1]-o[1])*180/Math.PI+360)%360)}
 const v=vs.find(x=>x.id===sel),T=tlc(v,fx,shock),chk=check(v.cls,v.d)
 const fc=useMemo(()=>forecast(mom,shock,fx-84),[mom,shock,fx]),ch=useMemo(()=>charter(mom,shock,fx-84),[mom,shock,fx])
 const zoom=(k:number)=>{const[x,y,w,h]=vb,nw=Math.min(1000,Math.max(80,w*k)),nh=nw*.54;setVb([x+(w-nw)/2,y+(h-nh)/2,nw,nh])}
 const draft=async()=>{setSt(s=>({...s,[v.id]:'DRAFT'}));await add(`DRAFT parcel ${v.id} ${v.cargo} ${v.mt}MT ${v.o}→${v.d} TLC $${T.usd.toFixed(2)}/MT ₹${T.cr.toFixed(1)}Cr`)}
 const appr=async()=>{setSt(s=>({...s,[v.id]:'APPROVED'}));await add(`APPROVE charter ${v.id} TLC ₹${T.cr.toFixed(1)}Cr @${fx}`)}
 const verify=async()=>{let p='0'.repeat(64);for(const e of cr.current){if(e.prev!==p||e.hash!==await sha(JSON.stringify([e.i,e.ts,e.role,e.a,e.prev]))){setVer(`❌ Chain broken at entry #${e.i}`);return}p=e.hash}setVer(`✅ ${cr.current.length} entries verified`)}
 const tamper=()=>{if(cr.current.length>1){cr.current=cr.current.map((e,i)=>i===1?{...e,a:e.a+' [EDITED]'}:e);setChain(cr.current)}}
 const stack=[{n:'Cost',...T.parts}]
 const cols=['#f59e0b','#38bdf8','#f87171','#a3e635','#c084fc','#2dd4bf','#fb7185']
 const alerts=vs.filter(x=>x.dwell>0).map(x=>({...x,left:x.lay-x.dwell}))
 const tabs=['Optimizer','Map','TLC','Ports','Forecast','Charter','Demurrage','Audit','API Hub']
 return <div className="min-h-screen bg-transparent text-slate-100">
  <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-3 py-2">
   <h1 className="text-lg font-black text-cyan-300">FreightIQ <span className="text-xs font-normal text-slate-300">SAIL Maritime Freight &amp; Chartering Optimizer · SIH 26006</span></h1>
   <select aria-label="Role" value={role} onChange={e=>{setRole(e.target.value);add('ROLE SWITCH → '+e.target.value,e.target.value)}} className="ml-auto rounded border border-slate-500 bg-slate-800 px-2 py-1 text-sm">
    <option>Procurement Officer</option><option>SAIL Logistics Command</option></select>
   <nav className="flex w-full gap-1 overflow-x-auto" role="tablist">{tabs.map(t=><button key={t} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)} className={`whitespace-nowrap rounded-full px-4 py-1 text-sm font-semibold transition ${tab===t?'bg-cyan-300 text-slate-950':'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}>{t}</button>)}</nav>
  </header>
  <section className="relative h-72 overflow-hidden border-b border-cyan-400/20"><Hero3D/><div className="relative z-10 flex h-full max-w-2xl flex-col justify-center gap-3 p-6 bg-gradient-to-r from-slate-950/90 to-transparent">
   <span className="text-xs font-semibold tracking-widest text-cyan-300">SMART INDIA HACKATHON 2026 · PS 26006 · TEAM DECODED LEDGER</span>
   <h1 className="font-h text-4xl font-extrabold text-white sm:text-5xl">Freight<span className="text-cyan-300">IQ</span></h1>
   <p className="text-slate-200">From Freight Forecasting to Chartering Decisions — one intelligent platform for SAIL's coking coal &amp; limestone imports.</p>
   <div className="flex flex-wrap gap-2"><button className="btn btn-p" onClick={()=>setTab('Optimizer')}>▶ Run demo scenario</button><button className="btn btn-g" onClick={()=>setTab('Map')}>Open fleet map</button><button className="btn btn-g" onClick={()=>setTab('API Hub')}>Integrations</button></div></div></section>
  <main className="grid gap-3 p-3 lg:grid-cols-3">
   <div className="space-y-3 lg:col-span-2">
   {tab==='Optimizer'&&<Optimizer shock={shock} mom={mom} fx={fx} fc={fc} add={add} cmd={cmd}/>}
   {tab==='Map'&&<Card t="Indian Ocean AIS Fleet Map">
    <div className="mb-2 flex flex-wrap gap-1">{Object.keys(PRE).map(k=><button key={k} onClick={()=>setVb(PRE[k])} className="btn btn-g !px-2 !py-1 !text-xs">{k}</button>)}
     <button onClick={()=>zoom(.7)} aria-label="Zoom in" className="btn btn-g !px-2 !py-1 !text-xs">＋</button><button onClick={()=>zoom(1.4)} aria-label="Zoom out" className="btn btn-g !px-2 !py-1 !text-xs">－</button></div>
    <svg viewBox={vb.join(' ')} className="w-full touch-none rounded bg-slate-950" style={{aspectRatio:'1000/540'}} role="img" aria-label="Vessel map"
     onWheel={e=>zoom(e.deltaY>0?1.1:.9)} onPointerDown={e=>{drag.current=[e.clientX,e.clientY]}} onPointerUp={()=>{drag.current=null}}
     onPointerMove={e=>{if(!drag.current)return;const r=e.currentTarget.getBoundingClientRect(),k=vb[2]/r.width;setVb([vb[0]-(e.clientX-drag.current[0])*k,vb[1]-(e.clientY-drag.current[1])*k,vb[2],vb[3]]);drag.current=[e.clientX,e.clientY]}}>
     {LAND.map((p,i)=><polygon key={i} points={poly(p)} fill="#1e293b" stroke="#475569"/>)}
     {Object.entries(ORIGINS).map(([n,[a,b]])=><g key={n}><circle cx={X(a)} cy={Y(b)} r={4*vb[2]/1000+2} fill="#38bdf8"/><text x={X(a)+6} y={Y(b)-4} fontSize={11*vb[2]/1000+3} fill="#bae6fd">{n}</text></g>)}
     {Object.entries(PORTS).map(([n,p])=>{const[a,b]=p.pos;return <g key={n}><rect x={X(a)-4} y={Y(b)-4} width={8*vb[2]/1000+2} height={8*vb[2]/1000+2} fill="#f87171"/><text x={X(a)+8} y={Y(b)+3} fontSize={11*vb[2]/1000+3} fill="#fecaca">{n} · {p.draft}m</text></g>})}
     {vs.map(x=>{const[a,b]=pos(x),o=ORIGINS[x.o],d=PORTS[x.d].pos;return <g key={x.id} onClick={()=>setSel(x.id)} className="cursor-pointer">
      <line x1={X(o[0])} y1={Y(o[1])} x2={X(d[0])} y2={Y(d[1])} stroke="#64748b" strokeDasharray="4 4"/>
      <circle cx={X(a)} cy={Y(b)} r={(x.id===sel?9:6)*vb[2]/1000+2} fill={CC[x.cls]} stroke="#fff"/></g>})}
    </svg>
    <p className="mt-1 text-xs text-slate-300">Sandheads anchorage (Haldia): Capesize/Panamax lighter to ≤8.2 m before river transit. Tap a vessel to inspect.</p>
   </Card>}
   {tab==='TLC'&&<Card t={`Total Landed Cost — ${v.name}`}>
    <div className="grid grid-cols-2 gap-2 text-center"><div className="rounded bg-slate-800 p-2"><div className="text-2xl font-black text-amber-300">${T.usd.toFixed(2)}</div><div className="text-xs">per MT</div></div><div className="rounded bg-slate-800 p-2"><div className="text-2xl font-black text-amber-300">₹{T.cr.toFixed(1)} Cr</div><div className="text-xs">parcel @ ₹{fx}/USD</div></div></div>
    <div className="h-48"><ResponsiveContainer><BarChart data={stack} layout="vertical"><CartesianGrid stroke="#334155"/><XAxis type="number" stroke="#cbd5e1"/><YAxis type="category" dataKey="n" hide/><Tooltip/><Legend/>{Object.keys(T.parts).map((k,i)=><Bar key={k} dataKey={k} stackId="a" fill={cols[i]}/>)}</BarChart></ResponsiveContainer></div>
    <Sl l="USD/INR" v={fx} set={setFx} min={78} max={92} u=""/>
    <div className="mt-2 flex flex-wrap gap-2"><button onClick={draft} className="btn btn-p">Draft parcel</button>
     <button disabled={!cmd||st[v.id]!=='DRAFT'} onClick={appr} className="btn btn-a">Approve (Command)</button><span className="self-center text-sm">Status: {st[v.id]||'—'}</span></div>
   </Card>}
   {tab==='Ports'&&<Card t="Port Constraint & Navigational Safety Checker"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-300"><th>Class (draft/beam)</th>{Object.keys(PORTS).map(p=><th key={p}>{p} ({PORTS[p].draft}m)</th>)}</tr></thead><tbody>
    {Object.keys(CLS).map(c=><tr key={c} className="border-t border-slate-700"><td className="py-1">{c} ({CLS[c].draft}/{CLS[c].beam})</td>{Object.keys(PORTS).map(p=>{const r=check(c,p);return <td key={p}><span className={`rounded px-1 text-xs ${badge(r.status)}`}>{r.status}</span><div className="text-xs text-slate-300">{r.msgs[0]}</div></td>})}</tr>)}</tbody></table></div>
    {Object.entries(PORTS).map(([n,p])=><p key={n} className="mt-2 text-xs text-slate-300"><b>{n}:</b> {p.note}</p>)}</Card>}
   {tab==='Forecast'&&<Card t="Hybrid Ensemble Forecast (LSTM 40% · Prophet 30% · XGBoost 30%)"><div className="h-72"><ResponsiveContainer><ComposedChart data={fc}><CartesianGrid stroke="#334155"/><XAxis dataKey="m" stroke="#cbd5e1"/><YAxis yAxisId="l" stroke="#cbd5e1"/><YAxis yAxisId="r" orientation="right" stroke="#fbbf24"/><Tooltip contentStyle={{background:'#0f172a'}}/><Legend/>
    <Line yAxisId="l" dataKey="BCI" stroke="#f59e0b" dot={false}/><Line yAxisId="l" dataKey="BPI" stroke="#38bdf8" dot={false}/><Line yAxisId="l" dataKey="BSI" stroke="#4ade80" dot={false}/><Line yAxisId="r" dataKey="Bunker" name="VLSFO $/MT" stroke="#f87171" strokeDasharray="5 3" dot={false}/></ComposedChart></ResponsiveContainer></div>
    <p className="text-xs text-slate-300">Client-side reference ensemble; production wires to the model-serving endpoints in the API Hub.</p></Card>}
   {tab==='Charter'&&<Card t={`Spot vs Period Chartering — ${ch.reg} volatility`}><div className="grid gap-2 sm:grid-cols-2"><div className="h-56"><ResponsiveContainer><PieChart><Pie data={ch.opts} dataKey="score" nameKey="n" innerRadius={45} outerRadius={80} label>{ch.opts.map((_,i)=><Cell key={i} fill={cols[i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    <ul className="space-y-1 text-sm">{ch.opts.map(o=><li key={o.n} className="flex justify-between rounded bg-slate-800 px-2 py-1"><span>{o.n}</span><b>{o.score}/100</b></li>)}<li className="text-xs text-slate-300">Recommended: <b className="text-amber-300">{[...ch.opts].sort((a,b)=>b.score-a.score)[0].n}</b></li></ul></div></Card>}
   {tab==='Demurrage'&&<Card t="Berth Dwell & Laytime Warnings">{alerts.map(a=>{const w=a.left<0?'DEMURRAGE ACCRUING':a.left<12?'WARNING <12h':'On track';return <div key={a.id} className="mb-2 rounded bg-slate-800 p-2 text-sm"><div className="flex justify-between"><b>{a.name}</b><span className={`rounded px-1 text-xs ${a.left<0?badge('FAIL'):a.left<12?badge('LIGHTER'):badge('OK')}`}>{w}</span></div>
    <div className="h-2 rounded bg-slate-700"><div className="h-2 rounded bg-amber-400" style={{width:`${Math.min(100,a.dwell/a.lay*100)}%`}}/></div><div className="text-xs text-slate-300">Dwell {a.dwell.toFixed(1)}h / laytime {a.lay}h · {a.left<0?`≈ $${(-a.left/24*22000).toFixed(0)} accrued @ $22k/day`:`${a.left.toFixed(1)}h remaining`}</div></div>})}</Card>}
   {tab==='Audit'&&<Card t="Tamper-Evident SHA-256 Audit Trail"><div className="mb-2 flex flex-wrap gap-2"><button onClick={verify} className="btn btn-p">Verify chain</button><button onClick={tamper} className="btn btn-g">Simulate tamper</button><span className="self-center text-sm">{ver}</span></div>
    <ol className="space-y-1 font-mono text-xs">{chain.map(e=><li key={e.i} className="break-all rounded bg-slate-800 p-2">#{e.i} {e.ts} · {e.role}<br/>{e.a}<br/><span className="text-emerald-300">{e.hash}</span></li>)}</ol></Card>}
   {tab==='API Hub'&&<Card t="Enterprise Integration Specs">{API.map(([n,e,s])=><div key={n} className="mb-2 rounded bg-slate-800 p-2 text-sm"><b className="text-amber-300">{n}</b><div className="font-mono text-xs">{e}</div><pre className="overflow-x-auto text-xs text-slate-300">{s}</pre></div>)}</Card>}
   </div>
   <aside className="space-y-3">
    <Card t="Vessel Inspector"><select aria-label="Vessel" value={sel} onChange={e=>setSel(e.target.value)} className="mb-2 w-full rounded border border-slate-500 bg-slate-800 p-1 text-sm">{vs.map(x=><option key={x.id} value={x.id}>{x.name} ({x.cls})</option>)}</select>
     <dl className="grid grid-cols-2 gap-1 text-sm"><dt>Route</dt><dd>{v.o} → {v.d}</dd><dt>Cargo</dt><dd>{v.cargo} {v.mt.toLocaleString()} MT</dd><dt>Speed / Hdg</dt><dd>{v.spd} kn / {hdg(v)}°</dd><dt>Progress</dt><dd>{(v.prog*100).toFixed(1)}%</dd><dt>TLC</dt><dd>${T.usd.toFixed(1)}/MT · ₹{T.cr.toFixed(1)} Cr</dd></dl>
     <div className={`mt-2 rounded p-2 text-sm ${badge(chk.status)}`}><b>{chk.status}</b> at {v.d}: {chk.msgs.join('; ')}</div></Card>
    <Card t="Scenario Stress Test"><Sl l="Bunker shock" v={shock} set={setShock} min={-30} max={50} u="%"/><Sl l="USD/INR" v={fx} set={setFx} min={78} max={92} u=""/><Sl l="Market momentum" v={mom} set={setMom} min={-30} max={30} u="%"/></Card>
   </aside>
  </main></div>}
