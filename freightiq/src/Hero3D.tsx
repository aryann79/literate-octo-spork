import {useEffect,useRef} from 'react'
import * as THREE from 'three'
export default function Hero3D(){
 const r=useRef<HTMLDivElement>(null)
 useEffect(()=>{const el=r.current!,W=()=>el.clientWidth,H=()=>el.clientHeight
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,W()/H(),.1,100);cam.position.set(0,3.4,8);cam.lookAt(0,.2,0)
  const rd=new THREE.WebGLRenderer({antialias:true,alpha:true});rd.setPixelRatio(Math.min(2,devicePixelRatio));rd.setSize(W(),H());el.appendChild(rd.domElement)
  const N=70,g=new THREE.BufferGeometry(),a=new Float32Array(N*N*3)
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const k=(i*N+j)*3;a[k]=(i-N/2)*.25;a[k+2]=(j-N/2)*.25}
  g.setAttribute('position',new THREE.BufferAttribute(a,3))
  const oc=new THREE.Points(g,new THREE.PointsMaterial({color:0x22d3ee,size:.035,transparent:true,opacity:.75}));sc.add(oc)
  const globe=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,2),new THREE.MeshBasicMaterial({color:0x2dd4bf,wireframe:true,transparent:true,opacity:.35}));globe.position.set(4,1.8,-2);sc.add(globe)
  const port=new THREE.Vector3(3,.1,1),ships:any[]=[]
  ;[[-7,-1],[-6,3],[-8,1]].forEach(([x,z],i)=>{const c=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,.1,z),new THREE.Vector3((x+3)/2,2.2,(z+1)/2),port)
   sc.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(50)),new THREE.LineBasicMaterial({color:0xfbbf24,transparent:true,opacity:.5})))
   const s=new THREE.Mesh(new THREE.SphereGeometry(.09,16,16),new THREE.MeshBasicMaterial({color:0xfbbf24}));sc.add(s);ships.push({c,s,o:i/3})})
  const pm=new THREE.Mesh(new THREE.TorusGeometry(.25,.03,8,32),new THREE.MeshBasicMaterial({color:0xf87171}));pm.position.copy(port);pm.rotation.x=Math.PI/2;sc.add(pm)
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let raf=0,t=0
  const draw=()=>{t+=.016;const p=g.attributes.position as THREE.BufferAttribute
   for(let i=0;i<N;i++)for(let j=0;j<N;j++){const k=i*N+j;p.setY(k,Math.sin(i*.35+t*1.4)*.12+Math.cos(j*.3+t)*.1)}
   p.needsUpdate=true;globe.rotation.y=t*.25;pm.scale.setScalar(1+.3*Math.sin(t*3))
   ships.forEach(o=>o.s.position.copy(o.c.getPoint((t*.08+o.o)%1)))
   cam.position.x=Math.sin(t*.15)*.8;cam.lookAt(0,.2,0);rd.render(sc,cam);if(!reduce)raf=requestAnimationFrame(draw)}
  draw()
  const rs=()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rd.setSize(W(),H())};addEventListener('resize',rs)
  return()=>{cancelAnimationFrame(raf);removeEventListener('resize',rs);rd.dispose();el.removeChild(rd.domElement)}},[])
 return <div ref={r} aria-hidden className="absolute inset-0"/>}
