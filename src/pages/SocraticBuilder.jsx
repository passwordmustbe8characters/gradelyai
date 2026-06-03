import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socraticChat, generateProjectStructure } from '../lib/ai'

const STORAGE_KEY_CHAT = 'gradelyChatHistory';
const STORAGE_KEY_SECTIONS = 'gradelyCompletedSections';

const styles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes pulse-ring {
    0%,100% { box-shadow: 0 4px 18px rgba(0,126,167,0.28), 0 0 0 0   rgba(0,126,167,0.22); }
    50%      { box-shadow: 0 4px 18px rgba(0,126,167,0.28), 0 0 0 6px rgba(0,126,167,0);    }
  }

  .sb-root {
    display: flex;
    height: 100vh;
    background: var(--bg);
    font-family: 'Geist', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* ambient blobs — light palette */
  .sb-root::before {
    content: '';
    position: fixed;
    top: -15%; left: -8%;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(0,157,201,0.10) 0%, transparent 68%);
    pointer-events: none;
    z-index: 0;
  }
  .sb-root::after {
    content: '';
    position: fixed;
    bottom: -20%; right: -8%;
    width: 440px; height: 440px;
    background: radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── CHAT PANEL ── */
  .sb-chat-panel {
    flex: 2;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    position: relative;
    z-index: 1;
  }

  /* ── HEADER ── */
  .sb-header {
    padding: 14px 24px;
    border-bottom: 1px solid var(--border-light);
    background: rgba(247, 245, 240, 0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .sb-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .sb-avatar {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent) 0%, rgba(0,157,201,0.7) 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Melodrama', serif;
    font-size: 17px;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(0,126,167,0.22), inset 0 1px 0 rgba(255,255,255,0.2);
    letter-spacing: -0.5px;
  }
  .sb-header-text { min-width: 0; }
  .sb-header-title {
    font-family: 'Melodrama', serif;
    font-size: 19px;
    color: var(--text);
    margin: 0;
    letter-spacing: -0.3px;
    line-height: 1.2;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .sb-header-subtitle {
    font-size: 12.5px;
    color: var(--text-muted);
    font-family: 'Geist', sans-serif;
    font-weight: 400;
  }
  .sb-header-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 5px;
    flex-wrap: wrap;
  }
  .sb-header-topic {
    font-size: 12px;
    color: var(--text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
  }
  .sb-progress-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(0,126,167,0.08);
    color: var(--accent);
    border: 1px solid rgba(0,126,167,0.14);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .sb-progress-pill.complete {
    background: rgba(45,155,111,0.08);
    color: var(--success);
    border-color: rgba(45,155,111,0.18);
  }
  .sb-header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── SIDEBAR COLLAPSE ── */
  .sb-sidebar {
    transition: width 0.3s ease, padding 0.3s ease, opacity 0.25s ease;
  }
  .sb-sidebar.collapsed {
    width: 0 !important;
    padding: 0 !important;
    opacity: 0;
    border-left: none;
    overflow: hidden;
  }
  .sb-sidebar-reopen {
    position: absolute;
    right: 0; top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    width: 20px; height: 48px;
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-right: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-dim);
    transition: all 0.2s ease;
    box-shadow: -2px 0 8px rgba(0,0,0,0.05);
  }
  .sb-sidebar-reopen:hover {
    background: var(--bg-card);
    color: var(--text-muted);
  }
  .sb-collapse-btn {
    width: 28px; height: 28px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.6);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    color: var(--text-muted);
  }
  .sb-collapse-btn:hover {
    background: var(--bg-card);
    border-color: var(--text-dim);
    color: var(--text);
  }
  .sb-collapse-btn svg {
    transition: transform 0.3s ease;
  }
  .sb-collapse-btn.open svg {
    transform: rotate(180deg);
  }

  /* ── MESSAGES ── */
  .sb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 28px 32px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .sb-messages::-webkit-scrollbar       { width: 4px; }
  .sb-messages::-webkit-scrollbar-track { background: transparent; }
  .sb-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .sb-msg-row { display: flex; animation: fadeUp 0.28s ease forwards; }
  .sb-msg-row.user      { justify-content: flex-end; }
  .sb-msg-row.assistant { justify-content: flex-start; }

  .sb-bubble {
    max-width: 78%;
    padding: 15px 20px;
    font-size: 14.5px;
    line-height: 1.68;
  }
  .sb-bubble.user {
    background: rgba(0, 126, 167, 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(0,157,201,0.3);
    color: #fff;
    border-radius: 18px 18px 4px 18px;
    box-shadow: 0 4px 20px rgba(0,126,167,0.22), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .sb-bubble.assistant {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(229,224,216,0.8);
    color: var(--text);
    border-radius: 18px 18px 18px 4px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9);
  }

  .sb-draft-block {
    background: rgba(0,126,167,0.04);
    border: 1px solid rgba(0,126,167,0.14);
    padding: 16px 18px;
    border-radius: var(--radius-sm);
    margin: 12px 0;
    white-space: pre-wrap;
    line-height: 1.75;
    color: var(--text);
    font-size: 13.5px;
    box-shadow: inset 0 1px 0 rgba(0,126,167,0.06);
  }
  .sb-draft-outro {
    margin-top: 10px;
    color: var(--success);
    font-weight: 600;
    font-size: 13px;
    white-space: pre-wrap;
  }

  .sb-typing {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-dim);
    font-size: 13px;
    font-style: italic;
    padding-left: 4px;
  }
  .sb-typing-dots { display: flex; gap: 5px; }
  .sb-typing-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.55;
    animation: float 1.1s ease-in-out infinite;
  }
  .sb-typing-dot:nth-child(2) { animation-delay: 0.18s; }
  .sb-typing-dot:nth-child(3) { animation-delay: 0.36s; }

  /* ── INPUT ── */
  .sb-input-area {
    padding: 18px 28px 22px;
    background: rgba(247,245,240,0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border-light);
  }
  .sb-input-row { display: flex; align-items: flex-end; gap: 12px; }
  .sb-textarea-wrap { flex: 1; position: relative; }

  .sb-textarea {
    width: 100%;
    padding: 14px 56px 14px 18px;
    border-radius: 16px;
    border: 1.5px solid var(--border);
    background: rgba(255,255,255,0.78);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: var(--text);
    font-size: 14.5px;
    font-family: 'Geist', sans-serif;
    resize: none;
    outline: none;
    min-height: 58px;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    line-height: 1.6;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9);
  }
  .sb-textarea::placeholder { color: var(--text-dim); }
  .sb-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0,126,167,0.10), 0 2px 10px rgba(0,0,0,0.04);
  }

  .sb-word-count {
    position: absolute;
    bottom: 11px; right: 15px;
    font-size: 11px; font-weight: 600;
    transition: color 0.2s;
  }
  .sb-word-count.met   { color: var(--success); }
  .sb-word-count.unmet { color: var(--text-dim); }

  .sb-send-btn {
    border-radius: 100px;
    border: none;
    font-size: 14px; font-weight: 600;
    font-family: 'Geist', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    padding: 14px 24px;
  }
  .sb-send-btn.active {
    background: var(--accent);
    color: white;
    animation: pulse-ring 3s infinite;
  }
  .sb-send-btn.active:hover {
    background: var(--accent-light);
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0,126,167,0.38);
  }
  .sb-send-btn.inactive {
    background: var(--bg-elevated);
    color: var(--text-dim);
    cursor: not-allowed;
    border: 1.5px solid var(--border);
  }

  /* ── SIDEBAR ── */
  .sb-sidebar {
    width: 300px;
    background: rgba(240,237,232,0.65);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    position: relative;
    z-index: 1;
    border-left: 1px solid var(--border-light);
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
    flex-shrink: 0;
  }
  .sb-sidebar::-webkit-scrollbar       { width: 3px; }
  .sb-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .sb-sidebar-title {
    font-family: 'Melodrama', serif;
    font-size: 20px;
    color: var(--text);
    margin: 0;
    letter-spacing: -0.2px;
  }
  .sb-chapter-label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 1.3px;
    color: var(--text-dim);
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 9px;
    padding-left: 2px;
  }

  .sb-section-item {
    padding: 11px 14px;
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
    border: 1px solid;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.22s ease;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .sb-section-item.done {
    border-color: rgba(45,155,111,0.22);
    background: rgba(45,155,111,0.06);
    box-shadow: 0 2px 10px rgba(45,155,111,0.07);
  }
  .sb-section-item.pending {
    border-color: var(--border-light);
    background: rgba(255,255,255,0.55);
    box-shadow: 0 1px 6px rgba(0,0,0,0.03);
  }
  .sb-section-item.pending:hover {
    border-color: var(--border);
    background: rgba(255,255,255,0.80);
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    transform: translateX(2px);
  }
  .sb-section-text { font-size: 13px; font-weight: 500; }
  .sb-section-text.done    { color: var(--success); }
  .sb-section-text.pending { color: var(--text-muted); }
  .sb-section-check { font-size: 12px; color: var(--success); }

  /* ── LOADING ── */
  .sb-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }
  .sb-loading::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(0,157,201,0.09) 0%, transparent 65%);
    pointer-events: none;
  }
  .sb-spinner {
    width: 42px; height: 42px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top: 2px solid var(--accent);
    animation: spin 0.85s linear infinite;
    margin-bottom: 24px;
    box-shadow: 0 0 18px rgba(0,126,167,0.18);
  }
  .sb-loading-title {
    font-family: 'Melodrama', serif;
    font-size: 26px;
    color: var(--text);
    margin: 0 0 8px 0;
    letter-spacing: -0.3px;
  }
  .sb-loading-sub { color: var(--text-muted); font-size: 14px; margin: 0; }
  .sb-loading-bar {
    margin-top: 32px;
    width: 180px; height: 2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }
  .sb-loading-bar::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    height: 100%; width: 40%;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }
`;

export default function SocraticBuilder() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingStructure, setIsLoadingStructure] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatEndRef = useRef(null)

  let savedResult = null;
  let savedProjectInfo = null;
  try {
    const res = sessionStorage.getItem('gradelyResult');
    if (res) savedResult = JSON.parse(res);
    const proj = sessionStorage.getItem('gradelyProject');
    if (proj) savedProjectInfo = JSON.parse(proj);
  } catch (e) { console.error(e); }

  const projectData = {
    topic: savedResult?.projectInfo?.topic || savedProjectInfo?.topic || "Your Project Topic",
    chapters: savedResult?.structure?.chapters || [],
    references: savedResult?.references || []
  }

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CHAT);
      const parsed = saved ? JSON.parse(saved) : [];
      if (parsed.length > 0) return parsed;
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [completedSections, setCompletedSections] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SECTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const initProject = async () => {
      if (savedResult?.structure?.chapters?.length > 0) {
        setIsLoadingStructure(false);
        if (messages.length === 0) {
          setMessages([{
            role: 'assistant',
            content: `Hey! I've analyzed your project guide for "${projectData.topic}". Let's build Chapter 1: Introduction. To start with Section 1.1 (Background), tell me in your own words: Why is this topic important right now?`
          }]);
        }
        return;
      }
      setIsLoadingStructure(true);
      try {
        const projInfo = savedProjectInfo || {};
        const structure = await generateProjectStructure(projInfo);
        const newResult = {
          ...projInfo,
          structure,
          chapters: structure.chapters.map(ch => ({ ...ch, content: '' })),
          abstract: '',
          references: [],
          projectInfo: projInfo,
          humanized: false
        };
        sessionStorage.setItem('gradelyResult', JSON.stringify(newResult));
        window.location.reload();
      } catch (err) {
        console.error("Failed to generate structure:", err);
        alert("Failed to generate project structure. Please try again.");
        navigate('/start');
      } finally {
        setIsLoadingStructure(false);
      }
    };
    initProject();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { sessionStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(completedSections)); }, [completedSections]);

  const lastMessageWasDraft = messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content.includes('[SECTION_DRAFT]')
  const isChapter1Complete = messages.some(m => m.content.includes('[CHAPTER_1_COMPLETE]'))
  const MIN_WORDS = (lastMessageWasDraft || isChapter1Complete) ? 1 : 10
  const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
  const isThresholdMet = wordCount >= MIN_WORDS

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const handleSend = async () => {
    if (!isThresholdMet) return
    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)
    try {
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}');
      const chapter1Structure = currentResult?.structure?.chapters?.find(c => c.number === 1) || { subsections: [] }
      const aiReply = await socraticChat(
        savedProjectInfo || currentResult?.projectInfo || {},
        chapter1Structure,
        messages,
        userMessage,
        currentResult?.references || []
      )
      if (aiReply.includes('[SECTION_DRAFT]')) {
        const outroText = aiReply.split('[/SECTION_DRAFT]')[1] || '';
        const sectionMatch = outroText.match(/(\d+\.\d+)/);
        if (sectionMatch) {
          setCompletedSections(prev => prev.includes(sectionMatch[1]) ? prev : [...prev, sectionMatch[1]])
        }
        const parts = aiReply.split('[SECTION_DRAFT]');
        if (parts.length > 1) {
          const draftContent = parts[1].split('[/SECTION_DRAFT]')[0].trim();
          if (draftContent) {
            let cur = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}');
            if (cur.chapters && cur.chapters[0]) {
              cur.chapters[0].content = (cur.chapters[0].content || '') + '\n\n' + draftContent;
              sessionStorage.setItem('gradelyResult', JSON.stringify(cur));
            }
          }
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, I lost my train of thought. Can you repeat that?" }])
    }
    setIsTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const formatMessage = (content) => {
    if (!content.includes('[SECTION_DRAFT]')) {
      const clean = content.replace('[CHAPTER_1_COMPLETE]', '');
      return <span style={{ whiteSpace: 'pre-wrap' }}>{clean}</span>
    }
    const parts = content.split('[SECTION_DRAFT]')
    const intro = parts[0]
    const [draft, outro = ''] = parts[1].split('[/SECTION_DRAFT]')
    return (
      <>
        {intro && <p style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{intro}</p>}
        <div className="sb-draft-block">{draft}</div>
        {outro && <p className="sb-draft-outro">{outro}</p>}
      </>
    )
  }

  if (isLoadingStructure) {
    return (
      <>
        <style>{styles}</style>
        <div className="sb-loading">
          <div className="sb-spinner" />
          <h2 className="sb-loading-title">Grad is reading your guide...</h2>
          <p className="sb-loading-sub">Generating your chapter structure.</p>
          <div className="sb-loading-bar" />
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sb-root">

        <div className="sb-chat-panel" style={{ position: 'relative' }}>
          {!sidebarOpen && (
            <button
              className="sb-sidebar-reopen"
              onClick={() => setSidebarOpen(true)}
              title="Show progress"
            >
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M2 1L6 6L2 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <div className="sb-header">
            <div className="sb-header-left">
              <div className="sb-avatar">G</div>
              <div className="sb-header-text">
                <h2 className="sb-header-title">
                  Grad
                  <span className="sb-header-subtitle">(Your Project Gee)</span>
                </h2>
                <div className="sb-header-meta">
                  <p className="sb-header-topic">📁 {projectData.topic}</p>
                  <span className={`sb-progress-pill${isChapter1Complete ? ' complete' : ''}`}>
                    {isChapter1Complete ? '✓ Ch 1 Complete' : `${completedSections.length} section${completedSections.length !== 1 ? 's' : ''} done`}
                  </span>
                </div>
              </div>
            </div>
            <div className="sb-header-actions">
              <button
                className="btn-ghost"
                onClick={() => {
                  sessionStorage.removeItem(STORAGE_KEY_CHAT);
                  sessionStorage.removeItem(STORAGE_KEY_SECTIONS);
                  navigate('/dashboard');
                }}
                style={{ fontSize: 13 }}
              >
                Exit
              </button>
              {isChapter1Complete && (
                <button
                  className="btn-accent"
                  onClick={() => navigate('/results')}
                  style={{ fontSize: 13, padding: '8px 18px' }}
                >
                  Save &amp; Review Ch 1
                </button>
              )}
            </div>
          </div>

          <div className="sb-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`sb-msg-row ${msg.role}`}>
                <div className={`sb-bubble ${msg.role}`}>
                  {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="sb-typing">
                <div className="sb-typing-dots">
                  <div className="sb-typing-dot" />
                  <div className="sb-typing-dot" />
                  <div className="sb-typing-dot" />
                </div>
                Grad is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="sb-input-area">
            <div className="sb-input-row">
              <div className="sb-textarea-wrap">
                <textarea
                  className="sb-textarea"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isChapter1Complete
                      ? "Type 'pay' to unlock chapters 2-5..."
                      : lastMessageWasDraft
                        ? "Type 'yes' or 'next'..."
                        : "Tell Grad your thoughts in your own words..."
                  }
                  rows={2}
                />
                <div className={`sb-word-count ${isThresholdMet ? 'met' : 'unmet'}`}>
                  {(lastMessageWasDraft || isChapter1Complete) ? '✓' : `${wordCount}/${MIN_WORDS}`}
                </div>
              </div>
              <button
                className={`sb-send-btn ${isThresholdMet && !isTyping ? 'active' : 'inactive'}`}
                onClick={handleSend}
                disabled={!isThresholdMet || isTyping}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className={`sb-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
          <div className="sb-sidebar-header">
            <h3 className="sb-sidebar-title">Project Progress</h3>
            <button
              className={`sb-collapse-btn${sidebarOpen ? ' open' : ''}`}
              onClick={() => setSidebarOpen(p => !p)}
              title={sidebarOpen ? 'Collapse' : 'Expand'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {projectData.chapters.length > 0 ? (
            projectData.chapters.map(ch => (
              <div key={ch.number || ch.title}>
                <div className="sb-chapter-label">
                  Chapter {ch.number}: {ch.title}
                </div>
                {(ch.subsections || []).map(sec => {
                  const sectionTitle = typeof sec === 'string' ? sec : sec.title;
                  const secNum = sectionTitle.split(' ')[0];
                  const isReady = completedSections.includes(secNum);
                  return (
                    <div key={sectionTitle} className={`sb-section-item ${isReady ? 'done' : 'pending'}`}>
                      <span className={`sb-section-text ${isReady ? 'done' : 'pending'}`}>
                        {sectionTitle}
                      </span>
                      {isReady && <span className="sb-section-check">✓</span>}
                    </div>
                  )
                })}
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No project structure found.</p>
          )}
        </div>

      </div>
    </>
  )
}