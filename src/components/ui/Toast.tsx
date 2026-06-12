'use client'
import{useState,useEffect}from'react'
type TT='success'|'error'|'warning'|'info'
interface T{id:string;message:string;type:TT}
let ls:((t:T[])=>void)[]=[],cache:T[]=[],nid=0
function notify(){ls.forEach(l=>l([...cache]))}
export function addToast(msg:string,type:TT='info',dur=3200){const id=String(++nid);cache=[...cache,{id,message:msg,type}];notify();if(dur>0)setTimeout(()=>{cache=cache.filter(t=>t.id!==id);notify()},dur)}
export function ToastContainer(){
  const[toasts,setToasts]=useState<T[]>([])
  useEffect(()=>{const h=(t:T[])=>setToasts([...t]);ls.push(h);return()=>{ls=ls.filter(x=>x!==h)}},[]
  )
  if(!toasts.length)return null
  const cfg:Record<TT,{bg:string;dot:string;icon:string}>={success:{bg:'var(--green-soft)',dot:'var(--green)',icon:'✓'},error:{bg:'var(--red-soft)',dot:'var(--red)',icon:'✕'},warning:{bg:'var(--amber-soft)',dot:'var(--amber)',icon:'!'},info:{bg:'var(--accent-soft)',dot:'var(--accent)',icon:'i'}}
  return <div className='fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm'>
    {toasts.map(t=><div key={t.id} className='pop flex items-center gap-3 px-5 py-3.5' style={{background:'var(--surface-3)',border:'1px solid var(--glass-border-strong)',borderRadius:'var(--r-lg)',boxShadow:'var(--s-lg)',backdropFilter:'blur(20px)',borderLeft:'3px solid '+cfg[t.type].dot}}>
      <span className='w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0' style={{background:cfg[t.type].dot}}>{cfg[t.type].icon}</span>
      <span className='text-[13px] font-medium' style={{color:'var(--t1)'}}>{t.message}</span>
    </div>)}
  </div>
}
