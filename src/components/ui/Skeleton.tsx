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
