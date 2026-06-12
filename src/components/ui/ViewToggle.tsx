"use client"
import { LayoutGrid, List } from "lucide-react"

interface Props {
  view: "table" | "card"
  onChange: (v: "table" | "card") => void
}

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-item ${view === "table" ? "active" : ""}`}
        onClick={() => onChange("table")}
        title="表格视图"
      >
        <List size={14} />
        表格
      </button>
      <button
        className={`tab-item ${view === "card" ? "active" : ""}`}
        onClick={() => onChange("card")}
        title="卡片视图"
      >
        <LayoutGrid size={14} />
        卡片
      </button>
    </div>
  )
}
