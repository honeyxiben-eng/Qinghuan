"use client"
import { useEffect } from "react"
import { ChatPanel } from "@/components/ai/ChatPanel"

export default function ChatPage() {
  useEffect(() => { document.title = "清欢 · 智能问答" }, [])

  return (
    <div className="page-container">
      <ChatPanel />
    </div>
  )
}
