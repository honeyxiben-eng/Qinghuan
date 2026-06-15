export default function RootLoading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-void)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, margin: '0 auto 16px',
          border: '3px solid var(--glass-border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--t3)', fontSize: 13 }}>加载中…</p>
      </div>
    </div>
  )
}
