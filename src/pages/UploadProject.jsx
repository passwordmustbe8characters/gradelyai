import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import logoPrimary from '../assets/primary-logo.png'
import { saveResultToSession } from '../lib/sessionResult'

const BASE_URL = import.meta.env.VITE_API_URL || ''

function safeParseJSON(val, fallback) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}

export default function UploadProject() {
  const navigate = useNavigate()
  const { user, markOnboarded } = useAuth()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (!f) return
    const okType = f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (!okType) {
      setError('Please choose a .docx or .pdf file.')
      setFile(null)
      return
    }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${BASE_URL}/api/projects/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Upload failed')

      const proj = data.project
      const resultData = {
        projectInfo: safeParseJSON(proj.project_info, {}),
        structure: safeParseJSON(proj.structure, {}),
        chapters: safeParseJSON(proj.chapters, []),
        abstract: proj.abstract || '',
        references: safeParseJSON(proj.refs, []),
        dbProjectId: proj.id,
        isPaidUser: proj.is_paid === 1,
        source: proj.source,
      }
      saveResultToSession(resultData)
      sessionStorage.setItem('gradelyProjectDbId', proj.id)
      if (!user?.onboarded) {
        try { await markOnboarded() } catch (e) { console.error(e) }
      }
      navigate('/results')
    } catch (err) {
      console.error('Project upload failed:', err)
      setError(err.message || 'Something went wrong while processing your document. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg)', padding: '0 24px 60px' }}>
      <div style={{ width: '100%', maxWidth: 560, padding: '24px 0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <img src={logoPrimary} alt="GradelyAI" style={{ height: 28, width: 'auto' }} />
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <h1 style={{ fontFamily: 'Melodrama, serif', fontSize: 32, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
          Upload Your Project
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          Already have a finished project? Upload it as a .docx or .pdf. You'll get free access to Defense
          Simulation right away — unlock Student Breakdown, Weak Spots, Flashcards, and Humanization for ₦10,000.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16, padding: '40px 24px', textAlign: 'center',
            cursor: 'pointer', marginBottom: 16, background: 'var(--bg-card)'
          }}>
          <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />
          <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
          {file ? (
            <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{file.name}</p>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
                Click to choose a file
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>.docx or .pdf</p>
            </>
          )}
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>⚠️ {error}</p>
        )}

        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px' }}>
          {uploading ? 'Reading your project...' : 'Upload & Continue →'}
        </button>
      </div>
    </div>
  )
}
