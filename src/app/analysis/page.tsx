"use client"
import{useState,useEffect}from"react"
import{WELL_LINES}from"@/lib/well-data"
import{compareLines,getTimeSeries,getMonthlyReport,getAvailableMonths,checkKAlerts,checkLiAlerts,getLowKWells,getLineScoring,getWellTrend,getPrevMonthData,getLiLowWells,getMgLiRatio,getKLiRatioRank}from"@/app/actions"
import{addToast}from"@/components/ui/Toast"
import{exportXLSX}from"@/lib/export"
import Button from"@/components/ui/Button"
import Select from"@/components/ui/Select"
import Input from"@/components/ui/Input"
import{WellTrendChart}from"@/components/dashboard/TrendChart"
import{CompareLineChart}from"@/components/dashboard/CompareChart"


const LC:Record<string,string>={HX:'#4a9eff',HX1:'#60a5fa',HX2:'#93c5fd',XB:'#34d399',XBSY:'#6ee7b7',XB1:'#a7f3d0',N7YC:'#fbbf24','18':'#fcd34d','20':'#fde68a',N1:'#f87171',N7NB:'#fca5a5','11':'#38bdf8','12':'#7dd3fc','13':'#bae6fd','14':'#67e8f9',X:'#e879f9',X1:'#f0abfc',N:'#a78bfa',LB:'#c4b5fd',XBYC:'#ddd6fe',N7X:'#fb923c',N1YC:'#fdba74'}
const LO=[{value:'',label:'选择井采线'},...WELL_LINES.map(l=>({value:l.shortName,label:l.name}))]

type View='index'|'compare'|'report'|'kAlert'|'liAlert'|'trend'

export default function AnalysisPage(){
  const[view,setView]=useState<View>('index')
  useEffect(()=>{document.title='清欢 · 数据分析'},[])
  if(view==='compare')return<CompareView onBack={()=>setView('index')}/>
  if(view==='report')return<ReportView onBack={()=>setView('index')}/>
  if(view==='kAlert')return<AlertView type='k' onBack={()=>setView('index')}/>
  if(view==='liAlert')return<AlertView type='li' onBack={()=>setView('index')}/>
  if(view==='trend')return<TrendView onBack={()=>setView('index')}/>
  return<div className='page-container'>
    <div className='mb-6 rise'><h1 className='text-[22px] font-bold tracking-tight' style={{color:'var(--t1)'}}>数据分析</h1><p className='text-[12px] mt-1' style={{color:'var(--t2)'}}>井采线对比 · 月度报告 · 异常监测 · 单井趋势</p></div>
    <div className="grid grid-cols-4 gap-4 mb-6" style={{animation:'rise 0.4s ease both 0.1s'}}>
      <div className="report-card"><div className="report-card-title">井采线总数</div><div className="report-card-value" style={{color:'var(--accent)'}}>{WELL_LINES.length}</div><div className="report-card-sub">可供分析对比</div></div>
      <div className="report-card"><div className="report-card-title">监测月份</div><div className="report-card-value" style={{color:'#60a5fa'}}></div><div className="report-card-sub">选择月份查看报告</div></div>
      <div className="report-card"><div className="report-card-title">K⁺ 低值监测</div><div className="report-card-value" style={{color:'#fbbf24'}}>&lt;6.5</div><div className="report-card-sub">g/L 浓度阈值</div></div>
      <div className="report-card"><div className="report-card-title">Li⁺ 低值监测</div><div className="report-card-value" style={{color:'#60a5fa'}}>&lt;0.15</div><div className="report-card-sub">g/L 浓度阈值</div></div>
    </div>
    <div className='grid grid-cols-2 gap-4 stagger'>
      {[{k:'compare'as View,icon:'📊',t:'井采线对比',d:'K⁺/Li⁺ 对比趋势',c:'#4a9eff'},{k:'report'as View,icon:'📋',t:'月度分析报告',d:'一键生成汇总 Excel',c:'#60a5fa'},{k:'trend'as View,icon:'📈',t:'单井趋势',d:'K⁺/Li⁺ 时间序列折线',c:'#60a5fa'},{k:'kAlert'as View,icon:'⚠️',t:'K⁺ 异常检测',d:'全井扫描浓度下降',c:'#fbbf24'},{k:'liAlert'as View,icon:'⚗️',t:'Li⁺ 异常检测',d:'全井扫描浓度变化',c:'#4f46e5'}].map(x=>(
        <div key={x.k} className='card p-6 cursor-pointer hover:shadow-[var(--s-3)] transition-all duration-200 hover:-translate-y-0.5' onClick={()=>setView(x.k)}>
          <div className='flex items-start gap-4'><div className='w-11 h-11 rounded-[16px] flex items-center justify-center text-xl' style={{background:x.c+'14',color:x.c}}>{x.icon}</div><div><h3 className='text-[15px] font-bold' style={{color:'var(--t1)'}}>{x.t}</h3><p className='text-[12px] mt-1.5' style={{color:'var(--t3)'}}>{x.d}</p></div></div>
        </div>
      ))}
    </div>
  </div>
}

function CompareView({onBack}:{onBack:()=>void}){
  const[a,setA]=useState('');const[b,setB]=useState('');const[cmp,setCmp]=useState<any>(null)
  const[tsA,setTsA]=useState<any[]>([]);const[tsB,setTsB]=useState<any[]>([])
  const[prevA,setPrevA]=useState<any>(null);const[prevB,setPrevB]=useState<any>(null)
  const[overlay,setOverlay]=useState(false);const[loading,setLoading]=useState(false)

  const run=async()=>{
    if(!a||!b||a===b){addToast('请选择两条不同的井采线','warning');return}
    setLoading(true);setOverlay(false);setPrevA(null);setPrevB(null)
    const la=WELL_LINES.find(l=>l.shortName===a)!;const lb=WELL_LINES.find(l=>l.shortName===b)!
    const[sum,ta,tb]=await Promise.all([compareLines(la.id,lb.id),getTimeSeries(la.id),getTimeSeries(lb.id)])as[any,any[],any[]]
    const sa=(sum as any)?.a||{};const sb=(sum as any)?.b||{}
    setCmp({a:{name:la.name,sn:la.shortName,...sa},b:{name:lb.name,sn:lb.shortName,...sb}})
    setTsA(ta);setTsB(tb);setLoading(false)
  }

  const loadPrev=async()=>{
    if(overlay){setOverlay(false);setPrevA(null);setPrevB(null);return}
    const la=WELL_LINES.find(l=>l.shortName===a)!;const lb=WELL_LINES.find(l=>l.shortName===b)!
    const[pa,pb]=await Promise.all([getPrevMonthData(la.id),getPrevMonthData(lb.id)])
    setPrevA(pa);setPrevB(pb);setOverlay(true)
  }

  const build=(ts:any[],key:string)=>{const m=new Map<string,number>();ts.forEach((d:any)=>{if(d[key]!=null)m.set(d.wellId,d[key])});return Array.from(m.entries()).map(([wellId,value])=>({wellId,value})).sort((a,b)=>a.wellId.localeCompare(b.wellId))}
  const buildPrev=(prev:any,key:string)=>{if(!prev?.data)return[];const m=new Map<string,number>();prev.data.forEach((d:any)=>{if(d[key]!=null)m.set(d.wellId,d[key])});return Array.from(m.entries()).map(([wellId,value])=>({wellId,value})).sort((a,b)=>a.wellId.localeCompare(b.wellId))}
  const cKA=build(tsA,'kPlus');const cKB=build(tsB,'kPlus');const cLiA=build(tsA,'liPlus');const cLiB=build(tsB,'liPlus')

  const prevLabel=(pv:any)=>pv?.prevMonth?pv.prevMonth.replace('-','年')+'月':'上次数据'

  return<div className='page-container'><Back onClick={onBack}/><h1 className='text-[20px] font-bold mb-4' style={{color:'var(--t1)'}}>井采线对比</h1>
    <div className='card p-6'><div className='flex items-center gap-3 mb-5 flex-wrap'><Select value={a} onChange={e=>setA(e.target.value)} options={LO} w={160}/><span className='text-[13px] font-medium' style={{color:'var(--t3)'}}>vs</span><Select value={b} onChange={e=>setB(e.target.value)} options={LO} w={160}/><Button variant='primary' size='sm' onClick={run} loading={loading}>开始对比</Button>{cmp&&<Button variant={overlay?'primary':'secondary'} size='sm' onClick={loadPrev}>{overlay?'隐藏上次数据':'叠加上次数据'}</Button>}</div>
      {cmp&&<>
        <div className='grid grid-cols-2 gap-4 mb-5'>{[cmp.a,cmp.b].map((d:any,i:number)=><div key={i} className='p-4 rounded-[14px]' style={{background:'var(--surface-1)'}}><div className='flex items-center gap-2 mb-3'><div className='w-2.5 h-2.5 rounded-full' style={{background:LC[d.sn]||'#4a9eff'}}/><span className='text-[14px] font-bold'>{d.name}</span></div><div className='grid grid-cols-3 gap-3 text-center'><div className='p-2.5 rounded-[10px] bg-[var(--surface-2)]'><div className='text-[10px] font-semibold mb-1' style={{color:'var(--t3)'}}>K⁺均值</div><div className='text-lg font-bold' style={{color:'#34d399'}}>{d.avgK??'?'}<span className='text-[10px] font-medium ml-0.5'>g/L</span></div></div><div className='p-2.5 rounded-[10px] bg-[var(--surface-2)]'><div className='text-[10px] font-semibold mb-1' style={{color:'var(--t3)'}}>Li⁺均值</div><div className='text-lg font-bold' style={{color:'#60a5fa'}}>{d.avgLi??'?'}<span className='text-[10px] font-medium ml-0.5'>g/L</span></div></div><div className='p-2.5 rounded-[10px] bg-[var(--surface-2)]'><div className='text-[10px] font-semibold mb-1' style={{color:'var(--t3)'}}>动水位</div><div className='text-lg font-bold' style={{color:'#fbbf24'}}>{d.avgW??'?'}<span className='text-[10px] font-medium ml-0.5'>m</span></div></div></div></div>)}</div>
        <div className='grid grid-cols-2 gap-3'>
          {[{data:cKA,name:cmp.a.sn,color:LC[cmp.a.sn]||'#4a9eff',ion:'K⁺',unit:'g/L',prev:buildPrev(prevA,'kPlus'),pl:prevLabel(prevA)},{data:cKB,name:cmp.b.sn,color:'#34d399',ion:'K⁺',unit:'g/L',prev:buildPrev(prevB,'kPlus'),pl:prevLabel(prevB)},{data:cLiA,name:cmp.a.sn,color:'#60a5fa',ion:'Li⁺',unit:'g/L',prev:buildPrev(prevA,'liPlus'),pl:prevLabel(prevA)},{data:cLiB,name:cmp.b.sn,color:'#a78bfa',ion:'Li⁺',unit:'g/L',prev:buildPrev(prevB,'liPlus'),pl:prevLabel(prevB)}].map((x,i)=><div key={i} className='p-3 rounded-[12px]' style={{background:'var(--surface-1)'}}><CompareLineChart title={x.name+' '+x.ion} data={x.data} prevData={overlay?x.prev:undefined} prevLabel={x.pl} color={x.color} unit={x.unit} height={220}/></div>)}
        </div>
      </>}{!cmp&&!loading&&<div className='py-16 text-center'><p className='text-[13px]' style={{color:'var(--t3)'}}>选择两条井采线并点击开始对比</p></div>}
    </div>
  </div>
}

function ReportView({onBack}:{onBack:()=>void}){
  const[mo,setMo]=useState('');const[mos,setMos]=useState<{value:string;label:string}[]>([]);const[loading,setLoading]=useState(false);const[report,setReport]=useState<any>(null);const[lowK,setLowK]=useState<any[]>([]);const[lowLi,setLowLi]=useState<any[]>([]);const[score,setScore]=useState<any[]>([]);const[mgLiR,setMgLiR]=useState<any[]>([]);const[kLiR,setKLiR]=useState<any[]>([])
  useEffect(()=>{getAvailableMonths().then((ms:unknown)=>{const months=ms as any[];setMos(months.map((m:any)=>({value:m.mo,label:m.mo.replace('-','年')+'月'})))})},[])
  const gen=async()=>{if(!mo){addToast('请选择月份','warning');return};setLoading(true);const[r,lk,ll,sc,mr,kr]=await Promise.all([getMonthlyReport(mo),getLowKWells(mo),getLiLowWells(mo),getLineScoring(mo),getMgLiRatio(mo),getKLiRatioRank(mo)])as[any,any[],any[],any[],any[],any[]];setReport(r);setLowK(lk);setLowLi(ll);setScore(sc);setMgLiR(mr);setKLiR(kr);setLoading(false)}
  const exp=()=>{if(!score.length)return;exportXLSX('月度报告_'+mo,['井采线','K⁺均值','Li⁺均值','Mg²⁺均值','比重均值','矿化度均值','井数'],score.map((l:any)=>[l.lineName,l.avgK,l.avgLi,l.avgMg,l.avgDensity,l.avgSalinity,l.cnt]));addToast('已导出','success')}
  const totalWells=report?.reduce((s:number,r:any)=>s+(r.cnt||0),0)||0
  const avgKAll=report?.length?report.reduce((s:number,r:any)=>s+(r.avgK||0),0)/report.length:0
  const avgLiAll=report?.length?report.reduce((s:number,r:any)=>s+(r.avgLi||0),0)/report.length:0
  return<div className='page-container'><Back onClick={onBack}/>
    <div className='flex items-center justify-between mb-4'>
      <h1 className='text-[22px] font-bold tracking-tight' style={{color:'var(--t1)'}}>月度分析报告</h1>
      <div className='flex items-center gap-3'>
        <Select value={mo} onChange={e=>setMo(e.target.value)} options={[{value:'',label:'选择月份'},...mos]} w={160}/>
        <Button variant='primary' size='sm' onClick={gen} loading={loading}>生成报告</Button>
        {report&&<Button variant='secondary' size='sm' onClick={exp}>导出 Excel</Button>}
      </div>
    </div>
    {report&&<div className='card' style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'24px 28px',borderBottom:'2px solid var(--glass-border)'}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--t3)',marginBottom:8}}>智慧盐湖数据管理平台</div>
        <h2 style={{fontSize:22,fontWeight:700,color:'var(--t1)',letterSpacing:'-0.02em',marginBottom:6}}>月度化验分析报告</h2>
        <div style={{display:'flex',gap:24,fontSize:12,color:'var(--t2)'}}>
          <span>报告期间：<b style={{color:'var(--t1)'}}>{mo.replace('-','年')+'月'}</b></span>
          <span>生成时间：<b style={{color:'var(--t1)'}}>{new Date().toLocaleDateString('zh-CN')}</b></span>
        </div>
      </div>
      <div style={{padding:'24px 28px'}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',color:'var(--t3)',marginBottom:6}}>概览指标</div>
          <div className='grid grid-cols-4 gap-3'>
            <div style={{padding:'14px 16px',borderRadius:'var(--r-md)',background:'var(--surface-1)'}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>总井数</div>
              <div style={{fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums',color:'var(--t1)',letterSpacing:'-0.02em'}}>{totalWells}</div>
            </div>
            <div style={{padding:'14px 16px',borderRadius:'var(--r-md)',background:'var(--surface-1)'}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>平均 K⁺</div>
              <div style={{fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums',color:'#4a9eff',letterSpacing:'-0.02em'}}>{avgKAll.toFixed(3)}<span style={{fontSize:11,fontWeight:500,color:'var(--t3)',marginLeft:4}}>g/L</span></div>
            </div>
            <div style={{padding:'14px 16px',borderRadius:'var(--r-md)',background:'var(--surface-1)'}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>平均 Li⁺</div>
              <div style={{fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums',color:'#34d399',letterSpacing:'-0.02em'}}>{avgLiAll.toFixed(4)}<span style={{fontSize:11,fontWeight:500,color:'var(--t3)',marginLeft:4}}>g/L</span></div>
            </div>
            <div style={{padding:'14px 16px',borderRadius:'var(--r-md)',background:'var(--surface-1)'}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>异常井数</div>
              <div style={{fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums',color:'var(--amber)',letterSpacing:'-0.02em'}}>{lowK.length+lowLi.length}<span style={{fontSize:11,fontWeight:500,color:'var(--t3)',marginLeft:4}}>口</span></div>
            </div>
          </div>
        </div>
        <hr className='divider'/>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',color:'var(--t3)',marginBottom:6}}>一、各井采线离子浓度均值</div>
          <div className='overflow-x-auto'>
            <table className='w-full text-[13px]'>
              <thead><tr style={{borderBottom:'2px solid var(--glass-border)'}}>
                <th className='text-left py-2.5 px-3 font-semibold' style={{color:'var(--t3)',fontSize:11,letterSpacing:'0.04em'}}>井采线</th>
                <th className='text-right py-2.5 px-3 font-semibold' style={{color:'var(--t3)',fontSize:11,letterSpacing:'0.04em'}}>K⁺均值 (g/L)</th>
                <th className='text-right py-2.5 px-3 font-semibold' style={{color:'var(--t3)',fontSize:11,letterSpacing:'0.04em'}}>Li⁺均值 (g/L)</th>
                <th className='text-right py-2.5 px-3 font-semibold' style={{color:'var(--t3)',fontSize:11,letterSpacing:'0.04em'}}>井数</th>
              </tr></thead>
              <tbody>{report.map((r:any,i:number)=><tr key={i} style={{borderBottom:'1px solid var(--border-light)',background:i%2===0?'transparent':'var(--surface-1)'}}>
                <td className='py-2 px-3 font-semibold' style={{color:'var(--t1)'}}>{r.name}</td>
                <td className='py-2 px-3 text-right' style={{fontFamily:'var(--font-mono)',color:'#4a9eff',fontWeight:600}}>{r.avgK!=null?r.avgK.toFixed(3):'—'}</td>
                <td className='py-2 px-3 text-right' style={{fontFamily:'var(--font-mono)',color:'#34d399',fontWeight:600}}>{r.avgLi!=null?r.avgLi.toFixed(4):'—'}</td>
                <td className='py-2 px-3 text-right' style={{color:'var(--t2)'}}>{r.cnt}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <hr className='divider'/>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',color:'var(--t3)',marginBottom:10}}>二、低值预警</div>
          <div className='grid grid-cols-2 gap-4'>
            {lowK.length>0&&<div className='p-4 rounded-[var(--r-md)]' style={{background:'var(--surface-1)',borderLeft:'3px solid var(--amber)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:6}}>K⁺ &lt;6.5 g/L <span style={{fontSize:12,fontWeight:500,color:'var(--amber)',marginLeft:6}}>{lowK.length}口</span></div>
              <div style={{fontSize:12,color:'var(--t2)',lineHeight:1.8}}>{lowK.map((w:any,i:number)=><span key={i}>{i>0&&'、'}<span style={{color:'var(--t1)',fontWeight:500}}>{w.lineName}</span> {w.wellId}</span>)}</div>
            </div>}
            {lowLi.length>0&&<div className='p-4 rounded-[var(--r-md)]' style={{background:'var(--surface-1)',borderLeft:'3px solid var(--red)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:6}}>Li⁺ &lt;0.15 g/L <span style={{fontSize:12,fontWeight:500,color:'var(--red)',marginLeft:6}}>{lowLi.length}口</span></div>
              <div style={{fontSize:12,color:'var(--t2)',lineHeight:1.8}}>{lowLi.map((w:any,i:number)=><span key={i}>{i>0&&'、'}<span style={{color:'var(--t1)',fontWeight:500}}>{w.lineName}</span> {w.wellId}</span>)}</div>
            </div>}
            {lowK.length===0&&lowLi.length===0&&<div style={{gridColumn:'span 2',padding:'16px',textAlign:'center',color:'var(--t3)',fontSize:13}}>本月无低值预警</div>}
          </div>
        </div>
        <hr className='divider'/>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',color:'var(--t3)',marginBottom:10}}>三、离子比值排名</div>
          <div className='grid grid-cols-2 gap-4'>
            {kLiR.length>0&&<div className='p-4 rounded-[var(--r-md)]' style={{background:'var(--surface-1)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:8}}>K⁺/Li⁺ 比值排名</div>
              <div className='space-y-1.5'>{kLiR.slice(0,10).map((d:any,i:number)=><div key={i} className='flex justify-between items-center text-[12px]' style={{padding:'4px 0',borderBottom:'1px solid var(--border-light)'}}>
                <span className='flex items-center gap-2'><span style={{width:20,height:20,borderRadius:'var(--r-sm)',background:i<3?'var(--accent-soft)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:i<3?'var(--accent)':'var(--t3)'}}>{i+1}</span><span style={{color:'var(--t1)'}}>{d.lineName}</span></span>
                <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:'#4a9eff'}}>{d.ratio}</span>
              </div>)}</div>
            </div>}
            {mgLiR.length>0&&<div className='p-4 rounded-[var(--r-md)]' style={{background:'var(--surface-1)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:8}}>Mg²⁺/Li⁺ 比值排名</div>
              <div className='space-y-1.5'>{mgLiR.slice(0,10).map((d:any,i:number)=><div key={i} className='flex justify-between items-center text-[12px]' style={{padding:'4px 0',borderBottom:'1px solid var(--border-light)'}}>
                <span className='flex items-center gap-2'><span style={{width:20,height:20,borderRadius:'var(--r-sm)',background:i<3?'var(--amber-soft)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:i<3?'var(--amber)':'var(--t3)'}}>{i+1}</span><span style={{color:'var(--t1)'}}>{d.lineName}</span></span>
                <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:'#fbbf24'}}>{d.ratio}</span>
              </div>)}</div>
            </div>}
          </div>
        </div>
      </div>
    </div>}{!report&&!loading&&<div className='empty-state'><div className='empty-state-icon'><span style={{fontSize:28}}>📋</span></div><div className='empty-state-title'>选择月份生成报告</div><div className='empty-state-desc'>选择一个月份后点击"生成报告"按钮</div></div>}
  </div>
}

function AlertView({type,onBack}:{type:'k'|'li';onBack:()=>void}){
  const[th,setTh]=useState('20');const[mode,setMode]=useState<'pct'|'abs'>('pct');const[results,setResults]=useState<any[]>([]);const[loading,setLoading]=useState(false)
  const isK=type==='k'
  const run=async()=>{const t=parseFloat(th);if(isNaN(t)||t<=0){addToast('请输入有效阈值','warning');return};setLoading(true);const r:any=isK?await checkKAlerts(mode==='pct'?t:0):await checkLiAlerts(mode==='pct'?t:0);const f=mode==='abs'?r.filter((d:any)=>(d.dropAbs??0)>=t):r;setResults(f);setLoading(false)}
  const exp=()=>{exportXLSX((isK?'K':'Li')+'_alerts',['井号','井采线','上次数据','最新','降幅%','降幅g/L'],results.map((d:any)=>[d.wellId,d.lineName||'',isK?d.prevK:d.prevLi,isK?d.latestK:d.latestLi,d.dropPct,d.dropAbs]));addToast('已导出','success')}

  return<div className='page-container'><Back onClick={onBack}/><h1 className='text-[20px] font-bold mb-4' style={{color:'var(--t1)'}}>{isK?'K⁺':'Li⁺'} 异常检测</h1>
    <div className='card p-6'><div className='flex items-center gap-3 mb-5 flex-wrap'>
      <div className='flex rounded-[10px] border overflow-hidden' style={{borderColor:'var(--border)'}}><button onClick={()=>setMode('pct')} className='px-3 py-[7px] text-[12px] font-semibold transition-colors' style={{background:mode==='pct'?'var(--accent)':'transparent',color:mode==='pct'?'#060608':'var(--t2)'}}>%</button><button onClick={()=>setMode('abs')} className='px-3 py-[7px] text-[12px] font-semibold transition-colors' style={{background:mode==='abs'?'var(--accent)':'transparent',color:mode==='abs'?'#060608':'var(--t2)'}}>g/L</button></div>
      <Input value={th} onChange={e=>setTh(e.target.value)} placeholder={mode==='pct'?'降幅% ?':'降幅g/L ?'} w={mode==='pct'?100:120} type='number'/>
      <span className='text-[11px]' style={{color:'var(--t3)'}}>{mode==='pct'?'输入百分比阈值，如 20 表示下降>20%':'输入绝对值阈值，如 0.5 表示下降>0.5 g/L'}</span>
      <Button variant='primary' size='sm' onClick={run} loading={loading}>检测</Button>
      {results.length>0&&<Button variant='secondary' size='sm' onClick={exp}>导出</Button>}
    </div>
    {results.length>0?<div className='overflow-x-auto'><table className='w-full text-[13px]'><thead><tr style={{borderBottom:'1px solid var(--glass-border)'}}><th className='text-left py-2 px-2 font-semibold' style={{color:'var(--t3)'}}>井号</th><th className='text-left py-2 px-2 font-semibold' style={{color:'var(--t3)'}}>井采线</th><th className='text-right py-2 px-2 font-semibold' style={{color:'var(--t3)'}}>上次数据</th><th className='text-right py-2 px-2 font-semibold' style={{color:'var(--t3)'}}>最新</th><th className='text-right py-2 px-2 font-semibold' style={{color:'var(--t3)'}}>降幅%</th><th className='text-right py-2 px-2 font-semibold' style={{color:'var(--t3)'}}>降幅g/L</th></tr></thead><tbody>{results.map((d:any,i:number)=><tr key={i} className='hover:bg-[var(--surface-1)]' style={{borderBottom:'1px solid var(--border-light)'}}><td className='py-1.5 px-2 font-semibold font-mono' style={{color:'var(--t1)'}}>{d.wellId}</td><td className='py-1.5 px-2' style={{color:'var(--t2)'}}>{d.lineName||''}</td><td className='py-1.5 px-2 text-right font-mono' style={{color:'var(--t2)'}}>{(isK?d.prevK:d.prevLi)?.toFixed(3)??'?'}</td><td className='py-1.5 px-2 text-right font-mono font-semibold' style={{color:isK?'#4a9eff':'#60a5fa'}}>{(isK?d.latestK:d.latestLi)?.toFixed(3)??'?'}</td><td className='py-1.5 px-2 text-right font-mono font-semibold' style={{color:d.dropPct!=null?'var(--t1)':'#f87171'}}>{d.dropPct!=null&&<>{d.dropPct>0?'+':''}{d.dropPct.toFixed(2)}%</>}</td><td className='py-1.5 px-2 text-right font-mono' style={{color:'#fbbf24'}}>{d.dropAbs?.toFixed(3)}</td></tr>)}</tbody></table></div>:!loading&&<div className='py-16 text-center'><p className='text-[13px]' style={{color:'var(--t3)'}}>设置阈值开始检测</p></div>}
    </div>
  </div>
}

function TrendView({onBack}:{onBack:()=>void}){
  const[line,setLine]=useState('');const[wellId,setWellId]=useState('');const[data,setData]=useState<any[]>([]);const[loading,setLoading]=useState(false);const[loaded,setLoaded]=useState(false)
  const lineData=WELL_LINES.find(l=>l.shortName===line)as any
  const idOpts=lineData?[{value:'',label:'选择井号'} as const,...lineData.numbers.map((n:number)=>{const id=lineData.prefix+String(n).padStart(3,'0');return{value:id,label:id}})]:[{value:'',label:'请先选择井采线'}]
  const run=async()=>{if(!wellId){addToast('请选择井号','warning');return};setLoading(true);const d=await getWellTrend(wellId);setData(d);setLoaded(true);setLoading(false)}
  return<div className='page-container'><Back onClick={onBack}/><h1 className='text-[20px] font-bold mb-4' style={{color:'var(--t1)'}}>单井趋势</h1>
    <div className='card p-6'><div className='flex items-end gap-3 mb-5'><Select label='井采线' value={line} onChange={e=>{setLine(e.target.value);setWellId('')}} options={[{value:'',label:'选择井采线'},...WELL_LINES.map(l=>({value:l.shortName,label:l.name}))]} w={180}/><Select label='井号' value={wellId} onChange={e=>setWellId(e.target.value)} options={idOpts} w={160}/><Button variant='primary' size='sm' onClick={run} loading={loading}>查询</Button></div>
      {loaded&&data.length>0?<WellTrendChart data={data}/>:loaded&&data.length===0?<div className='py-16 text-center'><p className='text-[13px]' style={{color:'var(--t3)'}}>该井暂无化验数据</p></div>:!loading?<div className='py-16 text-center'><p className='text-[13px]' style={{color:'var(--t3)'}}>请选择井采线和井号查看趋势</p></div>:null}
    </div>
  </div>
}

function Back({onClick}:{onClick:()=>void}){return<button onClick={onClick} className='inline-flex items-center gap-1 text-[13px] font-medium mb-5 hover:text-[var(--accent)] transition-colors' style={{color:'var(--t2)'}}>← 返回</button>}
