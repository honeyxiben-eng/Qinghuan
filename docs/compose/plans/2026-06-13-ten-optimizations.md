# 10 UI/UX Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 10 user-facing optimizations across dashboard, tables, charts, forms, exports, alerts, responsive layout, audit logging, validation, and AI chat.

**Architecture:** Each optimization is self-contained and can be implemented independently. Tasks are ordered by dependency (no task depends on a later task). All changes are additive — no breaking changes to existing behavior.

**Tech Stack:** Next.js 16, React 19, Zustand, ECharts 5.5, Prisma/SQLite, Zod, Tailwind CSS v4, XLSX.

---

## Task 1: Progressive Skeleton Screen for Dashboard

**Covers:** Optimizations #1 (Dashboard skeleton screen)

**Files:**
- Modify: `src/app/page.tsx:60-76`
- Create: `src/components/ui/Skeleton.tsx`

- [ ] **Step 1: Create Skeleton component**

```tsx
// src/components/ui/Skeleton.tsx
'use client'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  className?: string
  delay?: number
}

export function Skeleton({ width, height, borderRadius = 8, className = '', delay = 0 }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        animationDelay: `${delay}ms`,
      }}
    />
  )
}

export function StatCardSkeleton({ index }: { index: number }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${index * 60}ms` }}>
      <Skeleton width={40} height={40} borderRadius={12} delay={index * 60} />
      <Skeleton width="60%" height={12} delay={index * 60 + 50} />
      <Skeleton width="40%" height={28} delay={index * 60 + 100} />
    </div>
  )
}

export function ChartSkeleton({ height = 340 }: { height?: number }) {
  return (
    <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease both 0.2s' }}>
      <Skeleton width="30%" height={16} delay={200} />
      <Skeleton width="100%" height={height - 60} delay={250} borderRadius={12} />
    </div>
  )
}

export function MarqueeSkeleton() {
  return (
    <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease both 0.3s' }}>
      <Skeleton width="40%" height={16} delay={300} />
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} width="100%" height={80} delay={350 + i * 50} borderRadius={12} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update dashboard loading state**

In `src/app/page.tsx`, replace lines 60-76 with:

```tsx
if (!st && !handleError) return (
  <div className="page-container">
    <div className="grid grid-cols-6 gap-4">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <StatCardSkeleton key={i} index={i} />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-4 mt-5">
      <ChartSkeleton height={340} />
      <ChartSkeleton height={340} />
    </div>
    <div className="mt-5">
      <MarqueeSkeleton />
    </div>
  </div>
)
```

- [ ] **Step 3: Verify skeleton renders on fresh load**

Run: `npm run dev` and visit `/`. The skeleton should show with staggered fade-in before data loads.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Skeleton.tsx src/app/page.tsx
git commit -m "feat: add progressive skeleton screen to dashboard"
```

---

## Task 2: Table Keyboard Navigation (Tab between cells)

**Covers:** Optimizations #2 (Table keyboard navigation)

**Files:**
- Modify: `src/app/wells/page.tsx:140-157` (inline edit section)
- Modify: `src/app/monitoring/page.tsx` (inline edit section)
- Modify: `src/app/lab/page.tsx` (inline edit section)

- [ ] **Step 1: Add Tab/Enter navigation to wells page edit**

In `src/app/wells/page.tsx`, update the keyboard handler at line 64 to include Tab navigation. The inline edit fields need refs. Add a `useRef` array for editable cells and wire Tab to move focus:

```tsx
// Add near line 40 (with other refs)
const editRefs = useRef<(HTMLInputElement | HTMLSelectElement)[]>([])
const editFieldCount = 8 // completionDate, technology, techNote, wellSize, initialWaterLevel, designDepth, coordX, coordY

// Replace line 64 useEffect
useEffect(() => {
  if (!edId) return
  const h = (e: KeyboardEvent) => {
    if (e.key === 'Escape') ce()
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSave() }
    if (e.key === 'Tab') {
      e.preventDefault()
      const current = editRefs.current.indexOf(e.target as any)
      if (current >= 0) {
        const next = e.shiftKey ? current - 1 : current + 1
        if (next >= 0 && next < editFieldCount) editRefs.current[next]?.focus()
      }
    }
  }
  window.addEventListener('keydown', h)
  return () => window.removeEventListener('keydown', h)
}, [edId, ce, doSave])
```

Then in the table row render, assign `ref` to each input/select:

```tsx
ref={el => { if (el) editRefs.current[0] = el }} // for completionDate input
ref={el => { if (el) editRefs.current[1] = el }} // for technology select
// ... etc for all 8 fields
```

- [ ] **Step 2: Apply same pattern to monitoring page**

In `src/app/monitoring/page.tsx`, apply the same Tab navigation pattern. Fields: collectDate, staticWater, dynamicWater, wellDepth, flowRate, pumpDepth, pumpFlow, motorPower, manufacturer, status (10 fields).

- [ ] **Step 3: Apply same pattern to lab page**

In `src/app/lab/page.tsx`, apply the same Tab navigation pattern. Fields: testDate, viscosity, density, ph, salinity, kPlus, mg2Plus, clMinus, so42Minus, ca2Plus, b2o3, liPlus, naPlus, tester (14 fields).

- [ ] **Step 4: Verify Tab navigation works**

Run: `npm run dev`, go to `/wells`, click edit on a row, press Tab to move between fields, Enter to save, Escape to cancel.

- [ ] **Step 5: Commit**

```bash
git add src/app/wells/page.tsx src/app/monitoring/page.tsx src/app/lab/page.tsx
git commit -m "feat: add Tab keyboard navigation between table edit cells"
```

---

## Task 3: ECharts Tooltip Synchronization

**Covers:** Optimizations #3 (Chart tooltip linking)

**Files:**
- Modify: `src/components/dashboard/CompareChart.tsx`
- Modify: `src/components/dashboard/TrendChart.tsx`
- Create: `src/components/ui/useEChartsGroup.ts`

- [ ] **Step 1: Create shared chart group hook**

```tsx
// src/components/ui/useEChartsGroup.ts
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
```

- [ ] **Step 2: Add groupId prop to CompareLineChart**

In `src/components/dashboard/CompareChart.tsx`, add `groupId?: string` to Props interface, and use the hook:

```tsx
interface Props {
  title: string; data: WellPoint[]; prevData?: WellPoint[]; prevLabel?: string
  color: string; unit: string; height?: number; groupId?: string
}

export function CompareLineChart({ title, data, prevData, prevLabel, color, unit, height = 280, groupId }: Props) {
  const groupRef = useEChartsGroup(groupId || null)
  const r = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!r.current || data.length === 0) return
    const chart = E.init(r.current, undefined, { renderer: 'canvas' })
    groupRef.current = chart
    // ... rest of existing config
  }, [data, prevData, color, title, unit, prevLabel, height, groupId])
```

- [ ] **Step 3: Pass groupId in analysis CompareView**

In `src/app/analysis/page.tsx`, when rendering the 4 CompareLineChart instances in CompareView, pass the same groupId to link them:

```tsx
<CompareLineChart title="K⁺" data={...} color="#4a9eff" unit="g/L" groupId="compare-k" />
// ... other charts with same groupId for K, and groupId="compare-li" for Li
```

- [ ] **Step 4: Verify tooltip sync**

Run: `npm run dev`, go to Analysis > Compare, select two lines. Hover on one chart — all 4 charts should highlight the same data point.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/useEChartsGroup.ts src/components/dashboard/CompareChart.tsx src/app/analysis/page.tsx
git commit -m "feat: synchronize tooltips across comparison charts"
```

---

## Task 4: Smart Form Auto-fill from Previous Records

**Covers:** Optimizations #4 (Form auto-fill)

**Files:**
- Modify: `src/app/monitoring/page.tsx` (form logic)
- Modify: `src/app/lab/page.tsx` (form logic)
- Modify: `src/app/actions.ts` (new server action)

- [ ] **Step 1: Add server action to fetch last record for a well**

In `src/app/actions.ts`, add:

```ts
export async function getLastRecord(wellId: string, type: 'monitoring' | 'lab') {
  const db = getDb()
  if (type === 'monitoring') {
    const rows = await db.dynamicMonitoring.findMany({
      where: { wellId },
      orderBy: { collectDate: 'desc' },
      take: 1,
    })
    return rows[0] || null
  } else {
    const rows = await db.labData.findMany({
      where: { wellId },
      orderBy: { testDate: 'desc' },
      take: 1,
    })
    return rows[0] || null
  }
}
```

- [ ] **Step 2: Add auto-fill to monitoring form**

In `src/app/monitoring/page.tsx`, after the well ID input (`mw`), add an `onBlur` handler that fetches the last record:

```tsx
// Add import at top
import { getLastRecord } from "@/app/actions"

// Add near the well ID input (mw), add onBlur:
const fillFromLast = async (wellId: string) => {
  const last = await getLastRecord(wellId, 'monitoring')
  if (!last) return
  // Only pre-fill stable fields, not dates
  setMf(last.manufacturer || '')
  setSt(last.status || 'normal')
  if (last.pumpDepth != null) setPd(String(last.pumpDepth))
  if (last.motorPower != null) setMp(String(last.motorPower))
  addToast('已自动填充上次记录的设备信息', 'info')
}

// In the well ID input element:
onBlur={(e) => { if (e.target.value) fillFromLast(e.target.value) }}
```

- [ ] **Step 3: Add auto-fill to lab form**

Same pattern in `src/app/lab/page.tsx` — pre-fill `tester` from last record.

- [ ] **Step 4: Verify auto-fill**

Run: `npm run dev`, go to Monitoring > Entry, enter a well ID that has previous records. The manufacturer, pump depth, motor power should auto-fill.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions.ts src/app/monitoring/page.tsx src/app/lab/page.tsx
git commit -m "feat: auto-fill form fields from last record for same well"
```

---

## Task 5: Enhanced Excel Export with Templates

**Covers:** Optimizations #5 (Export templates)

**Files:**
- Modify: `src/lib/export.ts`
- Modify: `src/components/ui/ExportModal.tsx`
- Modify: `src/app/wells/page.tsx` (integrate modal)

- [ ] **Step 1: Enhance exportXLSX with formatting**

```ts
// src/lib/export.ts
import * as XLSX from 'xlsx'

interface ExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | null)[][]
  colWidths?: number[]
  summaryRow?: (string | number | null)[]
}

export function exportXLSX(opts: ExportOptions) {
  const { filename, headers, rows, colWidths, summaryRow } = opts
  const wb = XLSX.utils.book_new()
  const data = [headers, ...rows]
  if (summaryRow) data.push(summaryRow)
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Auto-size columns
  if (colWidths) {
    ws['!cols'] = colWidths.map(w => ({ wch: w }))
  } else {
    ws['!cols'] = headers.map((h, i) => ({
      wch: Math.max(h.length * 2, ...rows.map(r => String(r[i] ?? '').length)) + 2
    }))
  }

  // Style header row (bold)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[cell]) {
      ws[cell].s = { font: { bold: true, sz: 12 }, fill: { fgColor: { rgb: '4A9EFF' } } }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, new Date().toISOString().slice(0, 10) + '_' + filename + '.xlsx')
}

// Legacy compat
export function exportXLSXSimple(filename: string, headers: string[], rows: (string | number | null)[][]) {
  exportXLSX({ filename, headers, rows })
}
```

- [ ] **Step 2: Update ExportModal with template selection**

```tsx
// src/components/ui/ExportModal.tsx
'use client'
import { useState } from 'react'
import Button from './Button'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  onExport: (template: string) => void
  dataCount: number
  preview: any[]
  headers: string[]
}

const TEMPLATES = [
  { key: 'raw', label: '原始数据', desc: '所有字段，适合存档' },
  { key: 'summary', label: '汇总模板', desc: '含统计行，适合汇报' },
  { key: 'compact', label: '精简模板', desc: '仅关键字段，适合快速查看' },
]

export function ExportModal({ open, onClose, onExport, dataCount, preview, headers }: ExportModalProps) {
  const [template, setTemplate] = useState('raw')
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="card p-6 w-[480px] max-h-[80vh] overflow-auto">
        <h3 className="text-[16px] font-bold mb-4" style={{ color: 'var(--t1)' }}>导出 Excel</h3>
        <div className="text-[13px] mb-4" style={{ color: 'var(--t2)' }}>
          共 {dataCount} 条记录
        </div>
        
        <div className="space-y-2 mb-4">
          {TEMPLATES.map(t => (
            <label key={t.key} className="flex items-center gap-3 p-3 rounded-[var(--r-sm)] cursor-pointer transition-colors"
              style={{ background: template === t.key ? 'var(--accent-soft)' : 'var(--surface-1)', border: '1px solid ' + (template === t.key ? 'var(--accent)' : 'var(--border-light)') }}>
              <input type="radio" name="template" value={t.key} checked={template === t.key}
                onChange={() => setTemplate(t.key)} className="accent-[var(--accent)]" />
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{t.label}</div>
                <div className="text-[11px]" style={{ color: 'var(--t3)' }}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {preview.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <div className="text-[11px] font-medium mb-2" style={{ color: 'var(--t3)' }}>预览（前5行）</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {headers.slice(0, 6).map((h, i) => (
                    <th key={i} className="py-1 px-1.5 text-left font-semibold" style={{ color: 'var(--t3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {row.slice(0, 6).map((cell, j) => (
                      <td key={j} className="py-1 px-1.5" style={{ color: 'var(--t1)' }}>{cell ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>取消</Button>
          <Button variant="primary" size="sm" onClick={() => onExport(template)}>导出</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Integrate ExportModal in wells page**

In `src/app/wells/page.tsx`, replace the direct `exportXLSX` call with modal integration:

```tsx
// Add state
const [exportOpen, setExportOpen] = useState(false)
const [exportPreview, setExportPreview] = useState<any[]>([])

// Replace doExp function
const doExp = async () => {
  try {
    const all = await getWells({ region: region || undefined, lineId: line ? WELL_LINES.find(l => l.shortName === line)?.id : undefined, search: search || undefined, pageSize: 99999 })
    const rows = (all as any).data || []
    if (!rows.length) { addToast("无数据可导出", "warning"); return }
    setExportPreview(rows.slice(0, 5))
    setExportOpen(true)
  } catch (e: any) { addToast("导出失败: " + e.message, "error") }
}

const handleExport = (template: string) => {
  // Re-fetch with full data for actual export
  getWells({ pageSize: 99999 }).then((all: any) => {
    const rows = all.data || []
    exportXLSX({
      filename: '基础信息',
      headers: ["井号", "井采线", "片区", "成井时间", "工艺", "备注", "尺寸", "初始水位", "井深", "坐标X", "坐标Y"],
      rows: rows.map((r: any) => [r.wellId, r.lineName || "--", RNAMES[r.region] || "--", fmtDate(r.completionDate), r.technology || "--", r.techNote || "--", r.wellSize || "--", fmt(r.initialWaterLevel, P.WATER), fmt(r.designDepth, P.WELL_DEPTH), fmt(r.coordX, P.COORD), fmt(r.coordY, P.COORD)]),
      summaryRow: template === 'summary' ? ['合计', rows.length + '条', '', '', '', '', '', '', '', '', ''] : undefined,
    })
    addToast("已导出 " + rows.length + " 条", "success")
    setExportOpen(false)
  })
}
```

- [ ] **Step 4: Verify export with templates**

Run: `npm run dev`, go to Wells, click Export, select a template, verify the Excel has proper formatting.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.ts src/components/ui/ExportModal.tsx src/app/wells/page.tsx
git commit -m "feat: add Excel export templates with preview modal"
```

---

## Task 6: Alert Heatmap Visualization

**Covers:** Optimizations #6 (Alert visualization enhancement)

**Files:**
- Modify: `src/app/analysis/page.tsx` (AlertView section, lines 194-211)
- Create: `src/components/dashboard/AlertHeatmap.tsx`

- [ ] **Step 1: Create AlertHeatmap component**

```tsx
// src/components/dashboard/AlertHeatmap.tsx
'use client'
import { useMemo } from 'react'

interface AlertData {
  wellId: string
  lineName: string
  dropPct: number | null
  dropAbs: number | null
  prevValue: number | null
  latestValue: number | null
}

interface Props {
  data: AlertData[]
  type: 'k' | 'li'
}

const SEVERITY = [
  { max: 100, color: '#dc2626', label: '严重', bg: 'rgba(220,38,38,0.15)' },
  { max: 50, color: '#f97316', label: '中度', bg: 'rgba(249,115,22,0.15)' },
  { max: 20, color: '#eab308', label: '轻度', bg: 'rgba(234,179,8,0.15)' },
  { max: 0, color: '#22c55e', label: '正常', bg: 'rgba(34,197,94,0.15)' },
]

function getSeverity(pct: number | null) {
  if (pct == null) return SEVERITY[3]
  for (const s of SEVERITY) if (pct >= s.max) return s
  return SEVERITY[3]
}

export function AlertHeatmap({ data, type }: Props) {
  const byLine = useMemo(() => {
    const groups: Record<string, AlertData[]> = {}
    for (const d of data) {
      const line = d.lineName || '未知'
      if (!groups[line]) groups[line] = []
      groups[line].push(d)
    }
    return groups
  }, [data])

  const lines = Object.keys(byLine).sort()

  if (data.length === 0) return null

  return (
    <div className="mt-4">
      <h4 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>
        {type === 'k' ? 'K⁺' : 'Li⁺'} 异常分布 · 按井采线
      </h4>
      <div className="space-y-2">
        {lines.map(line => (
          <div key={line} className="flex items-center gap-2">
            <span className="text-[11px] w-16 text-right shrink-0" style={{ color: 'var(--t3)' }}>{line}</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {byLine[line].map(d => {
                const sev = getSeverity(d.dropPct)
                return (
                  <div key={d.wellId} title={`${d.wellId}: ${d.dropPct?.toFixed(1) ?? '?'}%`}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono cursor-default transition-transform hover:scale-110"
                    style={{ background: sev.bg, color: sev.color, border: '1px solid ' + sev.color + '30' }}>
                    {d.wellId.slice(-2)}
                  </div>
                )
              })}
            </div>
            <span className="text-[10px] shrink-0" style={{ color: 'var(--t4)' }}>{byLine[line].length}口</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
        {SEVERITY.slice(0, 3).map(s => (
          <div key={s.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label} &gt;{s.max}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrate heatmap in AlertView**

In `src/app/analysis/page.tsx`, inside the AlertView component, after the results table (line 208), add the heatmap:

```tsx
// Add import at top
import { AlertHeatmap } from '@/components/dashboard/AlertHeatmap'

// After the table closing tag, before the closing div:
{results.length > 0 && (
  <AlertHeatmap
    data={results.map((d: any) => ({
      wellId: d.wellId,
      lineName: d.lineName,
      dropPct: d.dropPct,
      dropAbs: d.dropAbs,
      prevValue: isK ? d.prevK : d.prevLi,
      latestValue: isK ? d.latestK : d.latestLi,
    }))}
    type={type}
  />
)}
```

- [ ] **Step 3: Add severity color coding to table rows**

In the AlertView table, update each `<tr>` to include severity-based left border:

```tsx
// Replace the <tr> in results.map
<tr key={i} className='hover:bg-[var(--surface-1)]' style={{
  borderBottom: '1px solid var(--border-light)',
  borderLeft: `3px solid ${getSeverity(d.dropPct).color}`,
}}>
```

- [ ] **Step 4: Verify heatmap renders**

Run: `npm run dev`, go to Analysis > K⁺ Alert, run detection with threshold 20%. The heatmap should show wells grouped by line with severity colors.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/AlertHeatmap.tsx src/app/analysis/page.tsx
git commit -m "feat: add alert heatmap visualization with severity coloring"
```

---

## Task 7: Mobile Responsive Layout

**Covers:** Optimizations #7 (Mobile responsive)

**Files:**
- Modify: `src/app/globals.css` (add media queries)
- Modify: `src/components/layout/Sidebar.tsx` (auto-hide on mobile)
- Modify: `src/components/layout/MainContent.tsx` (responsive margin)
- Modify: `src/components/layout/TopHeader.tsx` (responsive padding)
- Modify: `src/app/page.tsx` (responsive grid)

- [ ] **Step 1: Add responsive CSS media queries**

At the end of `src/app/globals.css`, add:

```css
/* ── Mobile Responsive ── */
@media (max-width: 768px) {
  :root {
    --sidebar-w: 0px;
    --sidebar-collapsed-w: 0px;
    --sp-page-x: 16px;
    --sp-page-y: 16px;
    --content-max-w: 100%;
  }

  .sidebar-overlay {
    display: block;
  }

  .stat-card .stat-value {
    font-size: 22px;
  }

  .page-container {
    padding: 16px !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .stat-card .stat-value {
    font-size: 24px;
  }
}
```

- [ ] **Step 2: Update Sidebar for mobile**

In `src/components/layout/Sidebar.tsx`, add mobile detection and overlay:

```tsx
// Add at top of component
const [isMobile, setIsMobile] = useState(false)
const [mobileOpen, setMobileOpen] = useState(false)

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 769)
  check()
  window.addEventListener('resize', check)
  return () => window.removeEventListener('resize', check)
}, [])

// If mobile and sidebar collapsed, hide completely
if (isMobile && !mobileOpen) return null

// Add overlay for mobile
if (isMobile && mobileOpen) {
  return (
    <>
      <div className="sidebar-overlay fixed inset-0 z-30" onClick={() => setMobileOpen(false)}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <aside className="fixed left-0 z-40 flex flex-col" style={{
        top: 'var(--topbar-h)', bottom: 0, width: 'var(--sidebar-w)',
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(32px)',
        borderRight: '1px solid var(--glass-border)',
      }}>
        {/* ... existing nav content ... */}
      </aside>
    </>
  )
}
```

- [ ] **Step 3: Add mobile menu button to TopHeader**

In `src/components/layout/TopHeader.tsx`, add a hamburger button visible only on mobile:

```tsx
// Add hamburger button before the user menu
<button className="md:hidden p-2 rounded-[var(--r-sm)] hover:bg-[var(--surface-1)]" onClick={() => toggleSidebar()}>
  <Menu size={18} style={{ color: 'var(--t2)' }} />
</button>
```

- [ ] **Step 4: Make dashboard grid responsive**

In `src/app/page.tsx`, change the grid classes:

```tsx
// Line 62: Change from grid-cols-6 to responsive
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
```

- [ ] **Step 5: Verify on mobile viewport**

Run: `npm run dev`, open browser DevTools, toggle device toolbar to iPhone size. Sidebar should hide, grid should be 2 columns, padding should shrink.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/layout/Sidebar.tsx src/components/layout/TopHeader.tsx src/app/page.tsx
git commit -m "feat: add mobile responsive layout with auto-hide sidebar"
```

---

## Task 8: Audit Log System

**Covers:** Optimizations #8 (Audit logging)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/server/services/audit.ts`
- Modify: `src/server/services/well-service.ts`
- Modify: `src/server/services/monitoring-service.ts`
- Modify: `src/server/services/lab-service.ts`

- [ ] **Step 1: Add AuditLog model to Prisma schema**

In `prisma/schema.prisma`, add at the end:

```prisma
model AuditLog {
  id         Int      @id @default(autoincrement())
  userId     String?
  action     String   // create, update, delete, login, logout
  entityType String   // well, monitoring, lab, auth
  entityId   String?
  oldValues  String?  // JSON string
  newValues  String?  // JSON string
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

- [ ] **Step 2: Create audit service**

```ts
// src/server/services/audit.ts
import { getDb } from '@/server/db'

interface AuditEntry {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
}

export async function auditLog(entry: AuditEntry) {
  try {
    const db = getDb()
    await db.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        ipAddress: entry.ipAddress || null,
      },
    })
  } catch {
    // Silent fail — audit should never break the main flow
  }
}

export async function getAuditLogs(opts: {
  entityType?: string
  entityId?: string
  userId?: string
  page?: number
  pageSize?: number
}) {
  const db = getDb()
  const where: any = {}
  if (opts.entityType) where.entityType = opts.entityType
  if (opts.entityId) where.entityId = opts.entityId
  if (opts.userId) where.userId = opts.userId

  const page = opts.page || 1
  const pageSize = opts.pageSize || 20
  const [data, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
```

- [ ] **Step 3: Add audit calls to well-service**

In `src/server/services/well-service.ts`, add `auditLog` calls in create/update/delete functions:

```ts
import { auditLog } from './audit'

// In createWell function, after successful create:
await auditLog({ action: 'create', entityType: 'well', entityId: wellId, newValues: data })

// In updateWell function, after successful update:
await auditLog({ action: 'update', entityType: 'well', entityId: wellId, oldValues: existing, newValues: data })

// In deleteWells function, after successful delete:
for (const id of wellIds) {
  await auditLog({ action: 'delete', entityType: 'well', entityId: id })
}
```

- [ ] **Step 4: Add audit calls to monitoring-service**

Same pattern in `src/server/services/monitoring-service.ts` for create/update/delete.

- [ ] **Step 5: Add audit calls to lab-service**

Same pattern in `src/server/services/lab-service.ts` for create/update/delete.

- [ ] **Step 6: Run Prisma migration**

```bash
npx prisma db push
```

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma src/server/services/audit.ts src/server/services/well-service.ts src/server/services/monitoring-service.ts src/server/services/lab-service.ts
git commit -m "feat: add audit logging system for all write operations"
```

---

## Task 9: Real-time Form Validation

**Covers:** Optimizations #9 (Input validation feedback)

**Files:**
- Create: `src/hooks/useFieldValidation.ts`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/app/monitoring/page.tsx` (form)
- Modify: `src/app/lab/page.tsx` (form)

- [ ] **Step 1: Create useFieldValidation hook**

```ts
// src/hooks/useFieldValidation.ts
import { useState, useCallback } from 'react'
import { ZodSchema } from 'zod'

export function useFieldValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback((data: Partial<T>) => {
    const result = schema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [schema])

  const validateField = useCallback((fieldName: string, value: any) => {
    const result = schema.safeParse({ [fieldName]: value })
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.join('.') === fieldName)
      if (issue) {
        setErrors(prev => ({ ...prev, [fieldName]: issue.message }))
        return false
      }
    }
    setErrors(prev => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
    return true
  }, [schema])

  const clearErrors = useCallback(() => setErrors({}), [])

  return { errors, validate, validateField, clearErrors }
}
```

- [ ] **Step 2: Update Input component to support real-time validation**

In `src/components/ui/Input.tsx`, add `onValidate` prop:

```tsx
// Add to interface P:
interface P extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  w?: number | string
  onValidate?: (value: string) => void
}

// In the component, update onBlur:
onBlur={e => {
  setFoc(false)
  onBlur?.(e)
  onValidate?.(e.target.value)
}}
```

- [ ] **Step 3: Add real-time validation to monitoring form**

In `src/app/monitoring/page.tsx`, use the hook with monitoringCreateSchema:

```tsx
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { monitoringCreateSchema } from '@/shared/validation'

// Add inside component:
const { errors: fieldErrors, validateField } = useFieldValidation(monitoringCreateSchema.partial())

// On each water-level input, add onValidate:
<Input
  value={sw}
  onChange={e => setSw(e.target.value)}
  onBlur={() => validateField('staticWater', sw ? parseFloat(sw) : undefined)}
  error={fieldErrors.staticWater}
  label="静水位 (m)"
/>
```

- [ ] **Step 4: Add real-time validation to lab form**

Same pattern in `src/app/lab/page.tsx` for density (4dp), ions (3dp), Li+ (4dp).

- [ ] **Step 5: Verify validation feedback**

Run: `npm run dev`, go to Monitoring > Entry, enter an invalid value (e.g., positive water level), blur the field. The error message should appear immediately.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useFieldValidation.ts src/components/ui/Input.tsx src/app/monitoring/page.tsx src/app/lab/page.tsx
git commit -m "feat: add real-time field validation with inline error display"
```

---

## Task 10: AI Chat Session Persistence

**Covers:** Optimizations #10 (Chat state persistence)

**Files:**
- Modify: `src/components/ai/ChatPanel.tsx`
- Modify: `src/app/chat/page.tsx`

- [ ] **Step 1: Add localStorage persistence to ChatPanel**

In `src/components/ai/ChatPanel.tsx`, update the component to load/save messages:

```tsx
// Add at top
const STORAGE_KEY = 'treenb-chat-history'

// Replace useState for messages
const [messages, setMessages] = useState<Message[]>(() => {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
})

// Add useEffect to persist
useEffect(() => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {}
}, [messages])
```

- [ ] **Step 2: Add page context injection**

In the `send` function, automatically include the current page context:

```tsx
// Add import
import { usePathname } from 'next/navigation'

// Add inside component
const pathname = usePathname()

// In send function, before fetching, add context to history
const pageInfo = getPageContext(pathname)
const history = [
  { role: 'system', content: pageInfo },
  ...messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
]
```

Add helper function:

```tsx
function getPageContext(pathname: string): string {
  const pages: Record<string, string> = {
    '/': '用户正在查看中控台仪表盘，显示采卤井总览、井采线分布、K⁺/Li⁺均值对比等数据。',
    '/wells': '用户正在查看基础信息页面，管理采卤井档案数据。',
    '/monitoring': '用户正在查看监测数据页面，管理动态监测记录。',
    '/lab': '用户正在查看化验数据页面，管理卤水化验记录。',
    '/analysis': '用户正在查看数据分析页面，进行井采线对比、月度报告、异常检测。',
    '/chat': '用户正在使用智能问答助手。',
  }
  return pages[pathname] || '用户正在使用盐湖智管平台。'
}
```

- [ ] **Step 3: Add clear history button**

Add a "清空对话" button in the chat header:

```tsx
// In the header section, add:
{messages.length > 0 && (
  <button onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY) }}
    className="text-[11px] px-2 py-1 rounded-[var(--r-sm)] hover:bg-[var(--surface-1)] transition-colors"
    style={{ color: 'var(--t3)' }}>
    清空对话
  </button>
)}
```

- [ ] **Step 4: Verify persistence**

Run: `npm run dev`, go to Chat, send a message. Refresh the page — messages should persist. Click "清空对话" — messages should clear and localStorage should be empty.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ChatPanel.tsx src/app/chat/page.tsx
git commit -m "feat: add chat session persistence with page context injection"
```

---

## Execution Summary

| Task | Optimization | Est. Time | Dependencies |
|------|-------------|-----------|--------------|
| 1 | Progressive Skeleton Screen | 15 min | None |
| 2 | Table Keyboard Navigation | 20 min | None |
| 3 | ECharts Tooltip Sync | 20 min | None |
| 4 | Form Auto-fill | 15 min | None |
| 5 | Export Templates | 20 min | None |
| 6 | Alert Heatmap | 25 min | None |
| 7 | Mobile Responsive | 30 min | None |
| 8 | Audit Logging | 25 min | None |
| 9 | Real-time Validation | 20 min | None |
| 10 | Chat Persistence | 10 min | None |

**Total estimated time: ~3.5 hours**

All tasks are independent and can be executed in parallel or any order.
