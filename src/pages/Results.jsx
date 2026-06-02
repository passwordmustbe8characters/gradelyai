import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { exportToWord } from '../lib/export'
import { isPaid } from '../lib/payment'
import { saveProject, updateProject } from '../lib/auth'
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

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
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
          style={{
            position: 'absolute', inset: -2,
            width: 'calc(100% + 4px)', height: 'calc(100% + 4px)',
            borderRadius: 'inherit', pointerEvents: 'none',
          }}
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <rect x="1" y="1" width="98" height="38" rx="20" ry="20"
            fill="none" stroke="var(--accent)" strokeWidth="2"
            strokeDasharray="280" strokeDashoffset="280"
            style={{ animation: 'strokeRun 1.2s linear infinite' }}
          />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── STABLE TEXT EDITOR TOOLBAR ──────────────────────────────────────────────

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
      // SAFEGUARD 1: If the user is clicking inside our toolbar box to type, 
      // do NOT refresh or close the position. Leave the menu completely alone.
      if (e.target.closest('.gradely-editor-toolbar')) {
        return;
      }

      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (!text || text.length < 5) {
        setVisible(false)
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // FIXED CORRECTION TRACKING: Save raw data
      setSelectedText(text)
      setEditText(text)
      setInstruction('')
      setShowAIInput(false)

      // FIXED POSITIONING MATH: Drop toolbar 12px directly BELOW the text highlight
      // Keeps the workspace clean and anchors right under the student's cursor eye scope
      const optimalY = rect.bottom + window.scrollY + 12;

      setPosition({
        x: rect.left + window.scrollX, // Aligns perfectly with the starting left edge of the highlighted text
        y: optimalY
      })
      setVisible(true)
    }

    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [])

  const handleSave = () => {
    onInstruct(selectedText, null, editText)
    setVisible(false)
  }

  const handleAIRewrite = async () => {
    if (!instruction.trim()) return
    setLoading(true)
    try {
      await onInstruct(selectedText, instruction)
      setVisible(false)
      setShowAIInput(false)
    } catch {
      alert('Failed to apply. Try again.')
    }
    setLoading(false)
  }

  if (!visible) return null

  // Calculate clean clamping offsets so toolbar never runs off the screen borders
  const toolbarWidth = 420
  let leftOffset = position.x - (toolbarWidth / 2)
  leftOffset = Math.min(Math.max(leftOffset, 16), window.innerWidth - toolbarWidth - 16)

  return (
    <>
      {/* Dismiss overlay: Clicking outside the document text blocks cleans up the UI view */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        onMouseDown={() => setVisible(false)}
      />

      {/* Toolbar Window Box Container */}
      <div
        className="gradely-editor-toolbar" // Class trigger flag hooked up to our SAFEGUARD 1 check
        style={{
          position: 'absolute',
          left: leftOffset,
          top: position.y,
          width: toolbarWidth,
          zIndex: 1000,
          background: '#1A1A24',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: 'fadeUp 0.15s ease'
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Paragraph Context Work Area Box */}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: 'Geist, sans-serif' }}>
          Highlight Edit Panel
        </p>
        
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.07)',
            color: 'white',
            fontSize: 13,
            fontFamily: 'Geist, sans-serif',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.6,
            minHeight: 65,
            marginBottom: 10,
          }}
        />

        {showAIInput && (
          <textarea
            autoFocus
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Tell the AI what to change about this sentence..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 9,
              border: '1px solid rgba(0,126,167,0.4)',
              background: 'rgba(0,126,167,0.08)',
              color: 'white',
              fontSize: 13,
              fontFamily: 'Geist, sans-serif',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.6,
              minHeight: 60,
              marginBottom: 10,
            }}
          />
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleSave}
            disabled={editText === selectedText && !showAIInput}
            style={{
              padding: '8px 14px',
              borderRadius: 8, border: 'none',
              background: '#2D9B6F',
              color: 'white', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'Geist, sans-serif',
              opacity: editText === selectedText && !showAIInput ? 0.4 : 1,
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            Save Edit
          </button>

          {!showAIInput ? (
            <button
              onClick={() => setShowAIInput(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 8, border: 'none',
                background: '#007EA7',
                color: 'white', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                fontFamily: 'Geist, sans-serif',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
              AI Rewrite
            </button>
          ) : (
            <button
              onClick={handleAIRewrite}
              disabled={!instruction.trim() || loading}
              style={{
                padding: '8px 14px',
                borderRadius: 8, border: 'none',
                background: '#007EA7',
                color: 'white', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                fontFamily: 'Geist, sans-serif',
                opacity: !instruction.trim() || loading ? 0.5 : 1,
                transition: 'all 0.15s'
              }}>
              {loading ? 'Rewriting...' : 'Apply Rewrite →'}
            </button>
          )}

          <button
            onClick={() => setVisible(false)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: 13,
              fontFamily: 'Geist, sans-serif',
              marginLeft: 'auto'
            }}>
            Close
          </button>
        </div>
      </div>
    </>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

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
    if (!result) return;
    setHumanizing(true);
    
    try {
      // Point explicitly to the Railway backend
      const BASE_URL = import.meta.env.VITE_API_URL || '';
      const humanizedChapters = [];
      
      for (const chapter of result.chapters) {
        const response = await fetch(`${BASE_URL}/api/humanize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: chapter.content })
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Humanization API failed");
        }

        humanizedChapters.push({ ...chapter, content: data.data });
      }
      
      const updated = { ...result, chapters: humanizedChapters, humanized: true };
      setResult(updated);
      sessionStorage.setItem('gradelyResult', JSON.stringify(updated));
      setHumanized(true);
      alert('🎉 Your entire project has been fully humanized successfully!');
      
    } catch (err) {
      console.error("Humanize Error:", err);
      alert('Humanization failed. Please check your console for details and try again.');
    } finally {
      setHumanizing(false);
    }
  }

 const loadUnifiedDefensePrepData = async () => {
    // If analytical frameworks are already loaded in state, skip network calls
    if (breakdown || weaknesses) return;

    setLoadingBreakdown(true);
    setLoadingWeaknesses(true);

    try {
      const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId');
      const token = localStorage.getItem('token');
      
      if (!projectId) return;

      const response = await fetch(`/api/projects/${projectId}/defense-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();

      if (resData.success) {
        setBreakdown(resData.data.breakdown);
        setWeaknesses(resData.data.weaknesses);
        // Cache flashcard assets inside temporary session blocks for the flashcard matching view
        sessionStorage.setItem('gradelyFlashcards', JSON.stringify(resData.data.flashcards));
      } else {
        throw new Error(resData.error);
      }
    } catch (err) {
      console.error("Defense synchronization failure:", err);
      alert("Could not load defense preparation data. Please verify your payment or account status.");
    } finally {
      setLoadingBreakdown(false);
      setLoadingWeaknesses(false);
    }
  };

  const handleFlashcards = async () => {
    if (loadingFlashcards) return;
    setLoadingFlashcards(true);
    
    try {
      // Check if the flashcards were already generated and cached in the background
      let cards = sessionStorage.getItem('gradelyFlashcards');
      
      // If they haven't been generated yet, fire our unified backend compiler!
      if (!cards) {
        await loadUnifiedDefensePrepData();
      }
      
      // Once data is secured in session storage, instantly route the user to the study view
      navigate('/flashcards');
      
    } catch (err) {
      console.error(err);
      alert('Failed to load flashcards. Please try again.');
    } finally {
      setLoadingFlashcards(false);
    }
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

  const handleSave = async () => {
    if (!user) { navigate('/auth'); return }
    try {
      const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
      if (projectId) {
        await updateProject(projectId, {
          status: paid ? 'complete' : 'in_progress',
          is_paid: paid,
          chapters: result.chapters,
          abstract: result.abstract,
          references: result.references,
          project_info: result.projectInfo,
        })
      } else {
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
      }
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
  }

  const handleUnlock = async () => {
    setPaid(true)
    setShowPaywall(false)

    sessionStorage.setItem('gradelyPaid', JSON.stringify({
      paid: true,
      timestamp: Date.now()
    }))

    const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
    if (projectId && user) {
      try {
        await updateProject(projectId, { is_paid: true })
      } catch (err) {
        console.error('Failed to mark as paid:', err)
      }
    }

    sessionStorage.setItem('gradely_continue_from', '2')
    sessionStorage.setItem('gradely_existing_chapters', JSON.stringify(result.chapters))

    navigate('/generate')
  }

  const handleTextInstruct = async (selectedText, instruction, manualEdit) => {
    let targetNewText = "";

    if (manualEdit !== undefined) {
      targetNewText = manualEdit;
    } else {
      try {
        const response = await fetch('/api/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: `Supervisor Correction Request: Please alter this specific selection: "${selectedText}". Follow this user instruction: ${instruction}` 
          })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        targetNewText = data.data;
      } catch (err) {
        console.error("Supervisor rewrite exception:", err);
        alert("Failed to apply correction context safely.");
        return;
      }
    }

    // Apply text changes inside local state array
    const updatedChapters = result.chapters.map((ch, i) => {
      if (i === activeChapter) {
        return { ...ch, content: ch.content.replace(selectedText, targetNewText) }
      }
      return ch
    });

    const updatedResultPayload = { ...result, chapters: updatedChapters };
    setResult(updatedResultPayload);
    sessionStorage.setItem('gradelyResult', JSON.stringify(updatedResultPayload));

    // BACKGROUND SYNC: Instantly persist modifications into SQLite storage rows
    const projectId = result.dbProjectId || sessionStorage.getItem('gradelyProjectDbId');
    if (projectId) {
      try {
        const token = localStorage.getItem('token'); // Retrieve user authorization token context
        await fetch(`/api/projects/${projectId}/persist-chapters`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ chapters: updatedChapters })
        });
      } catch (saveErr) {
        console.error("Failed to automatically synchronize edits to server database:", saveErr);
      }
    }
  };

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
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => navigate('/')}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
          <span style={{ fontFamily: 'Melodrama, serif', fontSize: 18 }}>GradelyAI</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={handleSave}
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SaveIcon /> Save to Dashboard
          </button>

                    <button className="btn-ghost" onClick={() => navigate('/build')} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Grad
          </button>

          {paid && (
            <>
              <SpinningButton onClick={handleFlashcards} loading={loadingFlashcards}
                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CardsIcon /> {loadingFlashcards ? 'Generating...' : 'Study Flashcards'}
              </SpinningButton>

              {!humanized ? (
                <SpinningButton onClick={handleHumanize} loading={humanizing}
                  style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WandIcon /> {humanizing ? 'Applying...' : 'Personal Voice'}
                </SpinningButton>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100, background: 'rgba(45,155,111,0.1)', border: '1px solid rgba(45,155,111,0.2)', fontSize: 13, color: 'var(--success)' }}>
                  <CheckIcon /> Voice Applied
                </div>
              )}

              <SpinningButton onClick={() => handleExport(true)} loading={exporting}
                className="btn-primary"
                style={{ fontSize: 13, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DownloadIcon /> {exporting ? 'Exporting...' : 'Download Project'}
              </SpinningButton>
            </>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'flex', flex: 1,
        maxWidth: 1200, margin: '0 auto', width: '100%',
        padding: paid ? '32px 24px' : '32px 24px 100px 24px',
        gap: 24, position: 'relative', zIndex: 1
      }}>

        {/* Sidebar — desktop only */}
        <div style={{ width: 240, flexShrink: 0 }} className="hide-mobile">
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
                  }}
                  onMouseEnter={e => { if (!(activeTab === 'project' && activeChapter === i)) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { if (!(activeTab === 'project' && activeChapter === i)) e.currentTarget.style.background = 'transparent' }}>
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
                    <button key={t.key}
                      onClick={() => {
  setActiveTab(t.key);
  if (t.key === 'breakdown' || t.key === 'weaknesses') loadUnifiedDefensePrepData();
                      }}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        background: activeTab === t.key ? 'rgba(0,126,167,0.08)' : 'transparent',
                        color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 13, fontFamily: 'Geist, sans-serif', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                      onMouseEnter={e => { if (activeTab !== t.key) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseLeave={e => { if (activeTab !== t.key) e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ color: activeTab === t.key ? 'var(--accent)' : 'var(--text-dim)' }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="show-mobile" style={{
          position: 'fixed', bottom: paid ? 0 : 80, left: 0, right: 0,
          background: 'rgba(247,245,240,0.96)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)', zIndex: 40,
          display: 'flex', overflowX: 'auto', padding: '8px 16px', gap: 8
        }}>
          {result.chapters.map((ch, i) => (
            <button key={i}
              onClick={() => {
                if (!paid && ch.number > 1) { setShowPaywall(true); return }
                setActiveTab('project')
                setActiveChapter(i)
              }}
              style={{
                padding: '8px 14px', borderRadius: 20, border: 'none',
                background: activeTab === 'project' && activeChapter === i ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeTab === 'project' && activeChapter === i ? 'white' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'Geist, sans-serif', opacity: !paid && ch.number > 1 ? 0.4 : 1,
                flexShrink: 0
              }}>
              Ch {ch.number}
            </button>
          ))}
          {paid && (
            <>
              {[
                { key: 'breakdown', label: 'Breakdown' },
                { key: 'weaknesses', label: 'Weak Spots' },
                { key: 'references', label: 'References' },
              ].map(t => (
                <button key={t.key}
                  onClick={() => {
      setActiveTab(t.key)
      if (t.key === 'breakdown' || t.key === 'weaknesses') loadUnifiedDefensePrepData();
    }}
                  style={{
                    padding: '8px 14px', borderRadius: 20, border: 'none',
                    background: activeTab === t.key ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: activeTab === t.key ? 'white' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'Geist, sans-serif', flexShrink: 0
                  }}>
                  {t.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Project tab */}
          {activeTab === 'project' && result.chapters[activeChapter] && (
            <div>
              {/* Sticky chapter bar */}
              <div style={{
                position: 'sticky', top: 65, zIndex: 9,
                background: 'rgba(247,245,240,0.95)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)', padding: '14px 24px',
                marginBottom: 0, borderRadius: '16px 16px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, flexWrap: 'wrap',
              }}>
                <div>
                  <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                    Chapter {result.chapters[activeChapter].number}: {result.chapters[activeChapter].title}
                  </h2>
                  {result.humanized && (
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>Personal Voice applied</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeChapter > 0 && paid && (
                    <button className="btn-ghost" onClick={() => setActiveChapter(i => i - 1)}
                      style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Prev
                    </button>
                  )}
                  {activeChapter < result.chapters.length - 1 && paid && (
                    <button className="btn-ghost" onClick={() => setActiveChapter(i => i + 1)}
                      style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Next
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Chapter content */}
              <div className="card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', position: 'relative' }}>
                <TextEditor onInstruct={handleTextInstruct} />
                <div style={{ lineHeight: 1.9, fontSize: 15, color: 'var(--text)', userSelect: 'text' }}>
                  {renderContentWithSources(result.chapters[activeChapter].content)}
                </div>
              </div>
            </div>
          )}

          {/* Breakdown tab */}
          {activeTab === 'breakdown' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: 'var(--accent)' }}><BookIcon /></span>
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Student Breakdown</h2>
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
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Panel Weak Spots</h2>
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
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>References</h2>
              </div>

              {result.references && result.references.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.references.map((ref, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 12, minWidth: 24, paddingTop: 2 }}>{i + 1}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{ref.citation}</p>
                        {ref.url && (
                          <a href={ref.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, display: 'block', wordBreak: 'break-all' }}>
                            {ref.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 24 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>No academic sources were found</p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Search <a href="https://scholar.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Google Scholar</a> using your project topic and add references manually before submission.
                  </p>
                </div>
              )}

              {result.references && result.references.length > 0 && (
                <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Need the version with source notes?</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    The working copy includes inline source markers so you can see where each claim came from.
                  </p>
                  <SpinningButton onClick={() => handleExport(false)} loading={exporting}
                    style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
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
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
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
            borderRadius: 100, padding: '12px 24px', fontSize: 15, fontWeight: 600,
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