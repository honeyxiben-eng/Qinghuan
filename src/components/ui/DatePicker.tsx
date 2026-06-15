'use client'
import{useState,useRef,useEffect}from'react'
import{DayPicker}from'react-day-picker'
import{zhCN}from'date-fns/locale/zh-CN'
import'react-day-picker/style.css'

interface P{value:string;onChange:(v:string)=>void;w?:number;label?:string}

const MONTHS=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function DatePicker({value,onChange,w,label}:P){
  const[open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  const selected=value?new Date(value+'T00:00:00'):undefined
  const[month,setMonth]=useState<Date|undefined>(selected??new Date())

  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])

  useEffect(()=>{if(value)setMonth(new Date(value+'T00:00:00'))},[value])

  const fmt=(d:Date|undefined)=>{if(!d)return'';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

  const curYear=month?.getFullYear()??new Date().getFullYear()
  const curMonth=month?.getMonth()??0
  const years=Array.from({length:21},(_,i)=>2015+i)

  return<div style={w?{width:w,flexShrink:0}:undefined}ref={ref}>
    {label&&<label className='text-[12px] font-medium block mb-2'style={{color:'var(--t3)'}}>{label}</label>}
    <button type='button'onClick={()=>setOpen(!open)}
      className='w-full h-[40px] px-3.5 rounded-[var(--r-sm)] text-[13px] text-left transition-all border border-[var(--glass-border)] bg-[var(--surface-1)] hover:border-[var(--glass-border-strong)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)]'
      style={{color:value?'var(--t1)':'var(--t4)',cursor:'pointer',transitionDuration:'var(--dur-fast)'}}>
      {value||'选择日期'}
      <span className='float-right opacity-30 mt-0.5'>📅</span>
    </button>
    {open&&<div className='absolute z-50 mt-2 pop'style={{background:'var(--surface-3)',border:'1px solid var(--glass-border-strong)',borderRadius:'var(--r-xl)',boxShadow:'var(--s-lg)',backdropFilter:'blur(20px)',padding:8}}>
      <div className='flex items-center justify-center gap-2 mb-2 px-1'>
        <select value={curYear} onChange={e=>{const y=parseInt(e.target.value);setMonth(new Date(y,curMonth,1))}} className='dp-select' style={{colorScheme:'dark'}}>
          {years.map(y=><option key={y} value={y}>{y}年</option>)}
        </select>
        <select value={curMonth} onChange={e=>{const m=parseInt(e.target.value);setMonth(new Date(curYear,m,1))}} className='dp-select' style={{colorScheme:'dark'}}>
          {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <DayPicker mode='single'locale={zhCN}selected={selected}month={month}onMonthChange={setMonth}onSelect={d=>{onChange(fmt(d));setOpen(false)}}showOutsideDays fixedWeeks/>
    </div>}
  </div>
}
