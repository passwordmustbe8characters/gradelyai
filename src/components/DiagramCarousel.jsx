import { useState, useEffect, useId, useRef, useCallback } from 'react'
import mermaid from 'mermaid'
import { MERMAID_CONFIG } from '../lib/mermaidTheme'
import { svgToPngDataUrl } from '../lib/svgRaster'
import { correctSectionDiagram } from '../lib/ai'

let initialized = false
function ensureInitialized() {
  if (initialized) return
  mermaid.initialize(MERMAID_CONFIG)
  initialized = true
}

const TYPE_LABELS = {
  flowchart: 'Flowchart',
  erDiagram: 'ER Diagram',
  sequenceDiagram: 'Sequence',
  architecture: 'Architecture',
}

const navBtnStyle = {
  width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)',
  background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer',
  fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Geist, sans-serif', padding: 0,
}

const pillBtnStyle = {
  fontSize: 11.5, padding: '5px 10px', borderRadius: 20,
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Geist, sans-serif',
}

// diagrams: [{ type, mermaidCode, selected }] — one entry per diagram type generated
// for this section. onChange receives the full replacement array for this section;
// the parent is responsible for persisting it.
export default function DiagramCarousel({ diagrams, topic, subsectionTitle, onChange }) {
  const domIdBase = useId().replace(/:/g, '_')
  const [index, setIndex] = useState(() => {
    const sel = diagrams.findIndex(d => d.selected)
    return sel >= 0 ? sel : 0
  })
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [correction, setCorrection] = useState('')
  const [applying, setApplying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [editing, setEditing] = useState(false)
  const containerRef = useRef(null)

  const safeIndex = Math.min(index, diagrams.length - 1)
  const current = diagrams[safeIndex]

  useEffect(() => {
    if (!current?.mermaidCode?.trim()) { setSvg(''); return }
    let cancelled = false
    ensureInitialized()
    mermaid.render(`mermaid-${domIdBase}-${safeIndex}`, current.mermaidCode)
      .then(({ svg }) => { if (!cancelled) { setSvg(svg); setError('') } })
      .catch(err => { if (!cancelled) { setSvg(''); setError(err.message || 'Could not render this diagram') } })
    return () => { cancelled = true }
  }, [current?.mermaidCode, safeIndex, domIdBase])

  const goTo = useCallback((newIndex) => {
    setIndex(((newIndex % diagrams.length) + diagrams.length) % diagrams.length)
    setCorrection('')
    setError('')
  }, [diagrams.length])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(safeIndex - 1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(safeIndex + 1) }
  }

  const applyCorrection = async () => {
    if (!correction.trim()) return
    setApplying(true)
    setError('')
    try {
      const newCode = await correctSectionDiagram({
        topic, subsectionTitle, diagramType: current.type,
        mermaidCode: current.mermaidCode, instruction: correction.trim()
      })
      onChange(diagrams.map((d, i) => i === safeIndex ? { ...d, mermaidCode: newCode } : d))
      setCorrection('')
    } catch (err) {
      setError(err.message || 'Could not apply that correction. Please try again.')
    }
    setApplying(false)
  }

  const selectThis = () => {
    onChange(diagrams.map((d, i) => ({ ...d, selected: i === safeIndex })))
  }

  const handleDownload = async () => {
    if (!containerRef.current) return
    setDownloading(true)
    try {
      const svgEl = containerRef.current.querySelector('svg')
      if (!svgEl) return
      const svgString = new XMLSerializer().serializeToString(svgEl)
      const { dataUrl } = await svgToPngDataUrl(svgString, { scale: 3 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${(subsectionTitle || 'diagram').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${current.type}.png`
      a.click()
    } catch {
      setError('Could not download this diagram as an image.')
    }
    setDownloading(false)
  }

  if (!diagrams?.length) return null

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        outline: 'none', margin: '12px 0 20px', padding: 14, borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-elevated)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => goTo(safeIndex - 1)} disabled={diagrams.length < 2} aria-label="Previous diagram" style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {TYPE_LABELS[current.type] || current.type} · {safeIndex + 1}/{diagrams.length}
          </span>
          <button onClick={() => goTo(safeIndex + 1)} disabled={diagrams.length < 2} aria-label="Next diagram" style={navBtnStyle}>›</button>
        </div>
        {current.selected ? (
          <span style={{ fontSize: 11.5, color: 'var(--success)', fontWeight: 600 }}>✓ Using this one in your document</span>
        ) : (
          <button onClick={selectThis} style={pillBtnStyle}>Use this diagram</button>
        )}
      </div>

      {diagrams.length > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
          {diagrams.map((d, i) => (
            <button
              key={d.type}
              onClick={() => goTo(i)}
              aria-label={`Go to ${TYPE_LABELS[d.type] || d.type}`}
              title={TYPE_LABELS[d.type] || d.type}
              style={{
                width: 7, height: 7, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                background: i === safeIndex ? 'var(--accent)' : 'var(--border)'
              }}
            />
          ))}
        </div>
      )}

      {svg && (
        <div style={{ overflowX: 'auto', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      {error && (
        <p style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 8 }}>⚠️ {error}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          value={correction}
          onChange={e => setCorrection(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') applyCorrection() }}
          placeholder="Type a correction for this diagram (e.g. 'add a database layer')…"
          style={{
            flex: 1, minWidth: 160, fontSize: 12.5, padding: '7px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text)', fontFamily: 'Geist, sans-serif', outline: 'none'
          }}
        />
        <button onClick={applyCorrection} disabled={applying || !correction.trim()}
          style={{
            fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 20,
            border: 'none', background: 'var(--accent)', color: 'white',
            cursor: applying || !correction.trim() ? 'default' : 'pointer', fontFamily: 'Geist, sans-serif',
            opacity: applying || !correction.trim() ? 0.6 : 1,
          }}>
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={handleDownload} disabled={downloading} style={pillBtnStyle}>
          {downloading ? 'Preparing…' : '⬇ Download image'}
        </button>
        <button onClick={() => setEditing(v => !v)} style={pillBtnStyle}>
          {editing ? 'Hide code' : 'Edit diagram code'}
        </button>
      </div>
      {editing && (
        <textarea
          value={current.mermaidCode || ''}
          onChange={e => onChange(diagrams.map((d, i) => i === safeIndex ? { ...d, mermaidCode: e.target.value } : d))}
          rows={6}
          style={{
            width: '100%', marginTop: 10, resize: 'vertical', fontFamily: 'monospace',
            fontSize: 12, padding: 10, borderRadius: 8, border: '1px solid var(--border-light)',
            background: 'var(--bg-card)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box'
          }}
        />
      )}
    </div>
  )
}
