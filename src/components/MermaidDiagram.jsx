import { useState, useEffect, useId } from 'react'
import mermaid from 'mermaid'

let initialized = false
function ensureInitialized() {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' })
  initialized = true
}

export default function MermaidDiagram({ mermaidCode, topic, subsectionTitle, diagramType, onCodeChange }) {
  const domId = useId().replace(/:/g, '_')
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!mermaidCode?.trim()) return
    let cancelled = false
    ensureInitialized()
    mermaid.render(`mermaid-${domId}`, mermaidCode)
      .then(({ svg }) => { if (!cancelled) { setSvg(svg); setError('') } })
      .catch(err => { if (!cancelled) { setSvg(''); setError(err.message || 'Could not render this diagram') } })
    return () => { cancelled = true }
  }, [mermaidCode, domId])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || ''
      const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
      const res = await fetch(`${BASE_URL}/api/generate-diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, subsectionTitle, diagramType, chapterExcerpt: '' })
      })
      const data = await res.json()
      if (data.mermaidCode) {
        onCodeChange?.(data.mermaidCode)
      }
    } catch {
      setError('Could not regenerate this diagram. Please try again.')
    }
    setRegenerating(false)
  }

  return (
    <div style={{
      margin: '12px 0 20px', padding: 14, borderRadius: 12,
      border: '1px solid var(--border)', background: 'var(--bg-elevated)'
    }}>
      {svg && (
        <div style={{ overflowX: 'auto', textAlign: 'center' }}
          dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      {error && (
        <p style={{ fontSize: 12.5, color: 'var(--danger)', marginBottom: 8 }}>
          ⚠️ {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: svg || error ? 10 : 0 }}>
        <button onClick={handleRegenerate} disabled={regenerating}
          style={{
            fontSize: 11.5, padding: '5px 10px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: regenerating ? 'default' : 'pointer',
            fontFamily: 'Geist, sans-serif'
          }}>
          {regenerating ? 'Regenerating…' : '↻ Regenerate'}
        </button>
        <button onClick={() => setEditing(v => !v)}
          style={{
            fontSize: 11.5, padding: '5px 10px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Geist, sans-serif'
          }}>
          {editing ? 'Hide code' : 'Edit diagram code'}
        </button>
      </div>
      {editing && (
        <textarea
          value={mermaidCode || ''}
          onChange={e => onCodeChange?.(e.target.value)}
          rows={6}
          style={{
            width: '100%', marginTop: 10, resize: 'vertical', fontFamily: 'monospace',
            fontSize: 12, padding: 10, borderRadius: 8, border: '1px solid var(--border-light)',
            background: 'var(--bg-card)', color: 'var(--text)', outline: 'none'
          }}
        />
      )}
    </div>
  )
}
