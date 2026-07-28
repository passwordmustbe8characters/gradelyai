const BASE_URL = import.meta.env.VITE_API_URL || ''

import { useState, useEffect } from 'react'

import { NIGERIAN_UNIVERSITIES, ALL_DEPARTMENTS } from '../lib/universities'

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [guides, setGuides] = useState([])
  const [section, setSection] = useState('guides') // guides | users
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [view, setView] = useState('list') // list | add | edit | upload
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    university: '',
    department: '',
    year: new Date().getFullYear().toString(),
    label: '',
    structure: '',
    writing_expectations: ''
  })

  const [uploadForm, setUploadForm] = useState({
    university: '',
    department: '',
    year: new Date().getFullYear().toString(),
    label: '',
    file: null
  })

  useEffect(() => {
    let cancelled = false

    async function initAuth() {
      const token = localStorage.getItem('gradelyAdminToken')
      if (!token) return

      try {
        const res = await fetch(`${BASE_URL}/api/admin/check`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!cancelled && data.isAdmin) {
          setIsAdmin(true)
          loadGuides()
        }
      } catch (err) {
        console.error(err)
      }
    }

    initAuth()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = async () => {
    setLoginError('')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (data.success && data.token) {
        localStorage.setItem('gradelyAdminToken', data.token)
        setIsAdmin(true)
        loadGuides()
      } else {
        setLoginError(data.error || 'Wrong password')
      }
    } catch (err) {
      setLoginError('Cannot connect to server: ' + err.message)
    }
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('gradelyAdminToken')
    localStorage.removeItem('gradelyAdminToken')
    await fetch(`${BASE_URL}/api/admin/logout`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    setIsAdmin(false)
  }

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('gradelyAdminToken')}`,
    'Content-Type': 'application/json'
  })

  async function loadGuides() {
    const res = await fetch(`${BASE_URL}/api/admin/guides`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gradelyAdminToken')}` }
    })
    const data = await res.json()
    setGuides(data.guides || [])
  }

  async function loadUsers() {
    setUsersLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gradelyAdminToken')}` }
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error(err)
    }
    setUsersLoading(false)
  }

  const openUsersTab = () => {
    setSection('users')
    if (users.length === 0) loadUsers()
  }

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const updateUploadForm = (key, value) => setUploadForm(f => ({ ...f, [key]: value }))

  const autoLabel = (f) => `${f.university} ${f.department} — ${f.year}`

  const handleAdd = async () => {
    setLoading(true)
    setMessage('')
    try {
      const payload = { ...form, label: form.label || autoLabel(form) }
      const res = await fetch(`${BASE_URL}/api/admin/guides`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.guide) {
        setMessage('✅ Guide added successfully.')
        loadGuides()
        setView('list')
        setForm({ university: '', department: '', year: new Date().getFullYear().toString(), label: '', structure: '', writing_expectations: '' })
      } else {
        setMessage('❌ ' + (data.error || 'Failed to add guide.'))
      }
    } catch (err) {
      setMessage('❌ ' + err.message)
    }
    setLoading(false)
  }

  const handleEdit = async () => {
    setLoading(true)
    setMessage('')
    try {
      const payload = { ...form, label: form.label || autoLabel(form) }
      const res = await fetch(`${BASE_URL}/api/admin/guides/${selected.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.guide) {
        setMessage('✅ Guide updated successfully.')
        loadGuides()
        setView('list')
      } else {
        setMessage('❌ ' + (data.error || 'Failed to update guide.'))
      }
    } catch (err) {
      setMessage('❌ ' + err.message)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this guide?')) return
    await fetch(`${BASE_URL}/api/admin/guides/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('gradelyAdminToken')}` }
    })
    loadGuides()
  }

  const handleUpload = async () => {
    if (!uploadForm.file) {
      setMessage('Please select a file.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      // THE FIX: Creating the formData variable explicitly here
      const formData = new FormData()
      
      formData.append('file', uploadForm.file)
      formData.append('university', uploadForm.university)
      formData.append('department', uploadForm.department)
      formData.append('year', uploadForm.year)
      formData.append('label', uploadForm.label || autoLabel(uploadForm))

      const res = await fetch(`${BASE_URL}/api/admin/guides/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gradelyAdminToken')}` },
        body: formData // Using the variable created above
      })
      
      const data = await res.json()
      if (data.guide) {
        setMessage('✅ Guide uploaded and processed successfully.')
        loadGuides()
        setView('list')
        setUploadForm({ university: '', department: '', year: new Date().getFullYear().toString(), label: '', file: null })
      } else {
        setMessage('❌ ' + (data.error || 'Failed to upload guide.'))
      }
    } catch (err) {
      setMessage('❌ ' + err.message)
    }
    setLoading(false)
  }

  const openEdit = (guide) => {
    setSelected(guide)
    setForm({
      university: guide.university,
      department: guide.department,
      year: guide.year || '',
      label: guide.label,
      structure: guide.structure,
      writing_expectations: guide.writing_expectations || ''
    })
    setView('edit')
    setMessage('')
  }

  // ─── LOGIN ──────────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', margin: '0 auto 16px' }}>G</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>GradelyAI Admin</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Project Guide Management</p>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <label className="label">Admin Password</label>
            <input id="university" name="university" className="input" type="password" placeholder="Enter password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ marginBottom: 8 }} />
            {loginError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{loginError}</p>}
            <button className="btn-primary" onClick={handleLogin}
              style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              Login →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── ADMIN PANEL ────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700 }}>GradelyAI Admin</span>
          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid rgba(108,99,255,0.2)' }}>
            {guides.length} guides
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {section === 'guides' && view !== 'list' && (
            <button className="btn-ghost" onClick={() => { setView('list'); setMessage('') }} style={{ fontSize: 13 }}>
              ← Back to list
            </button>
          )}
          {section === 'guides' && view === 'list' && (
            <>
              <button className="btn-ghost" onClick={() => { setView('upload'); setMessage('') }} style={{ fontSize: 13 }}>
                Upload PDF
              </button>
              <button className="btn-primary" onClick={() => { setView('add'); setMessage('') }} style={{ fontSize: 13, padding: '8px 18px' }}>
                + Add Guide
              </button>
            </>
          )}
          <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 13 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 32px', display: 'flex', gap: 4 }}>
        <button
          onClick={() => { setSection('guides'); setMessage('') }}
          style={{
            padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            color: section === 'guides' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: section === 'guides' ? '2px solid var(--accent)' : '2px solid transparent'
          }}
        >
          Guides
        </button>
        <button
          onClick={openUsersTab}
          style={{
            padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            color: section === 'users' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: section === 'users' ? '2px solid var(--accent)' : '2px solid transparent'
          }}
        >
          Users {users.length > 0 && `(${users.length})`}
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24,
            background: message.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${message.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: message.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
            fontSize: 14
          }}>
            {message}
          </div>
        )}

        {/* LIST VIEW */}
        {section === 'guides' && view === 'list' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              Project Guides
            </h2>

            {guides.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ fontSize: 32, marginBottom: 16 }}>📚</p>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>No guides yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Add your first project guide to get started.</p>
                <button className="btn-primary" onClick={() => setView('upload')}>
                  Upload a PDF Guide
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {guides.map(guide => (
                  <div key={guide.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{guide.label}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {guide.university}
                        </span>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {guide.department}
                        </span>
                        {guide.year && (
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {guide.year}
                          </span>
                        )}
                        {guide.writing_expectations && (
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.2)' }}>
                            ✓ Has writing expectations
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" onClick={() => openEdit(guide)} style={{ fontSize: 13 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(guide.id)} style={{
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        background: 'transparent', color: 'var(--danger)',
                        cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif'
                      }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD VIEW */}
        {view === 'add' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              Add New Guide
            </h2>
            <GuideForm form={form} updateForm={updateForm} universities={NIGERIAN_UNIVERSITIES} ALL_DEPARTMENTS={ALL_DEPARTMENTS} />
            <button className="btn-primary" onClick={handleAdd} disabled={loading}
              style={{ marginTop: 24, padding: '13px 32px' }}>
              {loading ? 'Saving...' : 'Save Guide →'}
            </button>
          </div>
        )}

        {/* EDIT VIEW */}
        {view === 'edit' && selected && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Edit Guide
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>{selected.label}</p>
            <GuideForm form={form} updateForm={updateForm} universities={NIGERIAN_UNIVERSITIES} ALL_DEPARTMENTS={ALL_DEPARTMENTS} />
            <button className="btn-primary" onClick={handleEdit} disabled={loading}
              style={{ marginTop: 24, padding: '13px 32px' }}>
              {loading ? 'Saving...' : 'Update Guide →'}
            </button>
          </div>
        )}

        {/* UPLOAD VIEW */}
        {view === 'upload' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Upload PDF Guide
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Upload a PDF or text file. GradelyAI will automatically extract the chapter structure and writing requirements.
            </p>

            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="label">University</label>
                  <select id="university" name="university" className="input" value={uploadForm.university}
                    onChange={e => updateUploadForm('university', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select university</option>
                    {NIGERIAN_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select id="department" name="department" className="input" value={uploadForm.department}
                    onChange={e => updateUploadForm('department', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select department</option>
                    {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="label">Year</label>
                  <input id="year" name="year"  className="input" placeholder="e.g. 2024"
                    value={uploadForm.year} onChange={e => updateUploadForm('year', e.target.value)} />
                </div>
                <div>
                  <label className="label">Label (optional — auto-generated if empty)</label>
                  <input id="label" name="label" className="input" placeholder="e.g. UNILAG CS Guide 2024"
                    value={uploadForm.label} onChange={e => updateUploadForm('label', e.target.value)} />
                </div>
              </div>

              <label className="label">PDF or Text File</label>
              <input type="file" accept=".pdf,.txt"
                onChange={e => updateUploadForm('file', e.target.files[0])}
                style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }} />
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                The AI will read your file and extract the project structure automatically.
              </p>
            </div>

            {loading && (
              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-dim)', border: '1px solid rgba(108,99,255,0.2)', marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: 'var(--accent-light)' }}>
                  ⟳ Processing your guide... This takes about 30 seconds.
                </p>
              </div>
            )}

            <button className="btn-primary" onClick={handleUpload} disabled={loading}
              style={{ padding: '13px 32px' }}>
              {loading ? 'Processing...' : 'Upload and Process →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── GUIDE FORM COMPONENT ─────────────────────────────────────────────────────

function GuideForm({ form, updateForm, universities, ALL_DEPARTMENTS }) {
  return (
    <div className="card">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="label">University</label>
          <select id="university" name="university"  className="input" value={form.university}
            onChange={e => updateForm('university', e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="">Select university</option>
            {universities.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Department</label>
          <select id="department" name="department" className="input" value={form.department}
            onChange={e => updateForm('department', e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="">Select department</option>
            {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="label">Year</label>
          <input id="year" name="year" className="input" placeholder="e.g. 2024"
            value={form.year} onChange={e => updateForm('year', e.target.value)} />
        </div>
        <div>
          <label className="label">Label (optional)</label>
          <input id="label" name="label" className="input" placeholder="Auto-generated if empty"
            value={form.label} onChange={e => updateForm('label', e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="label">Chapter Structure</label>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
          Paste the full chapter and subsection structure from the project guide
        </p>
        <textarea id="structure" name="structure" className="input" rows={12}
          placeholder={`CHAPTER ONE: INTRODUCTION\n1.1 Background to the Study\n1.2 Statement of the Problem\n...`}
          value={form.structure} onChange={e => updateForm('structure', e.target.value)}
          style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
      </div>

      <div>
        <label className="label">Writing Expectations (optional)</label>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
          Any formatting rules, font requirements, page limits, citation style, writing style notes
        </p>
        <textarea id="writing_expectations" name="writing_expectations" className="input" rows={5}
          placeholder="e.g. Times New Roman 12pt, 1.5 line spacing, APA citation style, maximum 100 pages..."
          value={form.writing_expectations} onChange={e => updateForm('writing_expectations', e.target.value)}
          style={{ resize: 'vertical' }} />
      </div>
    </div>
  )
}