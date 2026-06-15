'use client'
import { useEffect, useRef } from 'react'
import * as E from 'echarts'

const groups = new Map<string, E.ECharts[]>()

export function useEChartsGroup(groupId: string | null) {
  const chartRef = useRef<E.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current || !groupId) return
    const chart = chartRef.current
    if (!groups.has(groupId)) groups.set(groupId, [])
    const arr = groups.get(groupId)!
    arr.push(chart)

    // Connect all charts in the group
    for (const c of arr) {
      if (c !== chart) {
        try { E.connect([chart, c]) } catch {}
      }
    }

    return () => {
      const idx = arr.indexOf(chart)
      if (idx >= 0) arr.splice(idx, 1)
    }
  }, [groupId])

  return chartRef
}
