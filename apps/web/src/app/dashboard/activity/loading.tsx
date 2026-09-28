export default function ActivityLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div
            style={{
              width: 180,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)',
              marginBottom: 8,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: 320,
              height: 16,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <div
          style={{
            width: 140,
            height: 32,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Chain banner skeleton */}
      <div
        style={{
          width: '100%',
          height: 64,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Table skeleton */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
