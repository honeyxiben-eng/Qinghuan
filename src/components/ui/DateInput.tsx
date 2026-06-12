'use client'
interface P{label?:string;value:string;onChange:(v:string)=>void;w?:number}
export default function DateInput({label,value,onChange,w}:P){
  return<div style={w?{width:w,flexShrink:0}:undefined}>
    {label&&<label className='text-[12px] font-medium block mb-2'style={{color:'var(--t3)'}}>{label}</label>}
    <input type='date'value={value}onChange={e=>onChange(e.target.value)}
      className='w-full h-[40px] px-3.5 rounded-[var(--r-sm)] text-[13px] transition-all outline-none border border-[var(--glass-border)] bg-[var(--surface-1)] hover:border-[var(--glass-border-strong)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)] focus:shadow-[0_0_0_3px_var(--accent-ring)]'
      style={{color:'var(--t1)',transitionDuration:'var(--dur-fast)'}}/>
  </div>
}
