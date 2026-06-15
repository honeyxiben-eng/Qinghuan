'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Database, ChevronDown, ChevronUp } from 'lucide-react'
import { exportXLSX } from '@/lib/export'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'treenb-chat-history'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sql?: string | null
  data?: any[] | null
  description?: string | null
  total?: number
  error?: boolean
}

const EXAMPLES = [
  "本月有哪些井的K⁺浓度低于6.5？",
  "各井采线的平均K⁺和Li⁺浓度是多少？",
  "最近3个月化验记录最多的井采线是哪条？",
  "停止运行的监测记录有多少条？",
  "北部片区有多少口井？",
]

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

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedSql, setExpandedSql] = useState<Record<number, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {}
  }, [messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const pageInfo = getPageContext(pathname)
      const history = [
        { role: 'system', content: pageInfo },
        ...messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content,
        }))
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error,
          error: true,
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          sql: data.sql,
          data: data.data,
          description: data.description,
          total: data.total,
        }])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '请求失败：' + e.message,
        error: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const exportData = (data: any[], desc: string) => {
    if (!data || data.length === 0) return
    const headers = Object.keys(data[0])
    const rows = data.map(r => r ? headers.map(h => r[h]) : [])
    exportXLSX({ filename: '智能查询_' + desc, headers, rows })
  }

  const toggleSql = (idx: number) => {
    setExpandedSql(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
      {/* Header */}
      <div className="panel-head" style={{ justifyContent: 'space-between', flexShrink: 0 }}>
        <div className="flex items-center gap-2.5">
          <span className="panel-tick" />
          <span className="panel-title">智能问答助手</span>
          <span className="text-[11px]" style={{ color: 'var(--t3)' }}>由通义千问驱动</span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY) }}
            className="text-[11px] px-2 py-1 rounded-[var(--r-sm)] hover:bg-[var(--surface-1)] transition-colors"
            style={{ color: 'var(--t3)' }}>
            清空对话
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">
              <span style={{ fontSize: 28 }}>💬</span>
            </div>
            <div className="empty-state-title">您好，我是盐湖数据助手</div>
            <div className="empty-state-desc">用自然语言提问，我会帮您查询和分析数据</div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => send(ex)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                  style={{ color: 'var(--t2)', border: '1px solid var(--glass-border)', background: 'var(--surface-1)' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user' ? (
              <div className="px-4 py-2.5 rounded-[16px] rounded-br-sm text-[13px] max-w-[70%]"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[85%]">
                <div className="px-4 py-3 rounded-[16px] rounded-bl-sm text-[13px] leading-relaxed"
                  style={{ background: msg.error ? 'var(--red-soft)' : 'var(--surface-2)', color: msg.error ? 'var(--red)' : 'var(--t1)', border: '1px solid ' + (msg.error ? 'var(--red-soft)' : 'var(--glass-border)') }}>
                  {msg.content}
                </div>

                {msg.sql && (
                  <div className="mt-2">
                    <button onClick={() => toggleSql(i)} className="flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: 'var(--t3)' }}>
                      <Database size={12} /> 查看SQL
                      {expandedSql[i] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {expandedSql[i] && (
                      <pre className="mt-2 p-3 rounded-[var(--r-sm)] text-[11px] overflow-x-auto"
                        style={{ background: 'var(--surface-1)', color: 'var(--t2)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-light)' }}>
                        {msg.sql}
                      </pre>
                    )}
                  </div>
                )}

                {msg.data && msg.data.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
                        共 {msg.total || msg.data.length} 条结果
                      </span>
                      <button onClick={() => exportData(msg.data!, msg.description || 'query')}
                        className="text-[11px] font-medium px-2 py-1 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--accent-soft)]"
                        style={{ color: 'var(--accent)' }}>
                        导出Excel
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-[var(--r-sm)]" style={{ border: '1px solid var(--glass-border)' }}>
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            {Object.keys(msg.data[0]).map((key, j) => (
                              <th key={j} className="py-1.5 px-2 text-left font-semibold"
                                style={{ color: 'var(--t3)', background: 'var(--surface-2)' }}>
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.slice(0, 10).map((row: any, j: number) => (
                            <tr key={j} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              {row && Object.values(row).map((val: any, k: number) => (
                                <td key={k} className="py-1.5 px-2" style={{ color: 'var(--t1)' }}>
                                  {val != null ? String(val) : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {msg.data.length > 10 && (
                      <p className="text-[10px] mt-1" style={{ color: 'var(--t4)' }}>
                        仅显示前10条，共{msg.total || msg.data.length}条
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--t3)' }}>
            <Loader2 size={14} className="animate-spin" />
            正在分析您的问题...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-4 border-t" style={{ borderColor: 'var(--border-light)', flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="输入您的问题，例如：本月哪些井的K+浓度低于6.5？"
          className="flex-1 h-10 px-4 rounded-[var(--r-full)] text-[13px] outline-none transition-all"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--glass-border)', color: 'var(--t1)' }}
          disabled={loading} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface-2)', color: input.trim() && !loading ? '#fff' : 'var(--t3)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
