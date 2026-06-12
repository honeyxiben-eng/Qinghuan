'use client'
import{useState,useRef,useEffect}from'react'
import{DayPicker}from'react-day-picker'
import'react-day-picker/style.css'

interface P{value:string;onChange:(v:string)=>void;w?:number;label?:string}

export default function DatePicker({value,onChange,w,label}:P){
  const[open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  const selected=value?new Date(value+'T00:00:00'):undefined

  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])

  const fmt=(d:Date|undefined)=>{if(!d)return'';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

  return<div style={w?{width:w,flexShrink:0}:undefined}ref={ref}>
    {label&&<label className='text-[12px] font-medium block mb-2'style={{color:'var(--t3)'}}>{label}</label>}
    <button type='button'onClick={()=>setOpen(!open)}
      className='w-full h-[40px] px-3.5 rounded-[var(--r-sm)] text-[13px] text-left transition-all border border-[var(--glass-border)] bg-[var(--surface-1)] hover:border-[var(--glass-border-strong)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)]'
      style={{color:value?'var(--t1)':'var(--t4)',cursor:'pointer',transitionDuration:'var(--dur-fast)'}}>
      {value||'选择日期'}
      <span className='float-right opacity-30 mt-0.5'>📅</span>
    </button>
    {open&&<div className='absolute z-50 mt-2 pop'style={{background:'var(--surface-3)',border:'1px solid var(--glass-border-strong)',borderRadius:'var(--r-xl)',boxShadow:'var(--s-lg)',backdropFilter:'blur(20px)',padding:8}}>
      <DayPicker mode='single'selected={selected}onSelect={d=>{onChange(fmt(d));setOpen(false)}}/>
    </div>}
  </div>
}
