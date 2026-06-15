export default function NotFound() {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ fontSize: '80px', fontWeight: 800, color: 'var(--t4)', lineHeight: 1, marginBottom: 16, letterSpacing: '-0.03em' }}>
        404
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
        页面未找到
      </h1>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 28, maxWidth: 360 }}>
        您访问的页面不存在或已被移除
      </p>
      <a href="/" className="btn btn-v-primary">
        返回中控台
      </a>
    </div>
  )
}
