import { useState, useEffect, useId, useRef } from 'react'
import mermaid from 'mermaid'
import { MERMAID_CONFIG } from '../lib/mermaidTheme'

let initialized = false
function ensureInitialized() {
  if (initialized) return
  mermaid.initialize(MERMAID_CONFIG)
  initialized = true
}

const TYPE_OPTIONS = [
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'erDiagram', label: 'ER Diagram' },
  { value: 'sequenceDiagram', label: 'Sequence' },
  { value: 'architecture', label: 'Architecture' },
]

// mermaidCode/type changes flow back up via onCodeChange(code, type) — type is
// only passed when it actually changed (regenerate-as-a-different-type),
// otherwise omitted so the parent keeps whatever type it already has on file.
export default function MermaidDiagram({ mermaidCode, topic, subsectionTitle, diagramType, onCodeChange }) {
  const domId = useId().replace(/:/g, '_')
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [regenType, setRegenType] = useState(diagramType || 'flowchart')
  const [downloading, setDownloading] = useState(false)
  const containerRef = useRef(null)

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
        body: JSON.stringify({ topic, subsectionTitle, diagramType: regenType, chapterExcerpt: '' })
      })
      const data = await res.json()
      if (data.mermaidCode) {
        onCodeChange?.(data.mermaidCode, regenType !== diagramType ? regenType : undefined)
      }
    } catch {
      setError('Could not regenerate this diagram. Please try again.')
    }
    setRegenerating(false)
  }

  const handleDownload = async () => {
    if (!containerRef.current) return
    setDownloading(true)
    try {
      const svgEl = containerRef.current.querySelector('svg')
      if (!svgEl) return
      const svgString = new XMLSerializer().serializeToString(svgEl)
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = dataUri
      })
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = (img.naturalWidth || 600) * scale
      canvas.height = (img.naturalHeight || 400) * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${(subsectionTitle || 'diagram').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`
      a.click()
    } catch {
      setError('Could not download this diagram as an image.')
    }
    setDownloading(false)
  }

  return (
    <div style={{
      margin: '12px 0 20px', padding: 14, borderRadius: 12,
      border: '1px solid var(--border)', background: 'var(--bg-elevated)'
    }}>
      {svg && (
        <div ref={containerRef} style={{ overflowX: 'auto', textAlign: 'center' }}
          dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      {error && (
        <p style={{ fontSize: 12.5, color: 'var(--danger)', marginBottom: 8 }}>
          ⚠️ {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: svg || error ? 10 : 0, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={regenType}
          onChange={e => setRegenType(e.target.value)}
          title="Diagram type to use next time you regenerate"
          style={{
            fontSize: 11.5, padding: '5px 8px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif'
          }}
        >
          {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={handleRegenerate} disabled={regenerating}
          style={{
            fontSize: 11.5, padding: '5px 10px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: regenerating ? 'default' : 'pointer',
            fontFamily: 'Geist, sans-serif'
          }}>
          {regenerating ? 'Regenerating…' : '↻ Regenerate'}
        </button>
        {svg && (
          <button onClick={handleDownload} disabled={downloading}
            style={{
              fontSize: 11.5, padding: '5px 10px', borderRadius: 20,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: downloading ? 'default' : 'pointer',
              fontFamily: 'Geist, sans-serif'
            }}>
            {downloading ? 'Preparing…' : '⬇ Download image'}
          </button>
        )}
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
