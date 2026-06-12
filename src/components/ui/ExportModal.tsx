'use client'
import Button from'@/components/ui/Button'

interface EP{prev:{headers:string[];rows:(string|number|null)[][];total:number};onConfirm:()=>void;onCancel:()=>void}
export function ExportModal({prev,onConfirm,onCancel}:EP){
  const preview=prev.rows.slice(0,5)
  return<div className='fixed inset-0 z-[999] flex items-center justify-center'style={{background:'rgba(0,0,0,0.4)',backdropFilter:'blur(6px)'}}onClick={onCancel}>
    <div className='pop p-7 w-full max-w-[750px] max-h-[80vh] overflow-auto'style={{background:'var(--surface-3)',border:'1px solid var(--glass-border-strong)',borderRadius:'var(--r-xl)',boxShadow:'var(--s-lg)',backdropFilter:'blur(24px)'}}onClick={e=>e.stopPropagation()}>
      <h3 className='text-[17px] font-bold mb-2'style={{color:'var(--t1)'}}>导出预览</h3>
      <p className='text-[13px] mb-4'style={{color:'var(--t2)'}}>共 <b>{prev.total}</b> 条记录，以下为前 5 行预览：</p>
      <div className='overflow-x-auto mb-5 rounded-[var(--r-md)]' style={{border:'1px solid var(--glass-border)',background:'var(--surface-1)'}}><table className='w-full text-[12px]'><thead><tr style={{borderBottom:'1px solid var(--glass-border)'}}>{prev.headers.map((h:string,i:number)=><th key={i}className='py-2 px-3 text-left font-semibold whitespace-nowrap'style={{color:'var(--t3)'}}>{h}</th>)}</tr></thead>
        <tbody>{preview.map((r,i:number)=><tr key={i}style={{borderBottom:'1px solid var(--border-light)'}}>{prev.headers.map((_h:string,j:number)=><td key={j}className='py-2 px-3 whitespace-nowrap'style={{color:'var(--t2)'}}>{r[j]??'—'}</td>)}</tr>)}</tbody></table></div>
      <div className='flex justify-end gap-2.5'><Button variant='secondary'onClick={onCancel}>取消</Button><Button variant='primary'onClick={onConfirm}>确认导出 ({prev.total} 条)</Button></div>
    </div>
  </div>
}
