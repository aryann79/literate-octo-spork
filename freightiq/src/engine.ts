export const CLS={Capesize:{draft:18.2,beam:45,dwt:180000},Panamax:{draft:14.0,beam:32.2,dwt:75000},Supramax:{draft:12.8,beam:32,dwt:58000},Handysize:{draft:10.0,beam:28,dwt:35000}}
export const ORIGINS={'Hay Point':[149.3,-21.3],Newcastle:[151.8,-32.9],Samarinda:[117.2,-0.5],'Tanjung Priok':[106.9,-6.1],'Richards Bay':[32.1,-28.8]}
export const PORTS={
 Paradip:{pos:[86.7,20.3],draft:14.5,beam:50,tariff:2.1,rail:11.5,note:'Mechanized coal berths; tidal window +0.8 m at HW.'},
 Vizag:{pos:[83.3,17.7],draft:18.1,beam:50,tariff:2.4,rail:13.2,note:'Deep-water outer harbour 18.1 m; Capesize capable.'},
 Haldia:{pos:[88.1,22.0],draft:8.2,beam:32,tariff:3.6,rail:8.9,note:'Riverine 8.2 m limit; Sandheads anchorage lightering mandatory for deeper draft.'}}
export type Chk={status:'OK'|'LIGHTER'|'FAIL';msgs:string[]}
export function check(cls:string,port:string,lightered=false):Chk{
 const c=CLS[cls],p=PORTS[port],m:string[]=[]
 if(port==='Haldia'){
  if(c.draft>p.draft&&!lightered){m.push(`Draft ${c.draft} m > ${p.draft} m riverine limit — incompatible without Sandheads lightering`);
   if(c.beam>p.beam)m.push(`Beam ${c.beam} m > ${p.beam} m lock/channel limit`);return {status:cls==='Capesize'?'FAIL':'LIGHTER',msgs:m}}
  if(c.draft>p.draft)return {status:'LIGHTER',msgs:['Lighter at Sandheads to ≤8.2 m before river transit']}
  return {status:'OK',msgs:['Within riverine limits']}}
 if(c.draft>p.draft)return {status:'FAIL',msgs:[`Draft ${c.draft} m > ${p.draft} m — part-load required`]}
 if(c.beam>p.beam)return {status:'FAIL',msgs:['Beam exceeds berth limit']}
 return {status:'OK',msgs:[port==='Paradip'?'Mechanized coal berth compatible':'Deep-water outer harbour compatible']}}
export const tlc=(v,fx:number,shock:number)=>{
 const fob=v.fob,fr=v.fr,baf=v.baf*(1+shock/100),port=PORTS[v.d].tariff,duty=.025*(fob+fr+baf),rail=PORTS[v.d].rail
 const dem=Math.max(0,v.dwell-v.lay*.6)/24*22000*.3/v.mt*1000/1000*1000/1000+ (v.dwell>v.lay?(v.dwell-v.lay)/24*22000/v.mt:0)
 const parts={FOB:fob,Freight:fr,BAF:baf,Port:port,Duty:duty,Rail:rail,Demurrage:dem}
 const usd=Object.values(parts).reduce((a,b)=>a+b,0)
 return {parts,usd,inr:usd*fx,cr:usd*v.mt*fx/1e7}}
export const sha=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('')
export function forecast(mom:number,shock:number,fx:number){
 const B={BCI:2400,BPI:1650,BSI:1300},out=[]
 for(let m=1;m<=6;m++){const r:any={m:'M+'+m}
  const seas=1+.08*Math.sin(2*Math.PI*((9+m)-4)/12)
  for(const k in B){const b=B[k],l=b*(1+mom/100*.03*m*Math.pow(.85,m)),p=b*seas,x=b*(1+.25*shock/100+.2*fx/100-.01*m*0)
   r[k]=Math.round(.4*l+.3*p+.3*x)}
  r.Bunker=Math.round(580*(1+shock/100)*(1+.004*m)*(1+.05*Math.sin(m)));out.push(r)}
 return out}
export function charter(mom:number,shock:number,fx:number){
 const vol=Math.abs(mom)*.4+Math.abs(shock)*.5+Math.abs(fx)*1.2,reg=vol<8?'Calm':vol<20?'Moderate':'High'
 const T={Calm:[78,60,52,40],Moderate:[55,68,66,52],High:[32,66,78,74]}[reg]
 const s=[T[0]-mom*.3,T[1]+mom*.2,T[2]+mom*.2,T[3]+mom*.15].map(x=>Math.max(5,Math.round(x)))
 return {vol,reg,opts:['Spot','TC 3M','TC 6M','TC 12M'].map((n,i)=>({n,score:s[i]}))}}
