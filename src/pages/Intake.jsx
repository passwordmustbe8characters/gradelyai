import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateTopics } from '../lib/ai'
import { useAuth } from '../lib/AuthContext'
import { NIGERIAN_UNIVERSITIES, DEPARTMENTS_BY_FACULTY, getAreasForDepartment } from '../lib/universities'
import SearchableSelect from '../components/SearchableSelect'

const STYLE_QUESTIONS = [
  { key: 'q1', question: "In your own words, what problem does your project solve? Explain it like you're telling a friend who knows nothing about it." },
  { key: 'q2', question: "Why did you choose this topic? What made it interesting to you personally?" },
  { key: 'q3', question: "If your project works perfectly, what changes in the real world?" },
  { key: 'q4', question: "How would you explain your methodology or approach to your younger sibling?" },
  { key: 'q5', question: "In one paragraph, summarize your project like you're presenting it to your panel right now." },
]

export default function Intake() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    university: '',
    department: '',
    hasTopic: null,
    topicInput: '',
    areaOfInterest: '',
    topics: [],
    selectedTopic: null,
    hasGuide: null,
    guideContent: '',
    supervisorNotes: '',
    projectType: '',
    builtContext: '',
    githubLink: '',
    styleAnswers: {},
  })

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        update('name', user.name?.split(' ')[0] || '')
        setStep(2)
      }, 0)
    }
  }, [])

  const areas = getAreasForDepartment(form.department)
  const progress = (step / 10) * 100

  const handleGenerateTopics = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await generateTopics(form.department, form.university, form.areaOfInterest)
      update('topics', result.topics)
      setStep(6)
    } catch {
      setError('Failed to generate topics. Check your connection and try again.')
    }
    setLoading(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => update('guideContent', evt.target.result)
    reader.readAsText(file)
  }

  const handleContinue = () => {
  const styleAnswers = form.styleAnswers || {}
  const styleSample = Object.values(styleAnswers).filter(v => v.trim()).join('\n\n')

  sessionStorage.setItem('gradelyProject', JSON.stringify({
    ...form,
    topic: form.hasTopic ? form.topicInput : form.selectedTopic?.title,
    projectType: form.selectedTopic?.type || form.projectType || 'research',
    styleSample,
    guideContent: form.guideContent || ''
  }))

  sessionStorage.removeItem('gradelyPaid')
  sessionStorage.removeItem('gradelyResult')
  sessionStorage.removeItem('gradelyProjectDbId')

  navigate('/generate')
}

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg)' }}>

      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,126,167,0.08) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none', filter: 'blur(40px)' }} />

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'var(--border)', zIndex: 100 }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ position: 'fixed', top: 20, left: 40, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
        <span style={{ fontFamily: 'Melodrama, serif', fontSize: 18, color: 'var(--text)' }}>GradelyAI</span>
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Step 1 — Name */}
        {step === 1 && (
          <StepCard title="First things first" subtitle="What should we call you?">
            <label className="label">Your name</label>
            <input className="input" placeholder="e.g. Chidi"
              value={form.name} onChange={e => update('name', e.target.value)} />
            <StepNav onNext={() => form.name.trim() && setStep(2)} disabled={!form.name.trim()} />
          </StepCard>
        )}

        {/* Step 2 — University */}
        {step === 2 && (
          <StepCard
            title={user ? `Let's build your project, ${form.name}.` : `Good to meet you, ${form.name}.`}
            subtitle="Which university are you in?">
            <label className="label">University</label>
            <SearchableSelect
              options={NIGERIAN_UNIVERSITIES}
              value={form.university}
              onChange={v => update('university', v)}
              placeholder="Search your university..."
            />
            <StepNav onBack={!user ? () => setStep(1) : undefined} onNext={() => form.university && setStep(3)} disabled={!form.university} />
          </StepCard>
        )}

        {/* Step 3 — Department */}
        {step === 3 && (
          <StepCard title="What are you studying?" subtitle="Select your department">
            <label className="label">Department</label>
            <SearchableSelect
              groups={DEPARTMENTS_BY_FACULTY}
              value={form.department}
              onChange={v => update('department', v)}
              placeholder="Search your department..."
            />
            <StepNav onBack={() => setStep(2)} onNext={() => form.department && setStep(4)} disabled={!form.department} />
          </StepCard>
        )}

        {/* Step 4 — Topic or no topic */}
        {step === 4 && (
          <StepCard title="Do you have a topic already?" subtitle="No pressure if you don't — we'll help you pick one">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ChoiceButton active={form.hasTopic === true} onClick={() => { update('hasTopic', true); setStep(5) }}>
                Yes, I have a topic
              </ChoiceButton>
              <ChoiceButton active={form.hasTopic === false} onClick={() => { update('hasTopic', false); setStep(5) }}>
                No, help me choose one
              </ChoiceButton>
            </div>
            <StepNav onBack={() => setStep(3)} hideNext />
          </StepCard>
        )}

        {/* Step 5a — Has topic */}
        {step === 5 && form.hasTopic === true && (
          <StepCard title="What's your topic?" subtitle="Type it in and we'll work with it">
            <label className="label">Your project topic</label>
            <input className="input"
              placeholder="e.g. Design and Implementation of a Fintech App for Rural SMEs in Nigeria"
              value={form.topicInput} onChange={e => update('topicInput', e.target.value)} />
            <label className="label" style={{ marginTop: 20 }}>Project type</label>
            <select className="input" value={form.projectType}
              onChange={e => update('projectType', e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">What kind of project is this?</option>
              <option value="research">Pure Research</option>
              <option value="software">Software / App</option>
              <option value="hardware">Hardware / Circuit</option>
              <option value="mixed">Mixed (Research + Build)</option>
            </select>
            <StepNav onBack={() => setStep(4)}
              onNext={() => form.topicInput.trim() && form.projectType && setStep(7)}
              disabled={!form.topicInput.trim() || !form.projectType} />
          </StepCard>
        )}

        {/* Step 5b — No topic: pick area */}
        {step === 5 && form.hasTopic === false && (
          <StepCard title="What area interests you?" subtitle="Pick an area and we'll generate topic ideas for you">
            <label className="label">Area of interest</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {areas.map(a => (
                <ChoiceButton key={a} active={form.areaOfInterest === a} onClick={() => update('areaOfInterest', a)}>
                  {a}
                </ChoiceButton>
              ))}
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <StepNav onBack={() => setStep(4)} onNext={handleGenerateTopics}
              disabled={!form.areaOfInterest} loading={loading} nextLabel="Generate Topics →" />
          </StepCard>
        )}

        {/* Step 6 — Pick generated topic */}
        {step === 6 && (
          <StepCard title="Pick your topic" subtitle="Each topic comes with a description so you can make an informed choice">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {form.topics.map(t => (
                <div key={t.id} onClick={() => update('selectedTopic', t)}
                  style={{
                    padding: '16px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${form.selectedTopic?.id === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.selectedTopic?.id === t.id ? 'rgba(0,126,167,0.05)' : 'var(--bg-card)',
                    transition: 'all 0.2s', boxShadow: 'var(--shadow)'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4, color: 'var(--text)' }}>{t.title}</p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-elevated)', color: 'var(--text-muted)', whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>
                      {t.type}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.description}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>Difficulty: {t.difficulty}</p>
                </div>
              ))}
            </div>
            <StepNav onBack={() => setStep(5)} onNext={() => form.selectedTopic && setStep(7)} disabled={!form.selectedTopic} />
          </StepCard>
        )}

        {/* Step 7 — Project guide */}
        {step === 7 && (
          <StepCard title="Do you have a project guide?" subtitle="A project manual or guidebook from your department">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ChoiceButton active={form.hasGuide === true} onClick={() => { update('hasGuide', true); setStep(8) }}>
                Yes, I have a project guide
              </ChoiceButton>
              <ChoiceButton active={form.hasGuide === false} onClick={() => { update('hasGuide', false); setStep(9) }}>
                No, use a standard structure
              </ChoiceButton>
            </div>
            <StepNav onBack={() => setStep(form.hasTopic ? 5 : 6)} hideNext />
          </StepCard>
        )}

        {/* Step 8 — Upload guide */}
        {step === 8 && (
          <StepCard title="Upload your project guide" subtitle="Upload a PDF or paste the required sections manually">
            <label className="label">Upload guide (PDF or TXT)</label>
            <input type="file" accept=".pdf,.txt" onChange={handleFileUpload}
              style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }} />
            <label className="label">Or paste your required sections here</label>
            <textarea className="input" rows={6}
              placeholder="Paste chapter titles and subsections from your project guide..."
              value={form.guideContent} onChange={e => update('guideContent', e.target.value)}
              style={{ resize: 'vertical' }} />
            <StepNav onBack={() => setStep(7)} onNext={() => setStep(9)} nextLabel="Continue →" />
          </StepCard>
        )}

        {/* Step 9 — Style capture */}
        {step === 9 && (
          <StepCard
            title="Write in your own voice"
            subtitle="Answer these naturally — like you're talking to a friend. Don't overthink it.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {STYLE_QUESTIONS.map((q, i) => (
                <div key={q.key}>
                  <label className="label" style={{ textTransform: 'none', fontSize: 14, marginBottom: 8, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {i + 1}. {q.question}
                  </label>
                  <textarea className="input" rows={3}
                    placeholder="Write naturally — there's no wrong answer..."
                    value={form.styleAnswers?.[q.key] || ''}
                    onChange={e => update('styleAnswers', { ...form.styleAnswers, [q.key]: e.target.value })}
                    style={{ resize: 'vertical' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,126,167,0.06)', border: '1px solid rgba(0,126,167,0.15)' }}>
              <p style={{ fontSize: 13, color: 'var(--accent)', lineHeight: 1.6 }}>
                <strong>Why we ask this:</strong> Your answers help GradelyAI write your project in your natural voice — so it sounds like you wrote it.
              </p>
            </div>
            <StepNav
              onBack={() => setStep(form.hasGuide ? 8 : 7)}
              onNext={() => {
                const answers = form.styleAnswers || {}
                const filled = Object.values(answers).filter(v => v.trim().length > 20)
                if (filled.length < 3) {
                  alert('Please answer at least 3 questions to help us capture your voice.')
                  return
                }
                setStep(10)
              }}
              nextLabel="Continue →"
            />
          </StepCard>
        )}

        {/* Step 10 — Final details */}
        {step === 10 && (
          <StepCard title="Almost there." subtitle="A few final details to make your project as accurate as possible">
            <label className="label">Any instructions from your supervisor? (optional)</label>
            <textarea className="input" rows={3}
              placeholder="e.g. My supervisor wants the literature review to focus on Nigerian case studies..."
              value={form.supervisorNotes} onChange={e => update('supervisorNotes', e.target.value)}
              style={{ resize: 'vertical', marginBottom: 20 }} />

            {(form.projectType === 'software' || form.projectType === 'hardware' || form.projectType === 'mixed' ||
              form.selectedTopic?.type === 'software' || form.selectedTopic?.type === 'hardware' || form.selectedTopic?.type === 'mixed') && (
              <>
                <label className="label">Tell us what you built (optional but makes chapters 4 & 5 much stronger)</label>
                <textarea className="input" rows={4}
                  placeholder="e.g. I built a web app using React and Node.js. It has a login system, dashboard, and payment integration with Paystack..."
                  value={form.builtContext} onChange={e => update('builtContext', e.target.value)}
                  style={{ resize: 'vertical', marginBottom: 12 }} />
                <label className="label">GitHub repo link (optional)</label>
                <input className="input" placeholder="https://github.com/yourusername/yourrepo"
                  value={form.githubLink} onChange={e => update('githubLink', e.target.value)} />
              </>
            )}

            <button className="btn-primary" onClick={handleContinue}
              style={{ width: '100%', justifyContent: 'center', marginTop: 28, fontSize: 16, padding: '14px' }}>
              Generate My Project →
            </button>
            <button className="btn-ghost" onClick={() => setStep(9)}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              ← Back
            </button>
          </StepCard>
        )}

      </div>
    </div>
  )
}

function StepCard({ title, subtitle, children }) {
  return (
   <div className="card" style={{ padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 32px)', animation: 'fadeUp 0.35s ease' }}>
      <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 26, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15, fontFamily: 'Geist, sans-serif' }}>{subtitle}</p>
      {children}
    </div>
  )
}

function StepNav({ onBack, onNext, disabled, loading, nextLabel = 'Continue →', hideNext = false }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
      {onBack && (
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}>← Back</button>
      )}
      {!hideNext && (
        <button className="btn-primary" onClick={onNext} disabled={disabled || loading}
          style={{ flex: 2, justifyContent: 'center' }}>
          {loading ? 'Generating...' : nextLabel}
        </button>
      )}
    </div>
  )
}

function ChoiceButton({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'rgba(0,126,167,0.06)' : 'var(--bg-card)',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      fontSize: 15, fontWeight: 500, textAlign: 'left',
      transition: 'all 0.2s', fontFamily: 'Geist, sans-serif',
      boxShadow: 'var(--shadow)'
    }}>
      {children}
    </button>
  )
}