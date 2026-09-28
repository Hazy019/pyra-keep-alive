export default function TargetsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} aria-busy="true" aria-label="Loading targets">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div className="skeleton" style={{ width: 140, height: 26, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 8 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <div>
                <div className="skeleton" style={{ width: 260, height: 16, borderRadius: 4, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 4 }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: 120, height: 28, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
