export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} aria-busy="true" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="skeleton" style={{ width: 220, height: 28, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 340, height: 16, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: 130, height: 38, borderRadius: 8 }} />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid-4" style={{ gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: '20px 22px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="skeleton" style={{ width: 90, height: 14, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 6, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 140, height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Telemetry Chart Skeleton */}
      <div
        className="card"
        style={{
          padding: 24,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="skeleton" style={{ width: 160, height: 20, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 100, height: 20, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 8 }} />
      </div>

      {/* Targets Table Skeleton */}
      <div
        className="card"
        style={{
          padding: 24,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: 220, height: 16, borderRadius: 4 }} />
              </div>
              <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
