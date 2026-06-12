'use client'
import{usePathname}from'next/navigation'
import { ChevronRight } from 'lucide-react'

const M:Record<string,string>={'':'中控台',wells:'基础信息',monitoring:'监测数据',lab:'化验数据',analysis:'数据分析',login:'登录'}

export default function Breadcrumb(){
  const p=usePathname();if(p==='/')return null
  const segs=p.split('/').filter(Boolean)
  return<div className='max-w-[1440px] mx-auto px-8 pt-4 pb-0'>
    <div className='flex items-center gap-1.5 text-[12px]' style={{color:'var(--t4)'}}>
      <a href='/' className='transition-colors' style={{color:'var(--t3)'}}>中控台</a>
      {segs.map((s,i)=>(
        <span key={i} className='flex items-center gap-1.5'>
          <ChevronRight size={11} />
          <span className={i===segs.length-1?'font-medium':''}
            style={{color:i===segs.length-1?'var(--t2)':undefined}}>{M[s]||s}</span>
        </span>
      ))}
    </div>
  </div>
}
