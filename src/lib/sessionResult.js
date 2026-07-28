// A full project (5 chapters of text, abstract, references, structure) can run
// close to or past sessionStorage's ~5-10MB per-origin quota, especially on
// Safari/mobile where the limit is tighter. When that happens, the browser
// throws synchronously and — since this is called after every chapter and on
// every edit — an uncaught throw here was taking down the whole generation
// flow with no way to recover except starting over. Persisting to session is
// a convenience cache for reloads; the real source of truth is the DB save
// (`updateProject`), so a failed write here should degrade quietly, not crash.
export function saveResultToSession(data) {
  try {
    sessionStorage.setItem('gradelyResult', JSON.stringify(data))
    return true
  } catch (err) {
    console.error('Could not cache project to sessionStorage (continuing without it):', err)
    return false
  }
}
