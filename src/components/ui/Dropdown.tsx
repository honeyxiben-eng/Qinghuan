'use client'
import{useState,useRef,useEffect}from'react'

interface P{label?:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];w?:number}

export default function Dropdown({label,value,onChange,options,w}:P){
  const[open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  const selected=options.find(o=>o.value===value)

  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])

  return<div style={w?{width:w,flexShrink:0,position:'relative'}:{position:'relative'}}ref={ref}>
    {label&&<label className='text-[12px] font-medium block mb-2'style={{color:'var(--t3)'}}>{label}</label>}
    <button type='button'onClick={()=>setOpen(!open)}
      className='w-full h-[40px] px-3.5 rounded-[var(--r-sm)] text-[13px] text-left transition-all border border-[var(--glass-border)] bg-[var(--surface-1)] hover:border-[var(--glass-border-strong)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)] flex items-center justify-between'
      style={{color:selected?'var(--t1)':'var(--t4)',cursor:'pointer',transitionDuration:'var(--dur-fast)'}}>
      <span className='truncate'>{selected?.label||'请选择'}</span>
      <svg width='10'height='6'viewBox='0 0 10 6'fill='none'stroke='var(--t3)'strokeWidth='1.6'className={`transition-transform duration-200 ${open?'rotate-180':''}`}><path d='M1 1l4 4 4-4'strokeLinecap='round'/></svg>
    </button>
    {open&&<div className='absolute z-50 left-0 right-0 mt-2 pop overflow-hidden'style={{background:'var(--surface-3)',border:'1px solid var(--glass-border-strong)',borderRadius:'var(--r-md)',boxShadow:'var(--s-lg)',backdropFilter:'blur(20px)',maxHeight:260,overflowY:'auto'}}>
      {options.map(o=><button key={o.value}type='button'onClick={()=>{onChange(o.value);setOpen(false)}}
        className='w-full text-left px-3.5 py-2.5 text-[13px] transition-colors hover:bg-[var(--surface-1)]'
        style={{color:o.value===value?'var(--accent)':'var(--t1)',background:o.value===value?'var(--accent-soft)':'transparent',fontWeight:o.value===value?600:400}}>
        {o.label}
      </button>)}
    </div>}
  </div>
}
