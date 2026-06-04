import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socraticChat, generateProjectStructure } from '../lib/ai'

const STORAGE_KEY_CHAT = 'gradelyChatHistory';
const STORAGE_KEY_SECTIONS = 'gradelyCompletedSections';

const ProgressList = ({ chapters, completedSections }) => (
  <>
    {chapters.length > 0 ? (
      chapters.map(ch => (
        <div key={ch.number || ch.title}>
          <div className="sb-chapter-label">Chapter {ch.number}: {ch.title}</div>
          {(ch.subsections || []).map(sec => {
            const sectionTitle = typeof sec === 'string' ? sec : sec.title;
            const secNum = sectionTitle.split(' ')[0];
            const isReady = completedSections.includes(secNum);
            return (
              <div key={sectionTitle} className={`sb-section-item ${isReady ? 'done' : 'pending'}`}>
                <span className={`sb-section-text ${isReady ? 'done' : 'pending'}`}>{sectionTitle}</span>
                {isReady && <span className="sb-section-check">✓</span>}
              </div>
            )
          })}
        </div>
      ))
    ) : (
      <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No project structure found.</p>
    )}
  </>
)

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
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  /* ── ROOT ── */
  .sb-root {
    display: flex;
    height: 100vh;
    height: 100dvh;
    background: var(--bg);
    font-family: 'Geist', sans-serif;
    position: relative;
    overflow: hidden;
  }
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
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    min-width: 0;
  }

  /* ── HEADER ── */
  .sb-header {
    padding: 14px 24px;
    border-bottom: 1px solid var(--border-light);
    background: rgba(247,245,240,0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
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
    max-width: 280px;
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
    cursor: default;
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
    background: rgba(0,126,167,0.88);
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
    display: flex; align-items: center; gap: 10px;
    color: var(--text-dim); font-size: 13px; font-style: italic;
    padding-left: 4px;
  }
  .sb-typing-dots { display: flex; gap: 5px; }
  .sb-typing-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent); opacity: 0.55;
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
    flex-shrink: 0;
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
    position: absolute; bottom: 11px; right: 15px;
    font-size: 11px; font-weight: 600; transition: color 0.2s;
  }
  .sb-word-count.met   { color: var(--success); }
  .sb-word-count.unmet { color: var(--text-dim); }

  .sb-send-btn {
    border-radius: 100px; border: none;
    font-size: 14px; font-weight: 600;
    font-family: 'Geist', sans-serif;
    cursor: pointer; transition: all 0.2s ease;
    white-space: nowrap; padding: 14px 24px;
  }
  .sb-send-btn.active {
    background: var(--accent); color: white;
    animation: pulse-ring 3s infinite;
  }
  .sb-send-btn.active:hover {
    background: var(--accent-light);
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0,126,167,0.38);
  }
  .sb-send-btn.inactive {
    background: var(--bg-elevated); color: var(--text-dim);
    cursor: not-allowed; border: 1.5px solid var(--border);
  }

  /* ── DESKTOP SIDEBAR ── */
  .sb-sidebar {
    width: 300px;
    flex-shrink: 0;
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
    transition: width 0.3s ease, padding 0.3s ease, opacity 0.25s ease;
  }
  .sb-sidebar::-webkit-scrollbar       { width: 3px; }
  .sb-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .sb-sidebar.collapsed {
    width: 0 !important;
    padding: 0 !important;
    opacity: 0;
    border-left: none;
    overflow: hidden;
  }

  .sb-sidebar-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
  }
  .sb-sidebar-title {
    font-family: 'Melodrama', serif;
    font-size: 20px; color: var(--text);
    margin: 0; letter-spacing: -0.2px;
  }
  .sb-collapse-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.5);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s ease; flex-shrink: 0; color: var(--text-muted);
  }
  .sb-collapse-btn:hover {
    background: var(--bg-card); border-color: var(--text-dim); color: var(--text);
  }
  .sb-collapse-btn.active { color: var(--accent); border-color: rgba(0,126,167,0.25); background: rgba(0,126,167,0.06); }

  .sb-chapter-label {
    font-size: 10.5px; text-transform: uppercase;
    letter-spacing: 1.3px; color: var(--text-dim);
    font-weight: 600; margin-top: 20px; margin-bottom: 9px; padding-left: 2px;
  }
  .sb-section-item {
    padding: 11px 14px; border-radius: var(--radius-sm);
    margin-bottom: 6px; border: 1px solid;
    display: flex; justify-content: space-between; align-items: center;
    transition: all 0.22s ease;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
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

  /* ── MOBILE BOTTOM SHEET ── */
  .sb-sheet-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 40;
    background: rgba(13,13,12,0.35);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    animation: fadeUp 0.2s ease forwards;
  }
  .sb-sheet-overlay.open { display: block; }

  .sb-sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    max-height: 75vh;
    background: rgba(247,245,240,0.97);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid var(--border);
    border-radius: 20px 20px 0 0;
    display: flex; flex-direction: column;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.32,0.72,0,1);
    box-shadow: 0 -8px 40px rgba(0,0,0,0.12);
  }
  .sb-sheet.open { transform: translateY(0); }

  .sb-sheet-handle-row {
    padding: 14px 20px 10px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border-light);
    flex-shrink: 0;
  }
  .sb-sheet-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: var(--border); margin: 0 auto 0;
    position: absolute; left: 50%; transform: translateX(-50%); top: 10px;
  }
  .sb-sheet-title {
    font-family: 'Melodrama', serif;
    font-size: 18px; color: var(--text); margin: 0;
  }
  .sb-sheet-close {
    width: 28px; height: 28px; border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.6);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--text-muted); transition: all 0.2s;
  }
  .sb-sheet-close:hover { background: var(--bg-card); color: var(--text); }

  .sb-sheet-body {
    flex: 1; overflow-y: auto; padding: 16px 20px 32px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }

  /* Progress button shown in header on mobile */
  .sb-progress-btn {
    display: none;
    align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 20px;
    border: 1px solid rgba(0,126,167,0.2);
    background: rgba(0,126,167,0.07);
    color: var(--accent); font-size: 12px; font-weight: 600;
    font-family: 'Geist', sans-serif; cursor: pointer;
    transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
  }
  .sb-progress-btn.complete {
    border-color: rgba(45,155,111,0.2);
    background: rgba(45,155,111,0.07);
    color: var(--success);
  }
  .sb-progress-btn:hover { opacity: 0.8; }

  /* ── LOADING ── */
  .sb-loading {
    min-height: 100vh; min-height: 100dvh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: var(--bg); position: relative; overflow: hidden;
  }
  .sb-loading::before {
    content: '';
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(0,157,201,0.09) 0%, transparent 65%);
    pointer-events: none;
  }
  .sb-spinner {
    width: 42px; height: 42px; border-radius: 50%;
    border: 2px solid var(--border);
    border-top: 2px solid var(--accent);
    animation: spin 0.85s linear infinite;
    margin-bottom: 24px;
    box-shadow: 0 0 18px rgba(0,126,167,0.18);
  }
  .sb-loading-title {
    font-family: 'Melodrama', serif; font-size: 26px;
    color: var(--text); margin: 0 0 8px 0; letter-spacing: -0.3px;
    text-align: center; padding: 0 24px;
  }
  .sb-loading-sub { color: var(--text-muted); font-size: 14px; margin: 0; }
  .sb-loading-bar {
    margin-top: 32px; width: 180px; height: 2px;
    background: var(--border); border-radius: 2px;
    overflow: hidden; position: relative;
  }
  .sb-loading-bar::after {
    content: ''; position: absolute; top: 0; left: 0;
    height: 100%; width: 40%;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    background-size: 200% 100%; animation: shimmer 1.6s infinite;
  }

  /* ── MOBILE OVERRIDES ── */
  @media (max-width: 768px) {
    .sb-root { flex-direction: column; }

    /* hide desktop sidebar entirely */
    .sb-sidebar        { display: none !important; }
    .sb-sidebar-reopen { display: none !important; }

    /* show the progress button in header */
    .sb-progress-btn { display: inline-flex; }

    /* hide progress pill (replaced by button) */
    .sb-progress-pill { display: none; }

    /* tighter header */
    .sb-header { padding: 12px 16px; gap: 10px; }
    .sb-avatar  { width: 34px; height: 34px; font-size: 14px; border-radius: 10px; }
    .sb-header-title    { font-size: 17px; }
    .sb-header-subtitle { display: none; }
    .sb-header-topic    { max-width: 160px; font-size: 11px; }
    .sb-header-meta     { margin-top: 3px; gap: 6px; }

    /* exit button text → icon on mobile */
    .sb-exit-label { display: none; }
    .sb-exit-icon  { display: inline !important; }

    /* messages */
    .sb-messages { padding: 16px 14px 12px; gap: 14px; }
    .sb-bubble   { max-width: 88%; padding: 12px 15px; font-size: 14px; }

    /* input */
    .sb-input-area { padding: 12px 14px 16px; }
    .sb-textarea   { font-size: 14px; padding: 12px 48px 12px 14px; min-height: 50px; }
    .sb-send-btn   { padding: 12px 18px; font-size: 13px; }
  }

  @media (max-width: 380px) {
    .sb-header-topic { display: none; }
    .sb-send-btn { padding: 12px 14px; }
  }
`;

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PanelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="10.5" y1="1.5" x2="10.5" y2="14.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
)

export default function SocraticBuilder() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingStructure, setIsLoadingStructure] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
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
    } catch (error) {
      console.error(error);
    }
    return [];
  });

  const [completedSections, setCompletedSections] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SECTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [coachingFeedback, setCoachingFeedback] = useState(null);
  const [canSend, setCanSend] = useState(true);

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
          ...projInfo, structure,
          chapters: structure.chapters.map(ch => ({ ...ch, content: '' })),
          abstract: '', references: [], projectInfo: projInfo, humanized: false
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

  // lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; }
  }, [sheetOpen]);

  const lastMessageWasDraft = messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content.includes('[SECTION_DRAFT]')
  const isChapter1Complete = messages.some(m => m.content.includes('[CHAPTER_1_COMPLETE]'))
  const MIN_WORDS = (lastMessageWasDraft || isChapter1Complete) ? 1 : 10
  const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
  const isThresholdMet = wordCount >= MIN_WORDS

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

// ============================================
// TOPIC SENTENCE COACHING SYSTEM
// ============================================

// Function to analyze topic sentence quality
const analyzeTopicSentence = (sentence) => {
  const wordCount = sentence.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  const checks = {
    length: { 
      passed: wordCount >= 15, 
      message: `${wordCount}/15 words`, 
      tip: "Add more detail to reach 15 words" 
    },
    claim: { 
      passed: false, 
      message: "Missing a clear claim", 
      tip: "Start with what you're arguing (e.g., 'Cybersecurity is weak because...')" 
    },
    evidence: { 
      passed: false, 
      message: "Missing specific evidence", 
      tip: "Add numbers, dates, or specific examples (e.g., '₦500 billion lost')" 
    },
    consequence: { 
      passed: false, 
      message: "Missing the consequence", 
      tip: "Explain what happens as a result (e.g., 'which leads to hackers getting away')" 
    }
  };
  
  // Check for claim indicators
  const claimWords = ['is', 'are', 'has', 'have', 'causes', 'leads to', 'results in', 'creates', 'because', 'due to'];
  checks.claim.passed = claimWords.some(word => sentence.toLowerCase().includes(word));
  if (checks.claim.passed) {
    checks.claim.message = "✓ Has a clear claim";
  }
  
  // Check for evidence (numbers, specific nouns, data)
  const hasNumber = /\d+/.test(sentence);
  const hasSpecificNouns = /(percent|%|million|billion|naira|₦|bank|hacker|attack|breach|law|policy|data|user|system|network|security|threat|vulnerability)/i.test(sentence);
  checks.evidence.passed = hasNumber || hasSpecificNouns;
  if (checks.evidence.passed) {
    checks.evidence.message = "✓ Includes specific evidence";
  }
  
  // Check for consequence indicators
  const consequenceWords = ['because', 'so', 'therefore', 'leads to', 'results in', 'causes', 'means that', 'which means', 'as a result'];
  checks.consequence.passed = consequenceWords.some(word => sentence.toLowerCase().includes(word));
  if (checks.consequence.passed) {
    checks.consequence.message = "✓ Shows the consequence/result";
  }
  
  const allPassed = checks.length.passed && checks.claim.passed && checks.evidence.passed && checks.consequence.passed;
  const score = Math.round((Object.values(checks).filter(c => c.passed).length / 4) * 100);
  
  return { allPassed, checks, wordCount, score };
};

// Function to get coaching tip based on analysis
const getCoachingTip = (analysis) => {
  if (analysis.allPassed) {
    return { type: 'success', message: '✅ Excellent topic sentence! Ready to generate your paragraph.' };
  }
  
  if (analysis.wordCount < 10) {
    return { type: 'warning', message: `📝 Write at least 15 words (${analysis.wordCount}/15). Be specific about your main point.` };
  }
  
  const failedChecks = Object.values(analysis.checks).filter(c => !c.passed);
  if (failedChecks.length > 0) {
    const firstFailed = failedChecks[0];
    return { type: 'info', message: `💡 ${firstFailed.tip}` };
  }
  
  return { type: 'info', message: 'Keep going! Add more specific details to strengthen your topic sentence.' };
};

// Check if AI is asking for a topic sentence (student needs to write one)
const isAskingForTopic = () => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'assistant') return false;
  
  const askingPhrases = [
    'tell me in your own words',
    'what is the main point',
    'why is this topic important',
    'what is the specific problem',
    'write at least',
    'explain your main point'
  ];
  
  return askingPhrases.some(phrase => lastMessage.content.toLowerCase().includes(phrase));
};

// Handle input changes with real-time coaching
const handleInputWithCoaching = (value) => {
  setInput(value);
  if (isAskingForTopic()) {
    const analysis = analyzeTopicSentence(value);
    setCoachingFeedback(analysis);
    setCanSend(analysis.allPassed);
  } else {
    setCanSend(true);
  }
};

// Render coaching UI (shows only when AI is asking for topic sentence)
const renderCoachingUI = () => {
  if (!isAskingForTopic()) return null;
  
  const analysis = coachingFeedback || analyzeTopicSentence(input);
  const coachingTip = getCoachingTip(analysis);
  
  return (
    <div className="coaching-panel" style={{
      marginTop: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      background: coachingTip.type === 'success' ? 'rgba(45, 155, 111, 0.1)' : 'rgba(0, 126, 167, 0.08)',
      border: `1px solid ${coachingTip.type === 'success' ? 'rgba(45, 155, 111, 0.3)' : 'rgba(0, 126, 167, 0.2)'}`,
      fontSize: '13px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 600, color: coachingTip.type === 'success' ? 'var(--success)' : 'var(--accent)' }}>
        {coachingTip.message}
      </div>
      
      {!analysis.allPassed && analysis.wordCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          <span style={{ 
            padding: '2px 10px', 
            borderRadius: '20px', 
            fontSize: '11px',
            background: analysis.checks.claim.passed ? 'rgba(45, 155, 111, 0.15)' : 'rgba(217, 79, 79, 0.1)',
            color: analysis.checks.claim.passed ? 'var(--success)' : 'var(--danger)'
          }}>
            {analysis.checks.claim.message}
          </span>
          <span style={{ 
            padding: '2px 10px', 
            borderRadius: '20px', 
            fontSize: '11px',
            background: analysis.checks.evidence.passed ? 'rgba(45, 155, 111, 0.15)' : 'rgba(217, 79, 79, 0.1)',
            color: analysis.checks.evidence.passed ? 'var(--success)' : 'var(--danger)'
          }}>
            {analysis.checks.evidence.message}
          </span>
          <span style={{ 
            padding: '2px 10px', 
            borderRadius: '20px', 
            fontSize: '11px',
            background: analysis.checks.consequence.passed ? 'rgba(45, 155, 111, 0.15)' : 'rgba(217, 79, 79, 0.1)',
            color: analysis.checks.consequence.passed ? 'var(--success)' : 'var(--danger)'
          }}>
            {analysis.checks.consequence.message}
          </span>
        </div>
      )}
      
      {/* Example of a good topic sentence - only show when struggling */}
      {analysis.wordCount > 0 && analysis.wordCount < 15 && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
          📖 <strong>Example:</strong> "Nigeria's cybersecurity is weak because the government doesn't fund NITDA properly, and hackers are stealing from banks without being caught."
        </div>
      )}
    </div>
  );
};


 const handleSend = async () => {
  // If AI is asking for a topic sentence, check coaching rules
  if (isAskingForTopic()) {
    const analysis = analyzeTopicSentence(input);
    if (!analysis.allPassed) {
      // Don't send, show error instead
      setCoachingFeedback(analysis);
      return;
    }
  }
  
  if (!isThresholdMet) return;
  
  const userMessage = input;
  setInput('');
  setCoachingFeedback(null);
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsTyping(true);
  
  try {
    const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}');
    const chapter1Structure = currentResult?.structure?.chapters?.find(c => c.number === 1) || { subsections: [] };
    const aiReply = await socraticChat(
      savedProjectInfo || currentResult?.projectInfo || {},
      chapter1Structure, messages, userMessage, currentResult?.references || []
    );
    
    if (aiReply.includes('[SECTION_DRAFT]')) {
      const outroText = aiReply.split('[/SECTION_DRAFT]')[1] || '';
      const sectionMatch = outroText.match(/(\d+\.\d+)/);
      if (sectionMatch) {
        setCompletedSections(prev => prev.includes(sectionMatch[1]) ? prev : [...prev, sectionMatch[1]]);
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
    setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
  } catch (err) {
    console.error(err);
    setMessages(prev => [...prev, { role: 'assistant', content: "I had trouble generating that. Could you rephrase your main point and try again?" }]);
  }
  setIsTyping(false);
};


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

      {/* ── MOBILE BOTTOM SHEET ── */}
      <div
        className={`sb-sheet-overlay${sheetOpen ? ' open' : ''}`}
        onClick={() => setSheetOpen(false)}
      />
      <div className={`sb-sheet${sheetOpen ? ' open' : ''}`}>
        <div className="sb-sheet-handle-row" style={{ position: 'relative' }}>
          <div className="sb-sheet-handle" />
          <h3 className="sb-sheet-title">Project Progress</h3>
          <button className="sb-sheet-close" onClick={() => setSheetOpen(false)}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="sb-sheet-body"><ProgressList chapters={projectData.chapters} completedSections={completedSections} /></div>
      </div>

      <div className="sb-root">
        <div className="sb-chat-panel" style={{ position: 'relative' }}>

          {/* ── HEADER ── */}
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
                  {/* desktop pill */}
                  <span className={`sb-progress-pill${isChapter1Complete ? ' complete' : ''}`}>
                    {isChapter1Complete ? '✓ Ch 1 Complete' : `${completedSections.length} section${completedSections.length !== 1 ? 's' : ''} done`}
                  </span>
                  {/* mobile button — opens sheet */}
                  <button
                    className={`sb-progress-btn${isChapter1Complete ? ' complete' : ''}`}
                    onClick={() => setSheetOpen(true)}
                  >
                    {isChapter1Complete ? '✓ Done' : `${completedSections.length}/${projectData.chapters.reduce((a,c) => a + (c.subsections?.length||0), 0)}`}
                    <ChevronDown />
                  </button>
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
                <span className="sb-exit-label">Exit</span>
                <span className="sb-exit-icon" style={{ display: 'none' }}>✕</span>
              </button>
              {isChapter1Complete && (
               <div style={{ display: 'flex', gap: '8px' }}>
  <button
    className="btn-primary"
    onClick={() => {
      // Save current progress
      const currentResult = sessionStorage.getItem('gradelyResult')
      if (currentResult) {
        // Here you would call an API to save to dashboard
      }
      navigate('/dashboard')
    }}
    style={{ fontSize: 13, padding: '8px 16px' }}
  >
    Save to Dashboard →
  </button>
  <button
    className="btn-accent"
    onClick={() => navigate('/results')}
    style={{ fontSize: 13, padding: '8px 16px' }}
  >
    Review Project
  </button>
</div>
              )}
              {/* panel toggle — desktop only */}
              <button
                className={`sb-collapse-btn hide-mobile${sidebarOpen ? ' active' : ''}`}
                onClick={() => setSidebarOpen(p => !p)}
                title={sidebarOpen ? 'Hide panel' : 'Show panel'}
              >
                <PanelIcon />
              </button>
            </div>
          </div>

          {/* ── MESSAGES ── */}
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
                  <div className="sb-typing-dot" /><div className="sb-typing-dot" /><div className="sb-typing-dot" />
                </div>
                Grad is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

                    {/* ── INPUT ── */}
          <div className="sb-input-area">
            <div className="sb-input-row">
              <div className="sb-textarea-wrap">
                <textarea
                  className="sb-textarea"
                  value={input}
                  onChange={e => handleInputWithCoaching(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isChapter1Complete ? "Type 'pay' to unlock chapters 2-5..."
                    : isAskingForTopic() ? "Write your main point here (at least 15 words). Be specific: What's your claim? Why does it matter? What happens as a result?"
                    : lastMessageWasDraft ? "Type 'yes' or 'next'..."
                    : "Tell Grad your thoughts in your own words..."
                  }
                  rows={3}
                />
                <div className={`sb-word-count ${isThresholdMet ? 'met' : 'unmet'}`}>
                  {isAskingForTopic() ? (
                    <span style={{ color: (coachingFeedback?.wordCount || 0) >= 15 ? 'var(--success)' : 'var(--text-dim)' }}>
                      {(coachingFeedback?.wordCount || 0)}/15 words
                    </span>
                  ) : (
                    (lastMessageWasDraft || isChapter1Complete) ? '✓' : `${wordCount}/${MIN_WORDS}`
                  )}
                </div>
              </div>
              <button
                className={`sb-send-btn ${isThresholdMet && !isTyping && (isAskingForTopic() ? canSend : true) ? 'active' : 'inactive'}`}
                onClick={handleSend}
                disabled={!isThresholdMet || isTyping || (isAskingForTopic() && !canSend)}
              >
                Send
              </button>
            </div>
            
            {/* COACHING PANEL - appears only when AI is asking for topic sentence */}
            {renderCoachingUI()}
            
          </div>
        </div>

        {/* ── DESKTOP SIDEBAR ── */}
        <div className={`sb-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
          <div className="sb-sidebar-header">
            <h3 className="sb-sidebar-title">Project Progress</h3>
          </div>
          <ProgressList chapters={projectData.chapters} completedSections={completedSections} />
        </div>

      </div>
    </>
  )
}