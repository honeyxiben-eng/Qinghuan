'use client'
import { useEffect, useRef } from 'react'
import * as E from 'echarts'

export function WellTrendChart({ data, height = 340 }: { data: { testDate: string; kPlus: number | null; liPlus: number | null }[], height?: number }) {
  const r = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!r.current || data.length === 0) return
    const chart = E.init(r.current, undefined, { renderer: 'canvas' })
    const dates = data.map(d => d.testDate)
    const textColor = 'rgba(255,255,255,0.55)'
    const gridColor = 'rgba(255,255,255,0.04)'

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,20,28,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        textStyle: { color: '#f5f5f7', fontSize: 12 },
      },
      legend: {
        data: ['K⁺', 'Li⁺'], textStyle: { color: textColor, fontSize: 11 }, top: 5,
        icon: 'roundRect',
      },
      grid: { left: 70, right: 35, top: 50, bottom: 50 },
      xAxis: {
        type: 'category', data: dates,
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, rotate: dates.length > 12 ? 45 : 0 },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: [
        {
          type: 'value', name: 'K⁺ g/L', nameTextStyle: { color: '#4a9eff', fontSize: 10 },
          axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
          splitLine: { lineStyle: { color: gridColor } },
        },
        {
          type: 'value', name: 'Li⁺ g/L', nameTextStyle: { color: '#34d399', fontSize: 10 },
          axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'K⁺', type: 'line', data: data.map(d => d.kPlus ?? null),
          smooth: true, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#4a9eff', width: 3, shadowBlur: 6, shadowColor: 'rgba(74,158,255,0.25)' },
          itemStyle: { color: '#4a9eff', borderColor: '#fff', borderWidth: 2 },
          areaStyle: { color: new E.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(74,158,255,0.15)' }, { offset: 1, color: 'rgba(74,158,255,0.01)' }]) },
        },
        {
          name: 'Li⁺', type: 'line', yAxisIndex: 1, data: data.map(d => d.liPlus ?? null),
          smooth: true, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#34d399', width: 3, shadowBlur: 6, shadowColor: 'rgba(52,211,153,0.25)' },
          itemStyle: { color: '#34d399', borderColor: '#fff', borderWidth: 2 },
          areaStyle: { color: new E.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(52,211,153,0.15)' }, { offset: 1, color: 'rgba(52,211,153,0.01)' }]) },
        },
      ]
    }, true)
    const re = () => chart.resize()
    window.addEventListener('resize', re)
    return () => { window.removeEventListener('resize', re); chart.dispose() }
  }, [data, height])
  return <div ref={r} style={{ height, width: '100%' }} />
}
