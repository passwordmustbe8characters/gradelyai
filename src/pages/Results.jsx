import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { exportToWord } from '../lib/export'
// isPaid replaced by direct check on parsed.isPaidUser
import { updateProject } from '../lib/auth'
import { fetchRealPapers, generateReferences } from '../lib/ai'
import Paywall from '../components/Paywall'
import logoPrimary from '../assets/primary-logo.png' 
import logoSubmark from '../assets/submark-logo.png'

// ─── ICONS ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function WandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
      <path d="m14 7 3 3"/>
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function RefsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <path d="M12 11V7"/>
      <circle cx="12" cy="5" r="2"/>
      <line x1="8" y1="15" x2="8" y2="15" strokeWidth="3"/>
      <line x1="16" y1="15" x2="16" y2="15" strokeWidth="3"/>
    </svg>
  )
}

// ─── SPINNING BUTTON ──────────────────────────────────────────────────────────

function SpinningButton({ onClick, disabled, loading, children, style, className = 'btn-ghost' }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} className={className}
      style={{ position: 'relative', ...style }}>
      {loading && (
        <svg
          style={{ position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', borderRadius: 'inherit', pointerEvents: 'none' }}
          viewBox="0 0 100 40" preserveAspectRatio="none">
          <rect x="1" y="1" width="98" height="38" rx="20" ry="20"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray="280" strokeDashoffset="280"
            style={{ animation: 'strokeRun 1.2s linear infinite' }}/>
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── TEXT EDITOR TOOLBAR ──────────────────────────────────────────────────────

function TextEditor({ onInstruct }) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [editText, setEditText] = useState('')
  const [instruction, setInstruction] = useState('')
  const [showAIInput, setShowAIInput] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleSelection = (e) => {
      if (e.target.closest('.gradely-editor-toolbar')) return
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      if (!text || text.length < 5) { setVisible(false); return }
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelectedText(text)
      setEditText(text)
      setInstruction('')
      setShowAIInput(false)
      setPosition({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 12 })
      setVisible(true)
    }
    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [])

  const handleSave = () => { onInstruct(selectedText, null, editText); setVisible(false) }

  const handleAIRewrite = async () => {
    if (!instruction.trim()) return
    setLoading(true)
    try { await onInstruct(selectedText, instruction); setVisible(false); setShowAIInput(false) }
    catch { alert('Failed to apply. Try again.') }
    setLoading(false)
  }

  if (!visible) return null
  const toolbarWidth = 420
  let leftOffset = position.x - (toolbarWidth / 2)
  leftOffset = Math.min(Math.max(leftOffset, 16), window.innerWidth - toolbarWidth - 16)

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onMouseDown={() => setVisible(false)} />
      <div className="gradely-editor-toolbar"
        style={{ position: 'absolute', left: leftOffset, top: position.y, width: toolbarWidth, zIndex: 1000,
          background: '#1A1A24', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
          maxWidth: 'calc(100vw - 32px)',
          animation: 'fadeUp 0.15s ease' }}
        onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: 'Geist, sans-serif' }}>
          Highlight Edit Panel
        </p>
        <textarea value={editText} onChange={e => setEditText(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 13, fontFamily: 'Geist, sans-serif',
            resize: 'vertical', outline: 'none', lineHeight: 1.6, minHeight: 65, marginBottom: 10 }} />
        {showAIInput && (
          <textarea autoFocus value={instruction} onChange={e => setInstruction(e.target.value)}
            placeholder="Tell the AI what to change about this sentence..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid rgba(0,126,167,0.4)',
              background: 'rgba(0,126,167,0.08)', color: 'white', fontSize: 13, fontFamily: 'Geist, sans-serif',
              resize: 'vertical', outline: 'none', lineHeight: 1.6, minHeight: 60, marginBottom: 10 }} />
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleSave} disabled={editText === selectedText && !showAIInput}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#2D9B6F', color: 'white',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif',
              opacity: editText === selectedText && !showAIInput ? 0.4 : 1, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6 }}>
            Save Edit
          </button>
          {!showAIInput ? (
            <button onClick={() => setShowAIInput(true)}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#007EA7', color: 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
              AI Rewrite
            </button>
          ) : (
            <button onClick={handleAIRewrite} disabled={!instruction.trim() || loading}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#007EA7', color: 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif',
                opacity: !instruction.trim() || loading ? 0.5 : 1, transition: 'all 0.15s' }}>
              {loading ? 'Rewriting...' : 'Apply Rewrite →'}
            </button>
          )}
          <button onClick={() => setVisible(false)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              fontSize: 13, fontFamily: 'Geist, sans-serif', marginLeft: 'auto' }}>
            Close
          </button>
        </div>
      </div>
    </>
  )
}

// ─── INLINE STYLES ────────────────────────────────────────────────────────────

const pageStyles = `
  .res-layout {
    display: flex;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: var(--bg);
    font-family: 'Geist', sans-serif;
    .mobile-submark { display: none; };
  }

  /* ── LEFT SIDEBAR ── */
  .res-sidebar {
    width: 260px;
    flex-shrink: 0;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    border-right: 1px solid var(--border);
    background: var(--bg-elevated);
    display: flex;
    flex-direction: column;
    z-index: 1000;
  }

  .res-sidebar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    flex-shrink: 0;
  }
  .res-sidebar-logo-mark {
    width: 26px; height: 26px;
    border-radius: 6px;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .res-sidebar-logo-name {
    font-family: 'Melodrama', serif;
    font-size: 16px;
    color: var(--text);
    letter-spacing: -0.2px;
  }

  .res-sidebar-chapters {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px 8px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .res-sidebar-chapters::-webkit-scrollbar { width: 3px; }
  .res-sidebar-chapters::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .res-chapter-tab {
    border: 1px solid var(--border-light);
    border-radius: 8px;
    margin-bottom: 4px;
    overflow: hidden;
    background: var(--bg-card);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .res-chapter-tab:hover { border-color: var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .res-chapter-tab.active { border-color: var(--accent); box-shadow: 0 2px 12px rgba(0,126,167,0.10); }

  .res-chapter-header {
    display: flex; align-items: center; gap: 8px; padding: 10px 12px;
    cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text);
    transition: background 0.15s; font-family: 'Geist', sans-serif;
    background: transparent; border: none; width: 100%; text-align: left;
  }
  .res-chapter-header:hover { background: rgba(0,0,0,0.03); }
  .res-chapter-header .ch-num { font-size: 10px; font-weight: 700; color: var(--text-dim); min-width: 18px; letter-spacing: 0.5px; }
  .res-chapter-header .ch-title { flex: 1; font-size: 12.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .res-chapter-header .ch-badge { font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 10px; flex-shrink: 0; }
  .res-chapter-header .ch-badge.complete { background: rgba(45,155,111,0.1); color: var(--success); }
  .res-chapter-header .ch-badge.draft { background: rgba(232,160,32,0.1); color: #E8A020; }
  .res-chapter-header .ch-badge.locked { background: rgba(217,79,79,0.08); color: var(--danger); }
  .res-chapter-header .ch-arrow { font-size: 10px; color: var(--text-dim); transition: transform 0.2s; flex-shrink: 0; }
  .res-chapter-header .ch-arrow.open { transform: rotate(90deg); }

  .res-subsection-list { padding: 2px 12px 8px 38px; display: flex; flex-direction: column; gap: 2px; }
  .res-subsection-item {
    font-size: 12px; padding: 5px 10px; border-radius: 4px; cursor: pointer;
    color: var(--text-muted); transition: all 0.15s; border: none;
    background: transparent; text-align: left; font-family: 'Geist', sans-serif;
  }
  .res-subsection-item:hover { background: rgba(0,126,167,0.05); color: var(--text); }
  .res-subsection-item.active { background: rgba(0,126,167,0.08); color: var(--accent); }

  .res-sidebar-defense { flex-shrink: 0; border-top: 1px solid var(--border); padding: 12px 10px 16px; background: var(--bg-elevated); }
  .res-sidebar-defense-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); padding: 0 6px; margin-bottom: 6px; }
  
  .res-nav-item {
    display: flex; align-items: center; gap: 9px; padding: 7px 10px;
    border-radius: 6px; cursor: pointer; font-size: 12.5px; color: var(--text-muted);
    transition: all 0.15s; border: none; background: transparent; width: 100%;
    text-align: left; font-family: 'Geist', sans-serif; margin-bottom: 1px;
  }
  .res-nav-item:hover { background: rgba(0,0,0,0.04); color: var(--text); }
  .res-nav-item.active { background: rgba(0,126,167,0.08); color: var(--accent); }
  .res-nav-item svg { flex-shrink: 0; }

  /* ── MAIN COLUMN ── */
  .res-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; position: relative; }

  .res-topbar {
    height: 52px; flex-shrink: 0; border-bottom: 1px solid var(--border);
    background: rgba(247,245,240,0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: space-between; padding: 0 28px 0 24px; gap: 12px;
  }
  .res-topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .res-mobile-toggle { display: none; background: transparent; border: none; color: var(--text); cursor: pointer; padding: 4px; }
  
  .res-topbar-breadcrumb { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .res-topbar-sep { color: var(--text-dim); }
  .res-topbar-current { font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
  
  .res-topbar-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; overflow-x: auto; scrollbar-width: none; }
  .res-topbar-actions::-webkit-scrollbar { display: none; }

  /* BUTTON STYLES */
  .res-btn-text { font-size: 12px; font-weight: 500; color: var(--text-muted); background: transparent; border: none; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s; font-family: 'Geist', sans-serif; display: flex; align-items: center; gap: 4px; }
  .res-btn-text:hover { background: rgba(0,0,0,0.04); color: var(--text); }
  
  .res-btn-black { font-size: 12px; font-weight: 600; color: white; background: #1a1a1a; border: none; cursor: pointer; padding: 7px 16px; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); font-family: 'Geist', sans-serif; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .res-btn-black:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); background: #2a2a2a; }
  
  .res-btn-ghost { font-size: 12px; font-weight: 500; color: var(--text-muted); background: transparent; border: 1px solid var(--border); cursor: pointer; padding: 6px 14px; transition: all 0.25s; font-family: 'Geist', sans-serif; display: flex; align-items: center; gap: 5px; }
  .res-btn-ghost:hover { border-color: var(--text); color: var(--text); background: rgba(0,0,0,0.02); transform: translateY(-1px); }
  
  .res-btn-accent { font-size: 12px; font-weight: 600; color: white; background: var(--accent); border: none; cursor: pointer; padding: 7px 16px; transition: all 0.25s; font-family: 'Geist', sans-serif; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(0,126,167,0.15); }
  .res-btn-accent:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,126,167,0.25); }

  /* Default radii */
  .res-btn-ghost, .res-btn-accent { border-radius: 40px; }
  .res-btn-humanize { border-radius: 8px !important; } /* Always rounded rect */

  .res-content-scroll { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .res-content-scroll::-webkit-scrollbar { width: 5px; }
  .res-content-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }

  .res-doc { max-width: 820px; margin: 0 auto; padding: 40px 40px 120px; }
  .res-doc-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 8px; }
  .res-doc-back { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; color: var(--text-muted); cursor: pointer; border: none; background: transparent; padding: 0; font-family: 'Geist', sans-serif; transition: color 0.2s; flex-shrink: 0; }
  .res-doc-back:hover { color: var(--text); }
  .res-doc-university { font-size: 12px; color: var(--accent); font-weight: 500; text-align: right; flex-shrink: 0; }
  .res-doc-title { font-family: 'Melodrama', serif; font-size: clamp(28px, 4vw, 40px); font-weight: 700; color: var(--text); line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 12px; margin-top: 8px; }
  .res-doc-stats { font-size: 13px; color: var(--text-muted); margin-bottom: 40px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .res-doc-divider { height: 1px; background: var(--border); margin-bottom: 40px; }

  .res-chapter-block { margin-bottom: 64px; scroll-margin-top: 60px; }
  .res-chapter-block-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 6px; }
  .res-chapter-block-num { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); flex-shrink: 0; }
  .res-chapter-block-title { font-family: 'Melodrama', serif; font-size: clamp(20px, 3vw, 26px); font-weight: 700; color: var(--text); letter-spacing: -0.3px; line-height: 1.2; }
  .res-chapter-block-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px; margin-left: 4px; vertical-align: middle; }
  .res-chapter-block-badge.complete { background: rgba(45,155,111,0.1); color: var(--success); }
  .res-chapter-block-badge.draft { background: rgba(232,160,32,0.1); color: #E8A020; }
  .res-chapter-block-badge.locked { background: rgba(217,79,79,0.08); color: var(--danger); }
  .res-chapter-block-divider { height: 1px; background: var(--border); margin: 14px 0 28px; }

  .res-chapter-body { font-size: 15px; line-height: 1.9; color: var(--text); user-select: text; }
  .res-subsection-anchor { scroll-margin-top: 80px; }
  .res-subsection-heading { font-family: 'Geist', sans-serif; font-size: 18px; font-weight: 600; color: var(--text); margin-top: 32px; margin-bottom: 12px; padding-top: 20px; border-top: 1px solid var(--border-light); }
  .res-subsection-heading:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
  .res-locked-block { padding: 28px 24px; border-radius: 12px; background: var(--bg-elevated); border: 1px solid var(--border); text-align: center; }

  .res-tab-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 10px; }
  .res-tab-title { font-family: 'Melodrama', serif; font-size: 28px; font-weight: 700; color: var(--text); margin-bottom: 6px; letter-spacing: -0.3px; }
  .res-tab-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 36px; line-height: 1.6; }
  .res-tab-divider { height: 1px; background: var(--border); margin-bottom: 36px; }

  /* ── PUBLISH & UNLOCK BARS ── */
  .res-publish-bar, .res-unlock-bar {
    position: fixed;
    bottom: 0;
    left: 260px;
    right: 0;
    z-index: 20; /* Lower z-index so floating buttons sit on top */
  }

  .res-publish-bar { background: var(--bg-card); border-top: 1px solid var(--border); padding: 12px 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
  .res-publish-btn { padding: 10px 32px; border-radius: 100px; border: none; background: var(--accent); color: white; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Geist', sans-serif; transition: all 0.3s; box-shadow: 0 4px 20px rgba(0,126,167,0.25); display: flex; align-items: center; gap: 8px; }
  .res-publish-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,126,167,0.35); }
  .res-publish-btn:disabled { background: var(--bg-elevated); color: var(--text-dim); cursor: not-allowed; transform: none; box-shadow: none; }

  .res-unlock-bar { background: var(--text); color: white; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-shadow: 0 -4px 24px rgba(0,0,0,0.15); }
  .res-unlock-btn { background: var(--accent); color: white; border: none; border-radius: 100px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Geist', sans-serif; white-space: nowrap; transition: all 0.3s; box-shadow: 0 4px 20px rgba(0,126,167,0.3); }

  /* ── OVERLAY FOR MOBILE SIDEBAR ── */
  .res-sidebar-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 999;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  /* ── FLOATING MOBILE ACTIONS (HIDDEN ON DESKTOP) ── */
  .mobile-floating-actions {
    display: none;
  }

  /* ── MOBILE OPTIMIZATIONS ── */
  @media (max-width: 768px) {
    .mobile-submark {
  display: block !important;
  height: 26px;
  width: auto;
  cursor: pointer;
  margin-right: 6px;
}
    .res-sidebar {
      position: fixed; left: 0; top: 0; bottom: 0;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .res-sidebar.open { transform: translateX(0); }
    .res-sidebar-overlay.open { display: block; }
    
    .res-mobile-toggle { display: block; }
    
    .res-doc { padding: 24px 20px 140px; max-width: 100%; }
    .res-topbar { padding: 0 16px; min-height: 56px; gap: 12px; }
    .res-topbar-breadcrumb { display: none; } 
    
    .res-publish-bar { left: 0; padding: 12px 16px; }
    .res-publish-btn { width: 100%; justify-content: center; }
    
    .res-unlock-bar { left: 0; padding: 16px; flex-direction: column; align-items: stretch; text-align: center; }
    .res-unlock-btn { width: 100%; justify-content: center; }
    
    .res-doc-top-row { flex-direction: column; align-items: flex-start; gap: 8px; }
    .res-doc-university { text-align: left; }

    /* Hide text selectively on mobile */
    .hide-on-mobile { display: none !important; }

    /* Convert specific buttons to purely circle icons to save space */
    .res-topbar-actions .res-btn-text,
    .res-topbar-actions .res-btn-ghost {
      padding: 8px !important;
      border-radius: 50% !important;
      width: 36px; height: 36px;
      justify-content: center;
    }

    /* Humanize Button explicitly stays a Rounded Rect */
    .res-btn-humanize {
      border-radius: 8px !important;
      padding: 6px 12px !important;
    }

    /* Hide Desktop Download Button on Mobile */
    .desktop-download-btn {
      display: none !important;
    }

    /* Floating Download Button on Bottom Right */
    .mobile-floating-actions {
      display: flex;
      position: fixed;
      right: 20px;
      flex-direction: column;
      gap: 12px;
      z-index: 1000; /* High z-index to sit above publish/unlock bar */
    }

    .floating-icon-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--accent);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,126,167,0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .floating-icon-btn:active {
      transform: scale(0.95);
    }

    .floating-icon-btn svg { width: 22px; height: 22px; }
  }
`
// ─── UNDERSTAND PANEL COMPONENT ───────────────────────────────────────────────
function UnderstandPanel({ sectionTitle, sectionContent, onUpdateParagraph }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)

  const BASE_URL = import.meta.env.VITE_API_URL || ''

  const load = async () => {
    if (data) { setOpen(o => !o); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
      const res = await fetch(`${BASE_URL}/api/understand-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sectionTitle, sectionContent })
      })
      const d = await res.json()
      setData(d)
      setOpen(true)
    } catch (err) {
      console.error('Understand panel error:', err)
    }
    setLoading(false)
  }

  const submit = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
      const res = await fetch(`${BASE_URL}/api/understand-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sectionTitle, sectionContent, studentAnswer: answer })
      })
      const d = await res.json()
      if (d.updatedParagraph && onUpdateParagraph) {
        onUpdateParagraph(d.updatedParagraph)
        setUpdated(true)
        setOpen(false)
        setAnswer('')
      }
    } catch (err) {
      console.error('Update paragraph error:', err)
    }
    setLoading(false)
  }

  if (updated) {
    return (
      <div style={{ margin: '8px 0 16px', padding: '8px 14px', background: 'rgba(45,155,111,0.08)', borderRadius: 8, border: '1px solid rgba(45,155,111,0.2)', fontSize: 13, color: 'var(--success)' }}>
        ✓ Your personal context has been added to this section.
      </div>
    )
  }

  return (
    <div style={{ margin: '8px 0 20px' }}>
      <button
        onClick={load}
        disabled={loading}
        style={{ background: 'none', border: '1px solid rgba(0,126,167,0.2)', padding: '6px 14px', borderRadius: 20, color: 'var(--accent)', cursor: loading ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Geist, sans-serif', transition: 'all 0.2s' }}
      >
        {loading ? '...' : open ? '▾ Hide Grad\'s explanation' : '▸ Understand this section with Grad'}
      </button>

      {open && data && (
        <div style={{ marginTop: 12, padding: '16px 18px', background: 'rgba(0,126,167,0.04)', borderRadius: 10, border: '1px solid rgba(0,126,167,0.12)' }}>
          <p style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent)' }}>What this section says:</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>{data.plainExplanation}</span>
          </p>
          <p style={{ fontSize: 13, marginBottom: 6, color: 'var(--text)' }}>
            <strong>Grad asks:</strong> {data.localQuestion}
          </p>
          <p style={{ fontSize: 13, marginBottom: 14, color: 'var(--text)' }}>
            <strong>Your panel might ask:</strong> {data.expertQuestion}
          </p>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here — your response will be woven into this section to personalise it (optional)"
            rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'Geist, sans-serif', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              onClick={submit}
              disabled={!answer.trim() || loading}
              style={{ padding: '8px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: answer.trim() ? 'pointer' : 'not-allowed', opacity: answer.trim() ? 1 : 0.5 }}
            >
              {loading ? 'Updating...' : 'Add to my project →'}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 13, cursor: 'pointer' }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('project')
  const [activeChapter, setActiveChapter] = useState(0)
  const [expandedChapters, setExpandedChapters] = useState({})
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [humanizing, setHumanizing] = useState(false)
  const [humanized, setHumanized] = useState(false)
  const [breakdown, setBreakdown] = useState('')
  const [weaknesses, setWeaknesses] = useState(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)
  const [loadingWeaknesses, setLoadingWeaknesses] = useState(false)
  const [loadingFlashcards, setLoadingFlashcards] = useState(false)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [defenseError, setDefenseError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [paid, setPaid] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('gradelyResult')
    if (!saved) { navigate('/start'); return }

    const parsed = JSON.parse(saved)
    const hasContent = parsed?.chapters?.some(c => c.content && c.content.trim().length > 0)

    if (!hasContent) {
      const dbId = parsed.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
      if (dbId) {
        const BASE_URL = import.meta.env.VITE_API_URL || ''
        const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
        fetch(`${BASE_URL}/api/projects/${dbId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => {
            if (data?.project) {
              const proj = data.project
              const merged = {
                ...parsed,
                chapters: proj.chapters ? JSON.parse(proj.chapters) : parsed.chapters,
                structure: proj.structure ? JSON.parse(proj.structure) : parsed.structure,
                projectInfo: proj.project_info ? JSON.parse(proj.project_info) : parsed.projectInfo,
              }
              sessionStorage.setItem('gradelyResult', JSON.stringify(merged))
              setTimeout(() => setResult(merged), 0)
            }
          })
          .catch(err => console.error('[Gradely] Results hydration failed:', err))
      }
    }

    setTimeout(() => {
      setResult(parsed)
      setPaid(!!(parsed.isPaidUser || parsed.is_paid === 1 || parsed.is_paid === true))
      setExpandedChapters({ 0: true })
    }, 0)
  }, [])

  const totalChapters = result?.chapters?.length || 0
  const completedChapters = result?.chapters?.filter(c => c.content && c.content.trim().length > 0).length || 0
  const isProjectComplete = totalChapters > 0 && completedChapters === totalChapters
  const canPublish = paid && isProjectComplete

  const handleHumanize = async () => {
    if (!result) return
    setHumanizing(true)
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || ''
      const humanizedChapters = []
      for (const chapter of result.chapters) {
        const response = await fetch(`${BASE_URL}/api/humanize`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chapter.content })
        })
        const data = await response.json()
        if (!data.success) throw new Error(data.error || "Humanization API failed")
        humanizedChapters.push({ ...chapter, content: data.data })
      }
      const updated = { ...result, chapters: humanizedChapters, humanized: true }
      setResult(updated)
      sessionStorage.setItem('gradelyResult', JSON.stringify(updated))
      setHumanized(true)
      alert('🎉 Your entire project has been fully humanized successfully!')
    } catch (err) {
      console.error("Humanize Error:", err)
      alert('Humanization failed. Please check your console for details and try again.')
    } finally {
      setHumanizing(false)
    }
  }

  const loadUnifiedDefensePrepData = async () => {
    if (breakdown || weaknesses) return
    setLoadingBreakdown(true); setLoadingWeaknesses(true)
    try {
      const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
      const token = localStorage.getItem('token')
      if (!projectId) return
      const response = await fetch(`/api/projects/${projectId}/defense-prep`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      })
      const resData = await response.json()
      if (resData.success) {
       setBreakdown(resData.data.breakdown)
        setWeaknesses(resData.data.weaknesses)
        sessionStorage.setItem('gradelyFlashcards', JSON.stringify(resData.data.flashcards))
        // Calculate and save defense readiness score
        const weaknessCount = resData.data.weaknesses?.weaknesses?.length || 0
        const readinessScore = Math.max(20, 100 - (weaknessCount * 12))
        const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
        if (projectId) updateProject(projectId, { defense_readiness: readinessScore }).catch(() => {})
      } else throw new Error(resData.error)
    } catch (err) {
      console.error("Defense synchronization failure:", err)
      setDefenseError("Could not load defense data. Please try again.")
    } finally {
      setLoadingBreakdown(false); setLoadingWeaknesses(false)
    }
  }

  const loadReferences = async () => {
    if (result.references && result.references.length > 0) return
    if (loadingRefs) return
    setLoadingRefs(true)
    try {
      const topic = result.projectInfo?.topic || ''
      const department = result.projectInfo?.department || ''
      const realPapers = await fetchRealPapers(topic, department)
      const data = await generateReferences(result.projectInfo, realPapers)
      if (data?.references?.length > 0) {
        const updated = { ...result, references: data.references }
        setResult(updated)
        sessionStorage.setItem('gradelyResult', JSON.stringify(updated))
        const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
        if (projectId) updateProject(projectId, { references: data.references }).catch(() => {})
      }
    } catch (err) {
      console.error('References generation failed:', err)
    }
    setLoadingRefs(false)
  }

  const handleFlashcards = async () => {
    if (loadingFlashcards) return
    setLoadingFlashcards(true)
    try {
      let cards = sessionStorage.getItem('gradelyFlashcards')
      if (!cards) await loadUnifiedDefensePrepData()
      navigate('/flashcards')
    } catch (err) {
      console.error(err)
      alert('Failed to load flashcards. Please try again.')
    } finally {
      setLoadingFlashcards(false)
    }
  }

  const handleExport = async (isClean) => {
    if (!result || exporting) return
    setExporting(true)
    try { await exportToWord(result, isClean) }
    catch (err) { console.error(err); alert('Export failed. Please try again.') }
    setExporting(false)
  }

  const handlePublish = async () => {
    if (!result || !canPublish) return
    const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
    if (!projectId) { alert('Please save your project first'); return }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      const data = await response.json()
      if (response.ok && data.success) alert('✅ Project published to gallery!')
      else alert(data?.error || 'Failed to publish project.')
    } catch (err) {
      console.error('Publish failed:', err)
      alert('Error publishing project. Please try again.')
    }
  }

  const handleUnlock = async () => {
   setPaid(true); setShowPaywall(false)
    const curResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
    sessionStorage.setItem('gradelyResult', JSON.stringify({ ...curResult, isPaidUser: true }))
    sessionStorage.setItem('gradelyPaid', JSON.stringify({ paid: true, timestamp: Date.now() }))
    const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
    if (projectId && user) {
      try { await updateProject(projectId, { is_paid: true }) }
      catch (err) { console.error('Failed to mark as paid:', err) }
    }
    sessionStorage.setItem('gradely_continue_from', '2')
    sessionStorage.setItem('gradely_existing_chapters', JSON.stringify(result.chapters))
    navigate('/build')
  }

  const handleTextInstruct = async (selectedText, instruction, manualEdit) => {
    if (!paid) { alert('Please unlock the full project to edit chapters.'); return }
    let targetNewText = ""
    if (manualEdit !== undefined) {
      targetNewText = manualEdit
    } else {
      try {
        const response = await fetch('/api/humanize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Supervisor Correction Request: Please alter this specific selection: "${selectedText}". Follow this user instruction: ${instruction}` })
        })
        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        targetNewText = data.data
      } catch (err) {
        console.error("Supervisor rewrite exception:", err)
        alert("Failed to apply correction context safely.")
        return
      }
    }
    const updatedChapters = result.chapters.map((ch, i) => {
      if (i === activeChapter) return { ...ch, content: ch.content.replace(selectedText, targetNewText) }
      return ch
    })
    const updatedResultPayload = { ...result, chapters: updatedChapters }
    setResult(updatedResultPayload)
    sessionStorage.setItem('gradelyResult', JSON.stringify(updatedResultPayload))
    const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
    if (projectId) {
      try {
        const token = localStorage.getItem('token')
        await fetch(`/api/projects/${projectId}/persist-chapters`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ chapters: updatedChapters })
        })
      } catch (saveErr) { console.error("Failed to synchronize edits:", saveErr) }
    }
  }

  const renderContentWithSources = (text) => {
    if (!text) return null
    const sourceRegex = /\[SOURCE:\s*([^\]]+)\]/g
    const parts = []
    let lastIndex = 0
    let match
    while ((match = sourceRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const before = text.slice(lastIndex, match.index)
        before.split('\n').forEach((line, i, arr) => {
          parts.push(<span key={`text-${match.index}-${i}`}>{line}</span>)
          if (i < arr.length - 1) parts.push(<br key={`br-${match.index}-${i}`} />)
        })
      }
      const sourceContent = match[1].trim()
      const urlMatch = sourceContent.match(/(https?:\/\/[^\s,]+)/)
      const url = urlMatch ? urlMatch[1] : null
      const label = sourceContent.replace(url || '', '').replace(/,\s*$/, '').trim()
      parts.push(
        <span key={`source-${match.index}`}>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" title={label}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, padding: '1px 7px',
                borderRadius: 10, marginLeft: 3, background: 'rgba(0,126,167,0.08)', color: 'var(--accent)',
                border: '1px solid rgba(0,126,167,0.2)', cursor: 'pointer', textDecoration: 'none',
                fontWeight: 600, verticalAlign: 'middle' }}>
              {label.substring(0, 40)}{label.length > 40 ? '...' : ''}
            </a>
          ) : (
            <span title={label}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, padding: '1px 7px',
                borderRadius: 10, marginLeft: 3, background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                border: '1px solid var(--border)', verticalAlign: 'middle', fontWeight: 500 }}>
              {label.substring(0, 40)}{label.length > 40 ? '...' : ''}
            </span>
          )}
        </span>
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex)
      remaining.split('\n').forEach((line, i, arr) => {
        parts.push(<span key={`end-${i}`}>{line}</span>)
        if (i < arr.length - 1) parts.push(<br key={`end-br-${i}`} />)
      })
    }
    return <>{parts}</>
  }

  const getSubsections = (chapterIndex) => {
    if (!result?.structure?.chapters) return []
    const ch = result.structure.chapters[chapterIndex]
    if (!ch || !ch.subsections) return []
    return ch.subsections.map(s => typeof s === 'string' ? s : s.title)
  }

  const scrollToSubsection = (chapterIdx, subsectionTitle) => {
    const targetId = `subsection-${chapterIdx}-${subsectionTitle}`
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSubsection(subsectionTitle)
      setMobileMenuOpen(false)
    }
  }

  const toggleChapter = (idx) => {
    setExpandedChapters(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const getActiveCrumb = () => {
    if (activeTab === 'project') {
      return result?.chapters?.[activeChapter]
        ? `Chapter ${result.chapters[activeChapter].number}: ${result.chapters[activeChapter].title}`
        : 'Project'
    }
    if (activeTab === 'breakdown') return 'Student Breakdown'
    if (activeTab === 'weaknesses') return 'Panel Weak Spots'
    if (activeTab === 'references') return 'References'
    return ''
  }

  if (!result) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading your project...</p>
    </div>
  )

  return (
    <>
      <style>{pageStyles}</style>

      <div className="res-layout">
        {/* Mobile Overlay */}
        <div className={`res-sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`res-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="res-sidebar-logo" onClick={() => navigate('/')}>
  <img 
    src={logoPrimary} 
    alt="GradelyAI" 
    style={{ height: '24px', width: 'auto', objectFit: 'contain', marginLeft: '4px' }} 
  />
</div>

          <div className="res-sidebar-chapters">
            {result.chapters.map((ch, i) => {
              const isLocked = !paid && ch.number > 1
              const hasContent = ch.content && ch.content.trim().length > 0
              const isActive = activeTab === 'project' && activeChapter === i
              const isExpanded = expandedChapters[i] || false
              const subsections = getSubsections(i)

              return (
                <div key={i} className={`res-chapter-tab${isActive ? ' active' : ''}`}>
                  <button
                    className="res-chapter-header"
                    onClick={() => {
                      if (isLocked) { setShowPaywall(true); setMobileMenuOpen(false); return }
                      setActiveTab('project')
                      setActiveChapter(i)
                      toggleChapter(i)
                    }}
                  >
                    <span className="ch-num">CH {ch.number}</span>
                    <span className="ch-title">{ch.title}</span>
                    {isLocked && <span className="ch-badge locked">🔒</span>}
                    {!isLocked && hasContent && <span className="ch-badge complete">✓</span>}
                    {!isLocked && !hasContent && <span className="ch-badge draft">Draft</span>}
                    {subsections.length > 0 && (
                      <span className={`ch-arrow${isExpanded ? ' open' : ''}`}>▶</span>
                    )}
                  </button>

                  {isExpanded && subsections.length > 0 && (
                    <div className="res-subsection-list">
                      {subsections.map((sub, idx) => (
                        <button
                          key={idx}
                          className={`res-subsection-item${activeSubsection === sub && isActive ? ' active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isLocked) { setShowPaywall(true); setMobileMenuOpen(false); return }
                            setActiveTab('project')
                            setActiveChapter(i)
                            scrollToSubsection(i, sub)
                          }}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {paid && (
            <div className="res-sidebar-defense">
              <p className="res-sidebar-defense-label">Defense Prep</p>
              {[
                { key: 'breakdown', label: 'Student Breakdown', icon: <BookIcon /> },
                { key: 'weaknesses', label: 'Weak Spots', icon: <ShieldIcon /> },
                { key: 'references', label: 'References', icon: <RefsIcon /> },
              ].map(t => (
                <button key={t.key}
                  className={`res-nav-item${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => {
                    setActiveTab(t.key)
                   if (t.key === 'breakdown' || t.key === 'weaknesses') loadUnifiedDefensePrepData()
                    if (t.key === 'references') loadReferences()
                    setMobileMenuOpen(false)
                  }}>
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN PANEL ── */}
        <div className="res-main">
          {/* Top bar */}
          <div className="res-topbar">
            <div className="res-topbar-left">
  <button className="res-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
    <MenuIcon />
  </button>
  
  {/* NEW: Compact Submark for the tight mobile navbar */}
  <img 
    src={logoSubmark} 
    alt="GradelyAI" 
    onClick={() => navigate('/')}
    className="mobile-submark"
  />

  <div className="res-topbar-breadcrumb">
    <span>{result.projectInfo?.topic?.substring(0, 28)}{result.projectInfo?.topic?.length > 28 ? '...' : ''}</span>
    <span className="res-topbar-sep">/</span>
    <span className="res-topbar-current">{getActiveCrumb()}</span>
  </div>
</div>

            <div className="res-topbar-actions">
              <button className="res-btn-text" onClick={() => navigate('/build')}>
                <SparklesIcon /> <span className="hide-on-mobile">Back to Grad</span>
              </button>

              {paid && (
                <>
                  <SpinningButton onClick={handleHumanize} loading={humanizing}
                    className="res-btn-black res-btn-humanize"
                    style={{ fontSize: 12, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <WandIcon /> <span>{humanizing ? 'Applying...' : 'Humanize'}</span>
                  </SpinningButton>

                  <SpinningButton onClick={handleFlashcards} loading={loadingFlashcards}
                    className="res-btn-ghost"
                    style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BookIcon /> <span className="hide-on-mobile">{loadingFlashcards ? 'Loading...' : 'Flashcards'}</span>
                  </SpinningButton>

                  {humanized && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 100, background: 'rgba(45,155,111,0.1)', border: '1px solid rgba(45,155,111,0.2)',
                      fontSize: 12, color: 'var(--success)' }}>
                      <CheckIcon /> <span className="hide-on-mobile">Applied</span>
                    </div>
                  )}

                  <SpinningButton onClick={() => handleExport(true)} loading={exporting}
                    className="res-btn-accent desktop-download-btn"
                    style={{ fontSize: 12, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <DownloadIcon /> <span>{exporting ? 'Exporting...' : 'Download'}</span>
                  </SpinningButton>
                </>
              )}

              {!paid && (
                <button onClick={() => setShowPaywall(true)}
                  className="res-btn-accent desktop-download-btn" style={{ fontSize: 12, padding: '7px 16px' }}>
                  <span className="hide-on-mobile">Unlock Project</span>
                  <span style={{ display: 'none' }} className="mobile-only-icon"><ShieldIcon /></span>
                </button>
              )}
            </div>
          </div>

          <div className="res-content-scroll" ref={contentRef}>
            <TextEditor onInstruct={handleTextInstruct} />

            {activeTab === 'project' && (
              <div className="res-doc">
                <div className="res-doc-top-row">
                  <span className="res-doc-university">
                    {result.projectInfo?.department} · {result.projectInfo?.university}
                  </span> 
                  <button className="res-doc-back" onClick={() => navigate('/dashboard')}>
                    <ArrowLeftIcon /> Back to dashboard
                  </button>
                </div>

                <h1 className="res-doc-title">{result.projectInfo?.topic}</h1>

                <div className="res-doc-stats">
                  <span>{totalChapters} chapter{totalChapters !== 1 ? 's' : ''}</span>
                  <span className="res-doc-stats-sep">·</span>
                  <span>{isProjectComplete ? 'All chapters complete' : `${completedChapters} of ${totalChapters} written`}</span>
                </div>
                <div className="res-doc-divider" />

                {result.chapters.map((ch, idx) => {
                  if (activeChapter !== idx) return null
                  const isLocked = !paid && ch.number > 1
                  const hasContent = ch.content && ch.content.trim().length > 0
                  const subsections = getSubsections(idx)

                  return (
                    <div key={idx} className="res-chapter-block">
                      <div className="res-chapter-block-header">
                        <span className="res-chapter-block-num">Chapter {ch.number}</span>
                        <h2 className="res-chapter-block-title">
                          {ch.title}
                          {isLocked && <span className="res-chapter-block-badge locked">🔒 Locked</span>}
                          {!isLocked && hasContent && <span className="res-chapter-block-badge complete">✓ Complete</span>}
                          {!isLocked && !hasContent && <span className="res-chapter-block-badge draft">Draft</span>}
                        </h2>
                      </div>
                      <div className="res-chapter-block-divider" />

                      <div className="res-chapter-body">
                        {isLocked ? (
                          <div className="res-locked-block">
                            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>This chapter is locked</p>
                            <p>Unlock the full project to read and edit all five chapters.</p>
                            <button onClick={() => setShowPaywall(true)}
                              style={{ padding: '9px 22px', borderRadius: 100, border: 'none',
                                background: 'var(--accent)', color: 'white', fontSize: 14,
                                fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                              Unlock Project →
                            </button>
                          </div>
                        ) : hasContent ? (
                          <>
                              {subsections.length > 0 ? (
                              (() => {
                                // Split content by double newlines into paragraphs
                                const paragraphs = (ch.content || '')
                                  .split(/\n\n+/)
                                  .map(p => p.trim())
                                  .filter(Boolean)

                                // Assign paragraphs to subsections by order
                                const perSection = Math.ceil(paragraphs.length / subsections.length)

                                return subsections.map((sub, subIdx) => {
                                  const start = subIdx * perSection
                                  const chunk = paragraphs.slice(start, start + perSection).join('\n\n')
                                  if (!chunk) return null
                                 return (
                                    <div key={subIdx} id={`subsection-${idx}-${sub}`} className="res-subsection-anchor">
                                      <h3 className="res-subsection-heading">{sub}</h3>
                                      {renderContentWithSources(chunk)}
                                      {!isLocked && (
                                        <UnderstandPanel
                                          sectionTitle={sub}
                                          sectionContent={chunk}
                                          onUpdateParagraph={(newPara) => {
                                            const updatedChapters = result.chapters.map((c, ci) => {
                                              if (ci !== idx) return c
                                              return { ...c, content: c.content.replace(chunk, chunk + '\n\n' + newPara) }
                                            })
                                            const updated = { ...result, chapters: updatedChapters }
                                            setResult(updated)
                                            sessionStorage.setItem('gradelyResult', JSON.stringify(updated))
                                          }}
                                        />
                                      )}
                                    </div>
                                  )
                                })
                              })()
                            ) : (
                              renderContentWithSources(ch.content)
                            )}
                          </>
                        ) : (
                          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            No content yet for this chapter. Go back to Grad to build it.
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 52, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                        <button
                          disabled={idx === 0}
                          onClick={() => setActiveChapter(idx - 1)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            borderRadius: 100, border: '1px solid var(--border)', background: 'transparent',
                            color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)',
                            fontSize: 13, fontFamily: 'Geist, sans-serif', cursor: idx === 0 ? 'default' : 'pointer',
                            opacity: idx === 0 ? 0.4 : 1, transition: 'all 0.15s' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                          Previous
                        </button>
                        <button
                          disabled={idx === result.chapters.length - 1}
                          onClick={() => {
                            const next = idx + 1
                            const nextIsLocked = !paid && result.chapters[next]?.number > 1
                            if (nextIsLocked) { setShowPaywall(true); return }
                            setActiveChapter(next)
                            setExpandedChapters(prev => ({ ...prev, [next]: true }))
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            borderRadius: 100, border: '1px solid var(--border)', background: 'transparent',
                            color: idx === result.chapters.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)',
                            fontSize: 14, fontFamily: 'Geist, sans-serif',
                            cursor: idx === result.chapters.length - 1 ? 'default' : 'pointer',
                            opacity: idx === result.chapters.length - 1 ? 0.4 : 1, transition: 'all 0.15s' }}>
                          Next
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── BREAKDOWN TAB ── */}
            {activeTab === 'breakdown' && (
              <div className="res-doc">
                <div className="res-doc-top-row">
                  <button className="res-doc-back" onClick={() => navigate('/dashboard')}>
                    <ArrowLeftIcon /> Back to dashboard
                  </button>
                  <span className="res-doc-university">
                    {result.projectInfo?.department} · {result.projectInfo?.university}
                  </span>
                </div>
                <p className="res-tab-eyebrow">Defense Prep</p>
                <h1 className="res-tab-title">Student Breakdown</h1>
                <p className="res-tab-sub">Read this the night before your defense. This is your confidence builder.</p>
                <div className="res-tab-divider" />
                {defenseError && (
                  <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 16 }}>{defenseError}</p>
                )}
                {loadingBreakdown ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Generating your breakdown...</p>
                  </div>
                ) : breakdown ? (
                  <div style={{ lineHeight: 1.9, fontSize: 15, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{breakdown}</div>
                ) : (
                  <p style={{ color: 'var(--text-dim)' }}>Loading...</p>
                )}
              </div>
            )}

            {/* ── WEAKNESSES TAB ── */}
            {activeTab === 'weaknesses' && (
              <div className="res-doc">
                <div className="res-doc-top-row">
                  <button className="res-doc-back" onClick={() => navigate('/dashboard')}>
                    <ArrowLeftIcon /> Back to dashboard
                  </button>
                  <span className="res-doc-university">
                    {result.projectInfo?.department} · {result.projectInfo?.university}
                  </span>
                </div>
                <p className="res-tab-eyebrow">Defense Prep</p>
                <h1 className="res-tab-title">Panel Weak Spots</h1>
                <p className="res-tab-sub">These are areas where your panel might challenge you — and how to respond.</p>
                <div className="res-tab-divider" />
                {loadingWeaknesses ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Analysing your project...</p>
                  </div>
                ) : weaknesses ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                      <div style={{ fontSize: 36, fontWeight: 700, color: weaknesses.overallReadiness >= 70 ? 'var(--success)' : '#E8A020', fontFamily: 'Melodrama, serif' }}>
                        {weaknesses.overallReadiness}%
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Defense Readiness</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{weaknesses.readinessComment}</p>
                      </div>
                    </div>
                    {weaknesses.weaknesses.map(w => (
                      <div key={w.id} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--bg-elevated)', border: `1px solid ${w.severity === 'high' ? 'rgba(217,79,79,0.2)' : w.severity === 'medium' ? 'rgba(232,160,32,0.2)' : 'var(--border)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, background: w.severity === 'high' ? 'rgba(217,79,79,0.08)' : w.severity === 'medium' ? 'rgba(232,160,32,0.08)' : 'var(--bg-card)', color: w.severity === 'high' ? 'var(--danger)' : w.severity === 'medium' ? '#E8A020' : 'var(--text-muted)', border: '1px solid currentColor', fontWeight: 600 }}>
                            {w.severity}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{w.area}</span>
                        </div>
                        <p style={{ fontSize: 14, marginBottom: 8, color: 'var(--text)' }}>{w.issue}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                          <strong style={{ color: 'var(--text-dim)' }}>Why they'll ask:</strong> {w.whyItMatters}
                        </p>
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,126,167,0.06)', border: '1px solid rgba(0,126,167,0.15)' }}>
                          <p style={{ fontSize: 13, color: 'var(--accent)' }}>
                            <strong>How to respond:</strong> {w.suggestedResponse}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-dim)' }}>Loading...</p>
                )}
              </div>
            )}

            {/* ── REFERENCES TAB ── */}
            {activeTab === 'references' && (
              <div className="res-doc">
                <div className="res-doc-top-row">
                  <button className="res-doc-back" onClick={() => navigate('/dashboard')}>
                    <ArrowLeftIcon /> Back to dashboard
                  </button>
                  <span className="res-doc-university">
                    {result.projectInfo?.department} · {result.projectInfo?.university}
                  </span>
                </div>
                <p className="res-tab-eyebrow">Project</p>
                <h1 className="res-tab-title">References</h1>
                <p className="res-tab-sub">Academic sources cited in your project.</p>
                <div className="res-tab-divider" />
                {loadingRefs ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <p style={{ color: 'var(--text-muted)' }}>Finding academic sources for your project...</p>
                  </div>
                ) : result.references && result.references.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {result.references.map((ref, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 12, minWidth: 24, paddingTop: 2 }}>{i + 1}.</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', wordBreak: 'break-word' }}>{ref.citation}</p>
                          {ref.url && (
                            <a href={ref.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, display: 'block', wordBreak: 'break-all' }}>
                              {ref.url}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                        The working copy includes inline source markers so you can see where each claim came from.
                      </p>
                      <SpinningButton onClick={() => handleExport(false)} loading={exporting}
                        style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <DownloadIcon /> Download Working Copy
                      </SpinningButton>
                  </div>
                ) : (
                  <div style={{ padding: '24px 0' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>No academic sources were found</p>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      Search <a href="https://scholar.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Google Scholar</a> using your project topic and add references manually before submission.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FLOATING MOBILE ACTIONS (Only visible max-width 768px) ── */}
      <div 
        className="mobile-floating-actions"
        style={{
          // Dynamic bottom margin so it doesn't overlap the publish/unlock bars
          bottom: paid ? '84px' : '110px'
        }}
      >
        <button 
          className="floating-icon-btn"
          onClick={() => paid ? handleExport(true) : setShowPaywall(true)}
          title={paid ? "Download Project" : "Unlock to Download"}
        >
          {paid ? <DownloadIcon /> : <ShieldIcon />}
        </button>
      </div>

      {/* ── PUBLISH BAR ── */}
      {paid && (
        <div className="res-publish-bar">
          <button onClick={handlePublish} disabled={!canPublish} className="res-publish-btn">
            {canPublish ? '📤 Publish to Gallery' : '🔒 Complete all chapters to publish'}
          </button>
        </div>
      )}

      {/* ── UNLOCK BAR ── */}
      {!paid && (
        <div className="res-unlock-bar">
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, fontFamily: 'Geist, sans-serif' }}>
              You're reading Chapter 1 of {totalChapters}.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'Geist, sans-serif' }}>
              Unlock all chapters, defense prep, flashcards, and Word export.
            </p>
          </div>
          <button onClick={() => setShowPaywall(true)} className="res-unlock-btn">
            Unlock Full Project — ₦10,000
          </button>
        </div>
      )}

      {showPaywall && (
        <Paywall projectInfo={result.projectInfo} onUnlock={handleUnlock} userEmail={user?.email} />
      )}
    </>
  )
}
