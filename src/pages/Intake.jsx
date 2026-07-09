import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateTopics, generateAreas } from '../lib/ai'
import { useAuth } from '../lib/AuthContext'
import { NIGERIAN_UNIVERSITIES, DEPARTMENTS_BY_FACULTY } from '../lib/universities'
import SearchableSelect from '../components/SearchableSelect'
import logoPrimary from '../assets/primary-logo.png';
import { getToken } from '../lib/auth'

export default function Intake() {
  const navigate = useNavigate()
  const { user, markOnboarded } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatingProject, setGeneratingProject] = useState(false) // New: for final generation loading
  const [error, setError] = useState('')
  // const [isNewProject, setIsNewProject] = useState(mode === 'new_project')
  const [skipToTopic, setSkipToTopic] = useState(mode === 'new_project')
  const [dynamicAreas, setDynamicAreas] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [projectPhotos, setProjectPhotos] = useState([])
const [photoPreviewUrls, setPhotoPreviewUrls] = useState([])

  const [form, setForm] = useState({
    name: '',
    guideFound: '',
    ragGuideContent: '',
    university: '',
    department: '',
    hasTopic: null,
    topicInput: '',
    areaOfInterest: '',
    topicImagination: '',
    topics: [],
    selectedTopic: null,
    hasGuide: null,
    guideContent: '',
    supervisorNotes: '',
    projectType: '',
    builtContext: '',
    githubLink: '',
    styleAnswers: {},
    supervisorName: '',
  })

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const fetchGuideFromDB = async (university, department) => {
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${BASE_URL}/api/guides?university=${encodeURIComponent(university)}&department=${encodeURIComponent(department)}`)
      const data = await res.json()
      if (data.guides && data.guides.length > 0) {
        return data.guides[0]
      }
      return null
    } catch {
      return null
    }
  }

  // // ─── SAVE PROJECT TO DATABASE ─────────────────────────────────────────────
  // const saveProjectToDb = async (projectData) => {
  //   try {
  //     const token = localStorage.getItem('gradelyToken')
  //     if (!token) {
  //       console.warn('No token found, skipping DB save')
  //       return null
  //     }

  //     const res = await fetch('/api/projects', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         title: projectData.topic || 'Untitled Project',
  //         university: projectData.university || '',
  //         department: projectData.department || '',
  //         project_type: projectData.projectType || 'research',
  //         status: 'in_progress',
  //         is_paid: false,
  //         chapters: [],
  //         abstract: '',
  //         references: [],
  //         structure: projectData.structure || {},
  //         project_info: {
  //           topic: projectData.topic || '',
  //           supervisorName: projectData.supervisorName || '',
  //           supervisorNotes: projectData.supervisorNotes || '',
  //           projectType: projectData.projectType || 'research',
  //           university: projectData.university || '',
  //           department: projectData.department || '',
  //           builtContext: projectData.builtContext || '',
  //           githubLink: projectData.githubLink || '',
  //           guideContent: projectData.guideContent || '',
  //         }
  //       })
  //     })

  //     const data = await res.json()
  //     if (res.ok) {
  //       console.log('✅ Project saved to database with ID:', data.project?.id)
  //       return data.project
  //     } else {
  //       console.warn('Failed to save project:', data.error)
  //       return null
  //     }
  //   } catch (err) {
  //     console.error('Error saving project:', err)
  //     return null
  //   }
  // }

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const mode = params.get('mode')
      
      if (mode === 'new_project') {
        // setIsNewProject(true)
        setSkipToTopic(true)
        
        if (user) {
          update('name', user.name?.split(' ')[0] || '')
          const loadExisting = async () => {
            try {
              const { fetchProjects } = await import('../lib/auth')
              const projects = await fetchProjects()
              if (projects && projects.length > 0) {
                const existing = projects[0]
                update('university', existing.university)
                update('department', existing.department)
                setStep(4)
              } else {
                setStep(4)
              }
            } catch {
              setStep(4)
            }
          }
          loadExisting()
        }
      } else if (user) {
        update('name', user.name?.split(' ')[0] || '')
        setStep(2)
      }
    }, 0)
    
    return () => clearTimeout(timer)
  }, [user])

  // Fetch dynamic areas when department changes
  useEffect(() => {
    const fetchAreas = async () => {
      if (!form.department || !form.university) {
        setDynamicAreas([])
        return
      }
      setAreasLoading(true)
      setError('')
      try {
        const areas = await generateAreas(form.department, form.university)
        setDynamicAreas(areas)
      } catch (err) {
        console.error('Failed to load areas:', err)
        setError('Could not load areas. Please try selecting a department again.')
        const { getAreasForDepartment } = await import('../lib/universities')
        const fallback = getAreasForDepartment(form.department)
        setDynamicAreas(fallback)
      }
      setAreasLoading(false)
    }

    if (form.department && step >= 3) {
      fetchAreas()
    }
  }, [form.department, form.university, step])

  const progress = (step / 10) * 100

  const handleGenerateTopics = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await generateTopics(
        form.department,
        form.university,
        form.areaOfInterest,
        form.topicImagination  // ← new param
      )
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

  // ─── UPDATED: Generate Project with Loading Screen ───────────────────────
  const handlePhotoSelect = (e) => {
  const files = Array.from(e.target.files).slice(0, 5)
  setProjectPhotos(files)
  const previews = files.map(f => URL.createObjectURL(f))
  setPhotoPreviewUrls(previews)
}

const removePhoto = (index) => {
  setProjectPhotos(prev => prev.filter((_, i) => i !== index))
  setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
}
 const handleContinue = async () => {
    if (!form.supervisorName.trim()) {
      setError('Please enter your supervisor\'s full name.')
      return
    }
    setGeneratingProject(true)
    setError('')

    try {
      const topic = form.hasTopic ? form.topicInput : form.selectedTopic?.title
      if (!topic) {
        setError('Please select or enter a topic before continuing.')
        setGeneratingProject(false)
        return
      }

      const projectInfo = {
        topic,
        projectType: form.selectedTopic?.type || form.projectType || 'research',
        university: form.university,
        department: form.department,
        supervisorName: form.supervisorName,
        supervisorNotes: form.supervisorNotes || '',
        githubLink: form.githubLink || '',
        builtContext: form.builtContext || '',
        guideContent: form.guideContent || '',
        ragGuideContent: form.ragGuideContent || '',
        hasGuide: form.hasGuide,
        studentName: user?.name || form.name || '',
      }

      // Upload hardware photos to Cloudinary if any were selected
      if (projectPhotos && projectPhotos.length > 0) {
        try {
          const formData = new FormData()
          projectPhotos.forEach(f => formData.append('photos', f))
          const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload/photos`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
          })
          const uploadData = await uploadRes.json()
          if (uploadData.success) projectInfo.photos = uploadData.urls
        } catch (err) {
          console.error('Photo upload failed, continuing without photos:', err)
        }
      }

      // Save to sessionStorage — generate page reads this
      sessionStorage.setItem('gradelyProject', JSON.stringify(projectInfo))

      // Clear any stale session data from previous projects
      sessionStorage.removeItem('gradelyResult')
      sessionStorage.removeItem('gradelyProjectDbId')
      sessionStorage.removeItem('gradelyChatHistory')
      sessionStorage.removeItem('gradelyCompletedSections')
      sessionStorage.removeItem('gradelySectionIndex')

      if (!user?.onboarded) {
        try { await markOnboarded() } catch (e) { console.error(e) }
      }

      navigate('/generate')

    } catch (err) {
      console.error('Failed to start project generation:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setGeneratingProject(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg)' }}>

      {/* ─── LOADING SCREEN ─────────────────────────────────────────────────── */}
      {generatingProject && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)',
          animation: 'fadeUp 0.3s ease'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTop: '2px solid var(--accent)',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 24
          }} />
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 26, color: 'var(--text)', marginBottom: 8 }}>
            Grad is building your project...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Generating your chapter structure and saving your project.
          </p>
          <div style={{
            marginTop: 32, width: 200, height: 2,
            background: 'var(--border)', borderRadius: 2, overflow: 'hidden'
          }}>
            <div style={{
              width: '40%', height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
              animation: 'shimmer 1.2s infinite',
              borderRadius: 2
            }} />
          </div>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,126,167,0.08) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none', filter: 'blur(40px)' }} />

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'var(--border)', zIndex: 100 }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.4s ease' }} />
      </div>

    <div style={{ position: 'fixed', top: 20, left: 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
  <img src={logoPrimary} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
</div>

      <div className="container" style={{ maxWidth: 560 }}>

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
        {step === 2 && !skipToTopic && (
          <StepCard
            title={user ? (
              <>
                Let's build your project,{' '}
                <span style={{ color: 'var(--accent)' }}>{form.name}</span>.
              </>
            ) : (
              `Good to meet you, ${form.name}.`
            )}
            subtitle="Which university are you in?"
          >
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
        {step === 3 && !skipToTopic && (
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

        {/* Step 5b — No topic: pick area + imagination */}
        {step === 5 && form.hasTopic === false && (
          <StepCard title="What area interests you?" subtitle="Pick an area and we'll suggest great topics for you">

            {/* Free text imagination field */}
            <label className="label">What kind of project do you have in mind? (optional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. I want to build something that helps farmers track their harvest, or I'm interested in cybersecurity and mobile apps..."
              value={form.topicImagination}
              onChange={e => update('topicImagination', e.target.value)}
              style={{ resize: 'vertical', minHeight: 80, fontFamily: 'Geist, sans-serif' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, marginBottom: 20 }}>
              Even a rough idea helps Grad suggest more relevant topics.
            </p>

            {/* Area chips */}
            <label className="label">Then pick your area of interest</label>
            {areasLoading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                Loading areas for {form.department}...
              </p>
            ) : dynamicAreas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No areas available. Please go back and select a department.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {dynamicAreas.map(a => (
                  <button
                    key={a}
                    onClick={() => update('areaOfInterest', a)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `1.5px solid ${form.areaOfInterest === a ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.areaOfInterest === a ? 'rgba(0,126,167,0.08)' : 'var(--bg-card)',
                      color: form.areaOfInterest === a ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: form.areaOfInterest === a ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                      transition: 'all 0.15s'
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}

            {/* Project type — shown after area is selected */}
            {form.areaOfInterest && (
              <div style={{ marginTop: 20 }}>
                <label className="label">What type of project do you want to do?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                  {[
                    { value: 'software', label: '💻 Software', desc: 'App, system, or platform' },
                    { value: 'hardware', label: '🔧 Hardware', desc: 'Physical device or circuit' },
                    { value: 'research', label: '📄 Research', desc: 'Survey, analysis, or study' },
                    { value: 'mixed', label: '⚡ Mixed', desc: 'Software + Hardware' },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => update('projectType', value)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `1.5px solid ${form.projectType === value ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.projectType === value ? 'rgba(0,126,167,0.08)' : 'var(--bg-card)',
                        color: form.projectType === value ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 13,
                        fontWeight: form.projectType === value ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'Geist, sans-serif',
                        textAlign: 'left',
                        minWidth: 120,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <StepNav
              onBack={() => setStep(4)}
              onNext={handleGenerateTopics}
              disabled={!form.areaOfInterest || !form.projectType || areasLoading}
              loading={loading || areasLoading}
              nextLabel="Generate Topics →"
            />
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
              <ChoiceButton active={form.hasGuide === true}
                onClick={() => { update('hasGuide', true); setStep(8) }}>
                Yes, I have my own project guide to upload
              </ChoiceButton>
              <ChoiceButton active={form.hasGuide === false}
                onClick={async () => {
                  update('hasGuide', false)
                  setLoading(true)
                 const guide = await fetchGuideFromDB(form.university, form.department)
                  if (guide) {
                    update('guideContent', guide.structure)
                    update('guideFound', guide.label)
                    update('ragGuideContent', guide.structure)
                  }
                  setLoading(false)
                  setStep(9)
                }}>
                {loading ? 'Checking our database...' : 'No — use a standard structure'}
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

        {/* Step 9 — Final details */}
        {step === 9 && (
          <StepCard title="Almost there." subtitle="A few final details to make your project as accurate as possible">
            <label className="label" style={{ fontWeight: 600 }}>
              Supervisor's Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input className="input"
              placeholder="e.g. Dr. Chukwu Okafor"
              value={form.supervisorName}
              onChange={e => {
                update('supervisorName', e.target.value)
                if (error && error.includes('supervisor')) setError('')
              }}
              style={{
                marginBottom: 12,
                borderColor: (error && error.includes('supervisor')) ? 'var(--danger)' : undefined,
              }}
            />
            {error && error.includes('supervisor') && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: -8, marginBottom: 16 }}>{error}</p>
            )}

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
                <input className="input" 
                  type="url"
                  placeholder="https://github.com/yourusername/yourrepo"
                  value={form.githubLink} 
                  onChange={e => update('githubLink', e.target.value)}
                  inputMode="url"
                />
              </>
            )}

            {error && !error.includes('supervisor') && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>
            )}

            {/* ── Hardware Project Media Upload ─────────────────────────── */}
<div style={{
  marginTop: 24,
  padding: '20px',
  background: 'rgba(0,126,167,0.06)',
  borderRadius: 12,
  border: '1px dashed rgba(0,126,167,0.3)'
}}>
  <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
    📷 Hardware / Physical Project?
  </p>
  <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
    Upload up to 5 photos of your project so Grad can write accurate chapters 3–5.
    You can also paste a video link (YouTube, Drive) for your supervisor's reference.
  </p>

  {/* Photo upload */}
  <input
    type="file"
    id="hw-photos"
    accept="image/*"
    multiple
    style={{ display: 'none' }}
    onChange={handlePhotoSelect}
  />
  <label htmlFor="hw-photos" style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
    background: '#007EA7', color: '#fff', fontSize: 14, fontWeight: 500,
    marginBottom: 16
  }}>
    📎 Choose Photos ({projectPhotos.length}/5)
  </label>

  {/* Photo previews — wraps on mobile */}
  {photoPreviewUrls.length > 0 && (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16
    }}>
      {photoPreviewUrls.map((url, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <img src={url} alt={`preview ${i + 1}`} style={{
            width: 80, height: 80, objectFit: 'cover',
            borderRadius: 8, border: '1px solid #ddd'
          }} />
          <button onClick={() => removePhoto(i)} style={{
            position: 'absolute', top: -6, right: -6,
            background: '#e53e3e', color: '#fff', border: 'none',
            borderRadius: '50%', width: 20, height: 20,
            cursor: 'pointer', fontSize: 11, lineHeight: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
      ))}
    </div>
  )}

  </div>

            <button className="btn-primary" onClick={handleContinue}
              disabled={!form.supervisorName.trim() || generatingProject}
              style={{
                width: '100%', justifyContent: 'center', marginTop: 28, fontSize: 16, padding: '14px',
                opacity: (form.supervisorName.trim() && !generatingProject) ? 1 : 0.6,
                cursor: (form.supervisorName.trim() && !generatingProject) ? 'pointer' : 'not-allowed',
              }}>
              {generatingProject ? 'Starting...' : 'Generate My Project →'}
            </button>
            <button className="btn-ghost" onClick={() => setStep(8)}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              ← Back
            </button>
          </StepCard>
        )}

      </div>
    </div>
  )
}

// ─── STEP CARD ────────────────────────────────────────────────────────────────
function StepCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 32px)', animation: 'fadeUp 0.35s ease' }}>
      <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 26, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15, fontFamily: 'Geist, sans-serif' }}>{subtitle}</p>
      {children}
    </div>
  )
}

// ─── STEP NAV ─────────────────────────────────────────────────────────────────
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

// ─── CHOICE BUTTON ────────────────────────────────────────────────────────────
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