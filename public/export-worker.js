// Export worker — transforms raw data to clean rows without blocking main thread
self.onmessage = (e) => {
  const { headers, rawRows, mappings } = e.data
  const rows = rawRows.map((r) => mappings.map((fn) => {
    try { return fn(r) } catch { return '—' }
  }))
  self.postMessage({ headers, rows })
}
