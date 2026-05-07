import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProject, updateProject } from '../lib/auth'
import { useAuth } from '../lib/AuthContext'
import {
  humanizeText,
  generateStudentBreakdown,
  generateFlashcards,
  analyzeWeaknesses
} from '../lib/ai'
import { exportToWord } from '../lib/export'
import { isPaid } from '../lib/payment'
import Paywall from '../components/Paywall'


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

function CardsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  )
}

function WandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
      <path d="m14 7 3 3"/>
      <path d="M5 6v4"/>
      <path d="M19 14v4"/>
      <path d="M10 2v2"/>
      <path d="M7 8H3"/>
      <path d="M21 16h-4"/>
      <path d="M11 3H9"/>
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

// ─── SPINNING BUTTON ──────────────────────────────────────────────────────────

function SpinningButton({ onClick, disabled, loading, children, style, className = 'btn-ghost' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{ position: 'relative', ...style }}
    >
      {loading && (
        <svg
          style={{
            position: 'absolute', inset: -2,
            width: 'calc(100% + 4px)', height: 'calc(100% + 4px)',
            borderRadius: 'inherit', pointerEvents: 'none',
            overflow: 'visible',
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            x="1" y="1" width="98" height="98"
            rx="50" ry="50"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="300"
            strokeDashoffset="300"
            style={{ animation: 'strokeRun 1.2s linear infinite' }}
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('project')
  const [activeChapter, setActiveChapter] = useState(0)
  const [humanizing, setHumanizing] = useState(false)
  const [humanized, setHumanized] = useState(false)
  const [breakdown, setBreakdown] = useState('')
  const [weaknesses, setWeaknesses] = useState(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)
  const [loadingWeaknesses, setLoadingWeaknesses] = useState(false)
  const [loadingFlashcards, setLoadingFlashcards] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [paid, setPaid] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
  const saved = sessionStorage.getItem('gradelyResult')
  if (!saved) { navigate('/start'); return }
  setTimeout(() => {
    setResult(JSON.parse(saved))
    setPaid(isPaid())
  }, 0)
}, [])

  const handleHumanize = async () => {
    if (!result) return
    setHumanizing(true)
    try {
      const humanizedChapters = []
      for (const chapter of result.chapters) {
        const content = await humanizeText(chapter.content)
        humanizedChapters.push({ ...chapter, content })
      }
      const updated = { ...result, chapters: humanizedChapters, humanized: true }
      setResult(updated)
      sessionStorage.setItem('gradelyResult', JSON.stringify(updated))
      setHumanized(true)
    } catch {
      alert('Humanization failed. Please try again.')
    }
    setHumanizing(false)
  }

  const handleBreakdown = async () => {
    if (!result || breakdown) return
    setLoadingBreakdown(true)
    try {
      const allText = result.chapters.map(c => c.content).join('\n\n')
      const bd = await generateStudentBreakdown(result.projectInfo, allText)
      setBreakdown(bd)
    } catch {
      alert('Failed to generate breakdown. Please try again.')
    }
    setLoadingBreakdown(false)
  }

  const handleWeaknesses = async () => {
    if (!result || weaknesses) return
    setLoadingWeaknesses(true)
    try {
      const allText = result.chapters.map(c => c.content).join('\n\n')
      const w = await analyzeWeaknesses(result.projectInfo, allText)
      setWeaknesses(w)
    } catch {
      alert('Failed to analyze weaknesses. Please try again.')
    }
    setLoadingWeaknesses(false)
  }

  const handleFlashcards = async () => {
    if (loadingFlashcards) return
    setLoadingFlashcards(true)
    try {
      const allText = result.chapters.map(c => c.content).join('\n\n')
      const cards = await generateFlashcards(result.projectInfo, allText)
      sessionStorage.setItem('gradelyFlashcards', JSON.stringify(cards))
      navigate('/flashcards')
    } catch {
      alert('Failed to generate flashcards. Please try again.')
    }
    setLoadingFlashcards(false)
  }

  const handleExport = async (isClean) => {
    if (!result || exporting) return
    setExporting(true)
    try {
      await exportToWord(result, isClean)
    } catch (err) {
      console.error(err)
      alert('Export failed. Please try again.')
    }
    setExporting(false)
  }

  const handleUnlock = () => {
    setPaid(true)
    setShowPaywall(false)
    navigate('/generate')
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
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 11, padding: '1px 7px', borderRadius: 10, marginLeft: 3,
                background: 'rgba(0,126,167,0.08)', color: 'var(--accent)',
                border: '1px solid rgba(0,126,167,0.2)', cursor: 'pointer',
                textDecoration: 'none', fontWeight: 600, verticalAlign: 'middle',
              }}>
              {label.substring(0, 40)}{label.length > 40 ? '...' : ''}
            </a>
          ) : (
            <span title={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, padding: '1px 7px', borderRadius: 10, marginLeft: 3,
              background: 'var(--bg-elevated)', color: 'var(--text-muted)',
              border: '1px solid var(--border)', verticalAlign: 'middle', fontWeight: 500
            }}>
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

  if (!result) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading your project...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(247,245,240,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
          <span style={{ fontFamily: 'Melodrama, serif', fontSize: 18 }}>GradelyAI</span>
        </div>

        <button className="btn-ghost" 
  onClick={async () => {
    if (!user) { navigate('/auth'); return }
    try {
      await saveProject({
        title: result.projectInfo.topic,
        university: result.projectInfo.university,
        department: result.projectInfo.department,
        project_type: result.projectInfo.projectType,
        status: paid ? 'complete' : 'in_progress',
        is_paid: paid,
        chapters: result.chapters,
        abstract: result.abstract,
        references: result.references,
        structure: result.structure,
        project_info: result.projectInfo,
      })
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to save project: ' + err.message)
    }
  }}
  style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
  Save to Dashboard
</button>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {paid && (
            <>
              <SpinningButton onClick={handleFlashcards} loading={loadingFlashcards} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CardsIcon /> {loadingFlashcards ? 'Generating...' : 'Study Flashcards'}
              </SpinningButton>

              {!humanized ? (
                <SpinningButton onClick={handleHumanize} loading={humanizing} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WandIcon /> {humanizing ? 'Applying...' : 'Personal Voice'}
                </SpinningButton>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100, background: 'rgba(45,155,111,0.1)', border: '1px solid rgba(45,155,111,0.2)', fontSize: 13, color: 'var(--success)' }}>
                  <CheckIcon /> Voice Applied
                </div>
              )}

              <SpinningButton onClick={() => handleExport(true)} loading={exporting} className="btn-primary" style={{ fontSize: 13, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DownloadIcon /> {exporting ? 'Exporting...' : 'Download Project'}
              </SpinningButton>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: paid ? '32px 24px' : '32px 24px 100px 24px', gap: 24, position: 'relative', zIndex: 1 }}>

        {/* Sidebar */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="card" style={{ position: 'sticky', top: 90 }}>
            <p style={{ fontFamily: 'Melodrama, serif', fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.4, color: 'var(--text)' }}>
              {result.projectInfo.topic}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
              {result.projectInfo.department} · {result.projectInfo.university}
            </p>

            <p className="label" style={{ marginBottom: 10 }}>Chapters</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {result.chapters.map((ch, i) => (
                <button key={i}
                  onClick={() => {
                    if (!paid && ch.number > 1) { setShowPaywall(true); return }
                    setActiveTab('project')
                    setActiveChapter(i)
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: 'none',
                    cursor: paid || ch.number === 1 ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    background: activeTab === 'project' && activeChapter === i ? 'rgba(0,126,167,0.08)' : 'transparent',
                    color: activeTab === 'project' && activeChapter === i ? 'var(--accent)' : !paid && ch.number > 1 ? 'var(--text-dim)' : 'var(--text-muted)',
                    fontSize: 13, fontFamily: 'Geist, sans-serif', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    opacity: !paid && ch.number > 1 ? 0.5 : 1
                  }}>
                  <span>Ch {ch.number}: {ch.title.length > 18 ? ch.title.substring(0, 18) + '...' : ch.title}</span>
                  {!paid && ch.number > 1 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {paid && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { key: 'breakdown', label: 'Student Breakdown', icon: <BookIcon /> },
                    { key: 'weaknesses', label: 'Weak Spots', icon: <ShieldIcon /> },
                    { key: 'references', label: 'References', icon: <RefsIcon /> },
                  ].map(t => (
                    <button onMouseEnter={e => {
                    if (activeTab !== t.key) e.currentTarget.style.background = 'var(--bg-elevated)'
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== t.key) e.currentTarget.style.background = 'transparent'
                  }} key={t.key} onClick={()  => {
                      
                      setActiveTab(t.key)
                      if (t.key === 'breakdown') handleBreakdown()
                      if (t.key === 'weaknesses') handleWeaknesses()
                        
                        
                    }}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: activeTab === t.key ? 'rgba(0,126,167,0.08)' : 'transparent',
                        color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 13, fontFamily: 'Geist, sans-serif', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}>
                      <span style={{ color: activeTab === t.key ? 'var(--accent)' : 'var(--text-dim)' }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Project tab */}
          {activeTab === 'project' && result.chapters[activeChapter] && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                    Chapter {result.chapters[activeChapter].number}: {result.chapters[activeChapter].title}
                  </h2>
                  {result.humanized && (
                    <span style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, display: 'block' }}>
                      Personal Voice applied
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeChapter > 0 && paid && (
                    <button className="btn-ghost" onClick={() => setActiveChapter(i => i - 1)} style={{ fontSize: 13 }}>← Prev</button>
                  )}
                  {activeChapter < result.chapters.length - 1 && paid && (
                    <button className="btn-ghost" onClick={() => setActiveChapter(i => i + 1)} style={{ fontSize: 13 }}>Next →</button>
                  )}
                </div>
              </div>
              <div style={{ lineHeight: 1.9, fontSize: 15, color: 'var(--text)' }}>
                {renderContentWithSources(result.chapters[activeChapter].content)}
              </div>
            </div>
          )}

          {/* Breakdown tab */}
          {activeTab === 'breakdown' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: 'var(--accent)' }}><BookIcon /></span>
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                  Student Breakdown
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                Read this the night before your defense. This is your confidence builder.
              </p>
              {loadingBreakdown ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
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

          {/* Weaknesses tab */}
          {activeTab === 'weaknesses' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: 'var(--accent)' }}><ShieldIcon /></span>
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                  Panel Weak Spots
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                These are areas where your panel might challenge you — and how to respond.
              </p>
              {loadingWeaknesses ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Analysing your project...</p>
                </div>
              ) : weaknesses ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
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

          {/* References tab */}
          {activeTab === 'references' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <span style={{ color: 'var(--accent)' }}><RefsIcon /></span>
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                  References
                </h2>
              </div>

              {result.references && result.references.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.references.map((ref, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 12, minWidth: 24, paddingTop: 2 }}>{i + 1}.</span>
                      <div>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{ref.citation}</p>
                        {ref.url && (
                          <a href={ref.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, display: 'block' }}>
                            {ref.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 24 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>No academic sources were found for this topic</p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    We could not find verified academic papers for your specific topic. Your project has been written without inline citations to avoid fake references.
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 12 }}>
                    Search <a href="https://scholar.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Google Scholar</a> using your project topic keywords and add references manually before submission.
                  </p>
                </div>
              )}

              {result.references && result.references.length > 0 && (
                <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Need the version with source notes?</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    The working copy includes inline source markers so you can see where each claim came from.
                  </p>
                  <SpinningButton onClick={() => handleExport(false)} loading={exporting} style={{ fontSize: 13 }}>
                    <DownloadIcon /> Download Working Copy
                  </SpinningButton>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Sticky unlock bar */}
      {!paid && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--text)', color: 'white',
          padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)'
        }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, fontFamily: 'Geist, sans-serif' }}>
              You're reading Chapter 1 of 5.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'Geist, sans-serif' }}>
              Unlock all chapters, defense prep, flashcards, and Word export.
            </p>
          </div>
          <button onClick={() => setShowPaywall(true)} style={{
            background: 'var(--accent)', color: 'white', border: 'none',
            borderRadius: 100, padding: '12px 28px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Geist, sans-serif', whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,126,167,0.4)', transition: 'all 0.2s'
          }}>
            Unlock Full Project — ₦5,000
          </button>
        </div>
      )}

      {showPaywall && (
        <Paywall
          projectInfo={result.projectInfo}
          onUnlock={handleUnlock}
          userEmail={user?.email}
        />
      )}

    </div>
  )
}