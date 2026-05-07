import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({ options, value, onChange, placeholder, groups }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getLabel = () => {
    if (!value) return placeholder
    return value
  }

  const filteredGroups = groups
    ? Object.entries(groups).reduce((acc, [faculty, depts]) => {
        const filtered = depts.filter(d => d.toLowerCase().includes(search.toLowerCase()))
        if (filtered.length > 0) acc[faculty] = filtered
        return acc
      }, {})
    : null

  const filteredOptions = !groups
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: value ? 'var(--text)' : 'var(--text-dim)',
          fontSize: 15,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: open ? '0 0 0 3px rgba(0,126,167,0.1)' : 'var(--shadow)',
          transition: 'all 0.2s',
          userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getLabel()}
        </span>
        <span style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
          color: 'var(--text-muted)',
          fontSize: 12,
          flexShrink: 0,
          marginLeft: 8
        }}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: 320,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              autoFocus
              className="input"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ padding: '8px 12px', fontSize: 14, boxShadow: 'none' }}
            />
          </div>

          {/* Options */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Grouped options */}
            {filteredGroups && Object.entries(filteredGroups).map(([faculty, depts]) => (
              <div key={faculty}>
                <div style={{
                  padding: '8px 14px 4px',
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {faculty}
                </div>
                {depts.map(dept => (
                  <div key={dept}
                    onClick={() => { onChange(dept); setOpen(false); setSearch('') }}
                    style={{
                      padding: '10px 16px',
                      fontSize: 14,
                      cursor: 'pointer',
                      color: value === dept ? 'var(--accent)' : 'var(--text)',
                      background: value === dept ? 'rgba(0,126,167,0.06)' : 'transparent',
                      fontWeight: value === dept ? 600 : 400,
                      transition: 'background 0.15s',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => { if (value !== dept) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { if (value !== dept) e.currentTarget.style.background = 'transparent' }}
                  >
                    {dept}
                  </div>
                ))}
              </div>
            ))}

            {/* Flat options */}
            {filteredOptions && filteredOptions.map(opt => (
              <div key={opt}
                onClick={() => { onChange(opt); setOpen(false); setSearch('') }}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  cursor: 'pointer',
                  color: value === opt ? 'var(--accent)' : 'var(--text)',
                  background: value === opt ? 'rgba(0,126,167,0.06)' : 'transparent',
                  fontWeight: value === opt ? 600 : 400,
                  transition: 'background 0.15s',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'transparent' }}
              >
                {opt}
              </div>
            ))}

            {/* Empty state */}
            {(filteredGroups && Object.keys(filteredGroups).length === 0) ||
             (filteredOptions && filteredOptions.length === 0) ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                No results for "{search}"
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}