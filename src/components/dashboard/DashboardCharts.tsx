'use client'
import{useEffect,useRef,memo}from'react'
import*as E from'echarts'

export const WellLineStackedBar=memo(function WellLineStackedBar({data,height=300}:{data:{name:string;total:number;active:number;stopped:number;abandoned:number}[],height?:number}){
  const r=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!r.current||data.length===0)return
    const gridColor='rgba(255,255,255,0.04)'
    const chart=E.init(r.current,undefined,{renderer:'canvas'})
    chart.setOption({
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'rgba(20,20,28,0.95)',borderColor:'rgba(255,255,255,0.08)',textStyle:{color:'#f5f5f7',fontSize:12},
        formatter:(p:any)=>{const d=data[p[0]?.dataIndex];return`<b>${d?.name}</b><br/>正常 ${d?.active||0} · 停止 ${d?.stopped||0} · 废弃 ${d?.abandoned||0} · 总计 ${d?.total||0}`}},
      grid:{left:100,right:50,top:8,bottom:25},
      xAxis:{type:'value',axisLabel:{color:'rgba(255,255,255,0.35)',fontSize:10},splitLine:{lineStyle:{color:gridColor}}},
      yAxis:{type:'category',data:data.map(d=>d.name),axisLabel:{color:'rgba(255,255,255,0.55)',fontSize:11},axisLine:{show:false},axisTick:{show:false}},
      series:[
        {name:'正常',type:'bar',stack:'total',data:data.map(d=>d.active||0),itemStyle:{color:'#34d399',borderRadius:[0,0,0,0]},barWidth:16,emphasis:{focus:'series'}},
        {name:'停止',type:'bar',stack:'total',data:data.map(d=>d.stopped||0),itemStyle:{color:'#fbbf24',borderRadius:[0,0,0,0]},emphasis:{focus:'series'}},
        {name:'废弃',type:'bar',stack:'total',data:data.map(d=>d.abandoned||0),itemStyle:{color:'rgba(255,255,255,0.15)',borderRadius:[0,6,6,0]},emphasis:{focus:'series'}},
      ],
      legend:{show:false}
    },true)
    const re=()=>chart.resize();window.addEventListener('resize',re)
    return()=>{window.removeEventListener('resize',re);chart.dispose()}
  },[data,height])
  return<div ref={r} style={{height,width:'100%'}}/>
})
