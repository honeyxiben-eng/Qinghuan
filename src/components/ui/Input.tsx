'use client'
import{forwardRef,useState,type InputHTMLAttributes}from'react'
interface P extends InputHTMLAttributes<HTMLInputElement>{label?:string;error?:string;w?:number|string}
const Input=forwardRef<HTMLInputElement,P>(({label,error,w,className='',onFocus,onBlur,...r},ref)=>{
  const[foc,setFoc]=useState(false)
  return <div style={w?{width:w,flexShrink:0}:undefined}>
    {label&&<label className='text-[12px] font-medium block mb-2' style={{color:'var(--t3)'}}>{label}</label>}
    <input ref={ref} className={`w-full h-[32px] px-3 rounded-[var(--r-full)] text-[10.5px] transition-all outline-none border placeholder:text-[var(--t4)] ${error?'border-[var(--red)] bg-[var(--red-soft)]':'border-[var(--glass-border)] bg-[var(--surface-1)] hover:border-[var(--glass-border-strong)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)]'} ${className}`}
      style={{color:'var(--t1)',boxShadow:foc&&!error?'0 0 0 3px var(--accent-ring)':undefined,transitionDuration:'var(--dur-fast)'}}
      onFocus={e=>{setFoc(true);onFocus?.(e)}} onBlur={e=>{setFoc(false);onBlur?.(e)}} {...r}/>
    {error&&<p className='text-[11px] text-[var(--red)] mt-1.5 flex items-center gap-1'>● {error}</p>}
  </div>
})
Input.displayName='Input';export default Input
