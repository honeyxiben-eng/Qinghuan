'use client'
import { useInView } from "@/hooks/useInView"
import { useEffect, useRef, memo } from 'react'
import * as E from 'echarts'

export const WaterTrendChart = memo(function WaterTrendChart({ data, height = 300 }: {
  data: { collectDate: string; dynamicWater: number | null }[]
  height?: number
}) {
  const r = useRef<HTMLDivElement>(null); const [obsRef, inView] = useInView()

  useEffect(() => {
    if (!r.current || data.length === 0 || !inView) return
    const chart = E.init(r.current, undefined, { renderer: 'canvas' })
    const dates = data.map(d => d.collectDate ?? '?')
    const values = data.map(d => d.dynamicWater ?? null)
    const textColor = 'rgba(255,255,255,0.55)'
    const gridColor = 'rgba(255,255,255,0.04)'

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,20,28,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        textStyle: { color: '#f5f5f7', fontSize: 12 },
        formatter: (p: any) => {
          const d = p[0]
          return `${d.axisValue}<br/><b style="color:#fbbf24">动水位</b> ${d.value != null ? d.value.toFixed(2) + ' m' : '—'}`
        }
      },
      grid: { left: 55, right: 20, top: 30, bottom: 40 },
      xAxis: {
        type: 'category', data: dates,
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, rotate: dates.length > 8 ? 30 : 0 },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: 'value', name: 'm', nameTextStyle: { color: textColor, fontSize: 10 },
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
        inverse: true,
      },
      series: [{
        name: '动水位', type: 'line', data: values,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#fbbf24', width: 3, shadowBlur: 6, shadowColor: 'rgba(251,191,36,0.25)' },
        itemStyle: { color: '#fbbf24', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new E.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251,191,36,0.15)' },
            { offset: 1, color: 'rgba(251,191,36,0.01)' }
          ])
        },
      }]
    }, true)

    const re = () => chart.resize()
    window.addEventListener('resize', re)
    return () => { window.removeEventListener('resize', re); chart.dispose() }
  }, [data, height, inView])

  const setRefs = (el: HTMLDivElement | null) => { (r as any).current = el; (obsRef as any).current = el }
  return <div ref={setRefs} style={{ height, width: '100%' }} />
})
