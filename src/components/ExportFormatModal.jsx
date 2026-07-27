import { useState } from 'react'
import {
  FONT_OPTIONS, FONT_SIZE_OPTIONS, SPACING_OPTIONS,
  DEGREE_OPTIONS, CITATION_OPTIONS,
  loadFormatOptions, saveFormatOptions
} from '../lib/export'

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const selectStyle = {
  width: '100%', padding: '9px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
  color: 'var(--text)', fontSize: 13, fontFamily: 'Geist, sans-serif', outline: 'none'
}

export default function ExportFormatModal({ projectId, onConfirm, onClose }) {
  const [options, setOptions] = useState(() => loadFormatOptions(projectId))

  const set = (key, value) => setOptions(prev => ({ ...prev, [key]: value }))

  const handleConfirm = () => {
    saveFormatOptions(projectId, options)
    onConfirm(options)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflowY: 'auto'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: '28px 26px',
        maxWidth: 420, width: '100%', border: '1px solid var(--border)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 19, color: 'var(--text)', marginBottom: 4 }}>
          Download format
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
          Match your department's required format. This is remembered for next time.
        </p>

        <Field label="File type">
          <div style={{ display: 'flex', gap: 8 }}>
            {['word', 'pdf'].map(type => (
              <button key={type} onClick={() => set('fileType', type)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${options.fileType === type ? 'var(--accent)' : 'var(--border)'}`,
                  background: options.fileType === type ? 'rgba(0,126,167,0.08)' : 'transparent',
                  color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif'
                }}>
                {type === 'word' ? 'Word (.docx)' : 'PDF (.pdf)'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Font">
          <select style={selectStyle} value={options.font} onChange={e => set('font', e.target.value)}>
            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Font size">
              <select style={selectStyle} value={options.fontSize} onChange={e => set('fontSize', Number(e.target.value))}>
                {FONT_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}pt</option>)}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Line spacing">
              <select style={selectStyle} value={options.spacing} onChange={e => set('spacing', e.target.value)}>
                {SPACING_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <Field label="Degree wording (cover page)">
          <select style={selectStyle} value={options.degreeWording} onChange={e => set('degreeWording', e.target.value)}>
            {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>

        <Field label="Citation style">
          <select style={selectStyle} value={options.citationStyle} onChange={e => set('citationStyle', e.target.value)}>
            {CITATION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{
            padding: '11px 18px', borderRadius: 40, border: '1.5px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', fontSize: 13,
            cursor: 'pointer', fontFamily: 'Geist, sans-serif'
          }}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={{
            flex: 1, padding: '11px 18px', borderRadius: 40, border: 'none',
            background: '#1a1a1a', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Geist, sans-serif'
          }}>
            Download →
          </button>
        </div>
      </div>
    </div>
  )
}
