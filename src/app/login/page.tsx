'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Lock, UserCheck, Shield, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const r = useRouter(); const login = useAppStore(s => s.login)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUser] = useState(''); const [password, setPass] = useState('')
  const [displayName, setName] = useState(''); const [role, setRole] = useState('brine')
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = mode === 'login' ? { username, password } : { username, password, displayName, role }
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await res.json()
      if (!d.ok) { setError(d.error); setLoading(false); return }
      if (mode === 'register') { setMode('login'); setError('注册成功，请登录'); setLoading(false); return }
      login(d.user.role, d.user.displayName); r.push('/')
    } catch { setError('网络错误'); setLoading(false) }
  }

  const il = 'w-full h-[48px] px-4 rounded-[var(--r-md)] text-[14px] outline-none transition-all border placeholder:text-[var(--t4)]'

  return (
    <div className="h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #4a9eff 0%, transparent 70%)', animation: 'ambientShift 60s ease-in-out infinite' }} />
        <div className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)', animation: 'ambientShift 80s ease-in-out infinite -20s' }} />
        <div className="absolute top-1/3 -right-20 w-[300px] h-[300px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', animation: 'ambientShift 70s ease-in-out infinite -40s' }} />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10" style={{ animation: 'scaleIn 0.5s var(--ease-spring) both' }}>
          <div className="w-16 h-16 rounded-[var(--r-lg)] mx-auto mb-5 flex items-center justify-center"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 8px 32px rgba(74,158,255,0.3)',
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M12 7v10M7 12h10" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--t1)' }}>清欢</h1>
          <p className="text-[14px] mt-2" style={{ color: 'var(--t2)' }}>智慧盐湖数据管理平台</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>
            {mode === 'login' ? '资源保障部 · 登录账户以继续使用' : '创建新账户'}
          </p>
        </div>

        <div className="card p-8" style={{ animation: 'scaleIn 0.5s var(--ease-spring) both 0.1s', boxShadow: 'var(--s-3)' }}>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>
                <UserCheck size={13} className="inline mr-1.5" />用户名
              </label>
              <input className={il}
                style={{ borderColor: error && error !== '注册成功，请登录' ? 'var(--red)' : 'var(--glass-border)', background: 'var(--surface-1)' }}
                value={username} onChange={e => setUser(e.target.value)} placeholder="请输入用户名" autoComplete="username" />
            </div>

            {mode === 'register' && (
              <div style={{ animation: 'fadeUp 0.3s var(--ease-spring) both' }}>
                <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>
                  <UserCheck size={13} className="inline mr-1.5" />显示名称
                </label>
                <input className={il} style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)' }}
                  value={displayName} onChange={e => setName(e.target.value)} placeholder="真实姓名" />
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>
                <Lock size={13} className="inline mr-1.5" />密码
              </label>
              <input className={il} type="password"
                style={{ borderColor: error && error !== '注册成功，请登录' ? 'var(--red)' : 'var(--glass-border)', background: 'var(--surface-1)' }}
                value={password} onChange={e => setPass(e.target.value)} placeholder="请输入密码"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>

            {mode === 'register' && (
              <div style={{ animation: 'fadeUp 0.3s var(--ease-spring) both' }}>
                <label className="text-[12px] font-medium block mb-2" style={{ color: 'var(--t3)' }}>
                  <Shield size={13} className="inline mr-1.5" />角色
                </label>
                <select className={il + ' appearance-none cursor-pointer'}
                  style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'7\' viewBox=\'0 0 12 7\' fill=\'none\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%2394a3b8\' stroke-width=\'1.8\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                  value={role} onChange={e => setRole(e.target.value)}>
                  <option value="brine">采卤端</option>
                  <option value="lab">化验端</option>
                  <option value="admin">综合管理端</option>
                </select>
              </div>
            )}

            {error && (
              <p className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: error.includes('成功') ? 'var(--green)' : 'var(--red)' }}>
                {error.includes('成功') ? '✓' : '!'} {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-[48px] rounded-[var(--r-md)] text-[15px] font-bold text-white transition-all relative overflow-hidden"
              style={{
                background: loading ? 'var(--t4)' : 'var(--accent)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(74,158,255,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />验证中...</span>
                : mode === 'login' ? '登 录' : '注 册'}
            </button>

            <p className="text-center text-[13px] pt-2" style={{ color: 'var(--t3)' }}>
              {mode === 'login' ? (
                <>没有账号？<button type="button" onClick={() => { setMode('register'); setError('') }}
                  className="font-semibold hover:underline ml-1" style={{ color: 'var(--accent)' }}>立即注册</button></>
              ) : (
                <>已有账号？<button type="button" onClick={() => { setMode('login'); setError('') }}
                  className="font-semibold hover:underline ml-1" style={{ color: 'var(--accent)' }}>去登录</button></>
              )}
            </p>
          </form>
        </div>

        <p className="text-center text-[11px] mt-8" style={{ color: 'var(--t4)' }}>
          清欢 · 资源保障部 · 内部业务系统
        </p>
      </div>
    </div>
  )
}
