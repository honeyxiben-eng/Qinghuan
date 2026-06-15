'use client'
import { useEffect, useRef, memo } from 'react'
import * as E from 'echarts'
import { useEChartsGroup } from '@/components/ui/useEChartsGroup'
import { useInView } from '@/hooks/useInView'

interface WellPoint { wellId: string; value: number | null }
interface Props {
  title: string; data: WellPoint[]; prevData?: WellPoint[]; prevLabel?: string
  color: string; unit: string; height?: number; groupId?: string
}

export const CompareLineChart = memo(function CompareLineChart({ title, data, prevData, prevLabel, color, unit, height = 280, groupId }: Props) {
  const r = useRef<HTMLDivElement>(null)
  const [obsRef, inView] = useInView()
  const groupRef = useEChartsGroup(groupId || null)
  const setRefs = (el: HTMLDivElement | null) => { (r as any).current = el; (obsRef as any).current = el }
  useEffect(() => {
    if (!r.current || data.length === 0 || !inView) return
    const chart = E.init(r.current, undefined, { renderer: 'canvas' })
    groupRef.current = chart
    const ids = data.map(d => d.wellId?.slice(-2) ?? '??')
    const textColor = 'rgba(255,255,255,0.55)'
    const gridColor = 'rgba(255,255,255,0.04)'

    const series: any[] = [{
      name: title, type: 'line', data: data.map(d => d.value ?? null),
      smooth: true, symbol: 'circle', symbolSize: 6,
      lineStyle: { color, width: 3, shadowBlur: 8, shadowColor: color + '40' },
      itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
      areaStyle: { color: new E.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: color + '28' }, { offset: 1, color: color + '02' }
      ]) },
      emphasis: { focus: 'series' }
    }]
    if (prevData && prevData.length > 0) {
      const prevColor = color === '#4a9eff' ? '#fbbf24' : '#fb7185'
      series.push({
        name: prevLabel || '上次', type: 'line',
        data: prevData.map(d => d.value ?? null),
        smooth: true, symbol: 'diamond', symbolSize: 5,
        lineStyle: { color: prevColor, width: 2, type: 'dashed' },
        itemStyle: { color: prevColor, borderColor: '#fff', borderWidth: 1.5 },
        emphasis: { focus: 'series' }
      })
    }
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(20,20,28,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        textStyle: { color: '#f5f5f7', fontSize: 12 },
      },
      legend: {
        data: series.map(s => s.name), textStyle: { color: textColor, fontSize: 11 }, top: 0,
        icon: 'roundRect',
      },
      grid: { left: 55, right: 25, top: 40, bottom: 40 },
      xAxis: {
        type: 'category', data: ids,
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 9, rotate: ids.length > 15 ? 45 : 0 },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: 'value', name: unit, nameTextStyle: { color: textColor, fontSize: 10 },
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      series
    }, true)
    const re = () => chart.resize()
    window.addEventListener('resize', re)
    return () => { window.removeEventListener('resize', re); chart.dispose() }
  }, [data, prevData, color, title, unit, prevLabel, height, groupId, inView])
  return <div ref={setRefs} style={{ height, width: '100%', minHeight: height }} />
})
