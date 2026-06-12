import { WELL_LINES } from "@/lib/well-data"

export function highlightText(text: string, query: string) {
  if (!query || !text) return text || "-"
  const s = String(text)
  const i = s.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return s
  return s.slice(0, i) + "\x01" + s.slice(i, i + query.length) + "\x02" + s.slice(i + query.length)
}

export function parseHighlighted(text: string) {
  const parts: { text: string; hl: boolean }[] = []
  let rest = text
  while (rest.length > 0) {
    const start = rest.indexOf("\x01")
    if (start < 0) { parts.push({ text: rest, hl: false }); break }
    if (start > 0) parts.push({ text: rest.slice(0, start), hl: false })
    const end = rest.indexOf("\x02", start)
    if (end < 0) { parts.push({ text: rest.slice(start + 1), hl: false }); break }
    parts.push({ text: rest.slice(start + 1, end), hl: true })
    rest = rest.slice(end + 1)
  }
  return parts
}

export function getAllWellIds(): string[] {
  const ids: string[] = []
  for (const l of WELL_LINES) {
    const ln = l as any
    if (ln.numbers) for (const n of ln.numbers) ids.push(ln.prefix + String(n).padStart(3, "0"))
  }
  return ids
}

export function searchWellIds(query: string): string[] {
  const cn = WELL_LINES.filter(l => l.name.includes(query) || l.shortName.toLowerCase().includes(query.toLowerCase()))
  const r: string[] = []
  for (const l of cn) {
    const ln = l as any
    if (ln.numbers) for (const n of ln.numbers) r.push(ln.prefix + String(n).padStart(3, "0"))
  }
  return r
}

export function getMonthLabel(ym: string | null) {
  if (!ym) return ""
  const [y, m] = ym.split("-")
  return y + "年" + parseInt(m) + "月"
}

export function getAgeLabel(ym: string | null) {
  if (!ym) return ""
  const [y, m] = ym.split("-").map(Number)
  const monthsAgo = (new Date().getFullYear() - y) * 12 + (new Date().getMonth() + 1 - m)
  return monthsAgo <= 0 ? "(本月)" : monthsAgo === 1 ? "(1个月前)" : "(" + monthsAgo + "个月前)"
}
