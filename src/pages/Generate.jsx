import { saveProject, updateProject, getToken } from '../lib/auth'
import { saveResultToSession } from '../lib/sessionResult'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateProjectStructure,
  generateChapter,
  generateAbstract,
  generateReferences,
  fetchRealPapers,
  analyzeWritingStyle,
} from '../lib/ai'
import logoPrimary from '../assets/primary-logo.png';

export default function Generate() {
  const navigate = useNavigate()
  const [structure, setStructure] = useState(null)
  const [chapters, setChapters] = useState([])
  const [currentChapter, setCurrentChapter] = useState(0)
  const [status, setStatus] = useState('init')
  const [error, setError] = useState('')
  const [log, setLog] = useState([])
  const hasStarted = useRef(false)
  const [isPaidUser, setIsPaidUser] = useState(false)
  const [, setDbProjectId] = useState(null)
  
  const addLog = (msg) => setLog(l => [...l, msg])
  const logRef = useRef(null)

  const startGeneration = async (info) => {
  try {
    const continueFrom = sessionStorage.getItem('gradely_continue_from')
    const existingChaptersRaw = sessionStorage.getItem('gradely_existing_chapters')
    const isContinuing = continueFrom && existingChaptersRaw

    let styleProfile = null
    if (info.styleSample && info.styleSample.trim().length > 50) {
      addLog('Capturing your writing voice...')
      styleProfile = await analyzeWritingStyle(info.styleSample)
      if (styleProfile) addLog('✓ Your voice has been captured.')
    }

    const enrichedInfo = { ...info, styleProfile }

    setStatus('structuring')
    addLog('Analysing your project details...')
    const struct = await generateProjectStructure(enrichedInfo)

    // Clean structure — keep diagramType/children/paragraphs, they're what
    // the structure editor's diagram flags and supporting paragraphs ride in on
    struct.chapters = struct.chapters.map(ch => ({
      number: ch.number,
      title: ch.title,
      paragraphs: ch.paragraphs || [],
      subsections: ch.subsections.map(s => ({
        number: s.number,
        title: s.title,
        diagramType: s.diagramType || null,
        children: (s.children || []).map(c => ({
          number: c.number,
          title: c.title,
          diagramType: c.diagramType || null
        }))
      }))
    }))

    setStructure(struct)
    addLog(`Structure ready — ${struct.chapters.length} chapters mapped out.`)

    addLog('Sourcing academic references for your project...')
    const realPapers = await fetchRealPapers(enrichedInfo.topic, enrichedInfo.department)
    if (realPapers.length > 0) {
      addLog('✓ Academic sources ready.')
    } else {
      addLog('⚠️ No external sources found. Project will be generated without inline citations.')
    }

    const paid = sessionStorage.getItem('gradelyPaid')
    const paidStatus = paid ? JSON.parse(paid).paid : false
    setIsPaidUser(paidStatus)

    setStatus('generating')

    // If continuing after payment, start from existing chapters
    let generatedChapters = []
    if (isContinuing) {
      generatedChapters = JSON.parse(existingChaptersRaw)
      setChapters(generatedChapters)
      addLog(`✓ Chapter 1 already complete. Continuing from Chapter ${continueFrom}...`)
      sessionStorage.removeItem('gradely_continue_from')
      sessionStorage.removeItem('gradely_existing_chapters')
    }

    const startFromIndex = isContinuing ? parseInt(continueFrom) - 1 : 0
    const chaptersToGenerate = paidStatus
      ? struct.chapters.slice(startFromIndex)
      : [struct.chapters[0]]

    let projectId = sessionStorage.getItem('gradelyProjectDbId')

    // Only create new project if not continuing
    if (!isContinuing && !projectId && getToken()) {
      try {
        const saved = await saveProject({
          title: enrichedInfo.topic,
          university: enrichedInfo.university,
          department: enrichedInfo.department,
          project_type: enrichedInfo.projectType,
          status: 'in_progress',
          is_paid: paidStatus,
          chapters: generatedChapters,
          abstract: '',
          references: [],
          structure: struct,
          project_info: enrichedInfo,
        })
        projectId = saved.id
        setDbProjectId(saved.id)
        sessionStorage.setItem('gradelyProjectDbId', saved.id)
      } catch (err) {
        console.error('Failed to create project in DB:', err)
      }
    }

    for (let i = 0; i < chaptersToGenerate.length; i++) {
      const chapter = chaptersToGenerate[i]
      const chapterIndex = struct.chapters.findIndex(c => c.number === chapter.number)
setCurrentChapter(chapterIndex)
      addLog(`Writing Chapter ${chapter.number}: ${chapter.title}...`)

      const content = await generateChapter(
        { chapter, realPapers },
        { ...enrichedInfo, referenceStyle: struct.referenceStyle }
      )

      // Diagrams are no longer auto-generated here — generating one takes a
      // real AI call per flagged section and was failing silently with no way
      // for the student to fix a bad result. Instead, diagram generation is
      // now a manual action from the "Understand this section" panel, so the
      // student can review/adjust the section first and trigger it on demand.
      generatedChapters.push({ ...chapter, content, diagrams: [] })
      setChapters(prev => [...prev, { ...chapter, content, diagrams: [] }])
      addLog(`✓ Chapter ${chapter.number} done.`)

      if (projectId && getToken()) {
        try {
          await updateProject(projectId, {
            chapters: generatedChapters,
            status: 'in_progress',
          })
        } catch (err) {
          console.error('Failed to auto-save chapter:', err)
        }
      }
    }

    addLog('Writing abstract...')
    const allText = generatedChapters.map(c => c.content).join('\n\n')
    const abstract = await generateAbstract(enrichedInfo, allText)
    addLog('✓ Abstract done.')

    addLog('Compiling references...')
    const refs = await generateReferences(enrichedInfo, realPapers)
    addLog('✓ References compiled.')

    const resultData = {
      projectInfo: enrichedInfo,
      structure: struct,
      chapters: generatedChapters,
      abstract,
      references: refs.references,
      isPaidUser: paidStatus,
      dbProjectId: projectId,
    }

    saveResultToSession(resultData)

    if (projectId && getToken()) {
      try {
        await updateProject(projectId, {
          status: paidStatus ? 'complete' : 'in_progress',
          is_paid: paidStatus,
          chapters: generatedChapters,
          abstract,
          references: refs.references,
        })
      } catch (err) {
        console.error('Failed to final-save:', err)
      }
    }

    setStatus('done')
    addLog(paidStatus
      ? '🎉 Your full project is ready!'
      : '✓ Chapter 1 is ready. Unlock the full project to continue.')

  } catch (err) {
    setStatus('error')
    setError(err.message || 'Something went wrong. Please try again.')
  }
}

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const saved = sessionStorage.getItem('gradelyProject')
    if (!saved) {
      navigate('/start')
      return
    }

    const info = JSON.parse(saved)
    setTimeout(() => startGeneration(info), 0)
  }, [])

  useEffect(() => {
  if (logRef.current) {
    logRef.current.scrollTop = logRef.current.scrollHeight
  }
}, [log])

  const totalChapters = 5

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none' }} />

      <div style={{ position: 'fixed', top: 20, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={logoPrimary} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
      </div>

   <div className="container" style={{ maxWidth: 600 }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
           {status === 'done'
           ? isPaidUser ? 'Your Project is Ready.' : 'Chapter 1 is Ready.'
              : 'Building Your Project...'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
           {status === 'done'
            ? isPaidUser
              ? 'Your complete final year project has been generated.'
              : 'Chapter 1 is done. Unlock the full project to generate all 5 chapters.'
            : 'Sit tight. Do not close this tab.'}
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <p className="label" style={{ marginBottom: 16 }}>Chapter Progress</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(structure?.chapters || Array.from({ length: 5 }, (_, i) => ({ number: i + 1, title: `Chapter ${i + 1}` }))).map((ch, i) => {
  const isDone = chapters.some(c => c.number === ch.number)
  const isGenerating = status === 'generating' && i === currentChapter && !isDone

  return (
    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: isDone ? 'var(--text)' : 'var(--text-muted)' }}>
        Chapter {ch.number}: {ch.title}
      </span>
      <span className={`chapter-pill ${isDone ? 'done' : isGenerating ? 'generating' : 'pending'}`}>
        {isDone ? '✓ Done' : isGenerating ? '⟳ Writing...' : 'Pending'}
      </span>
    </div>
  )
})}
          </div>

          <div style={{ marginTop: 20, height: 4, background: 'var(--border)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2, background: 'var(--accent)',
              width: `${Math.min((chapters.length / totalChapters) * 100, 100)}%`,
              transition: 'width 0.5s ease'
            }} />
          </div>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, textAlign: 'right' }}>
          {Math.min(chapters.length, totalChapters)} of {totalChapters} chapters
        </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <p className="label" style={{ marginBottom: 12 }}>Live Updates</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {log.length === 0 && (
              <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Starting up...</p>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', minWidth: 20 }}>{i + 1}.</span>
                <span style={{ color: i === log.length - 1 ? 'var(--text)' : 'var(--text-muted)' }}>{entry}</span>
              </div>
            ))}
          </div>
        </div>

        {status === 'error' && (
          <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 24 }}>
            <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>
            <button className="btn-ghost" onClick={() => navigate('/start')} style={{ marginTop: 12, fontSize: 13 }}>
              ← Start Over
            </button>
          </div>
        )}

        {status === 'done' && (
          <button className="btn-primary" onClick={() => navigate('/results')}
            style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '16px' }}>
            View My Complete Project →
          </button>
        )}

        {status !== 'done' && status !== 'error' && (
          <div style={{ textAlign: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              GradelyAI is writing your project. Each chapter takes 30–60 seconds.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}