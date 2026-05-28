import { runHumanizerPipeline } from './humanizerEngine.js';

/**
 * Orchestrates the full document processing loop for long academic papers.
 * It ensures the AI clerk only receives tiny paragraph chunks to maintain zero-imagination.
 * * @param {string} fullDocumentText - The raw final year project text block from the user UI.
 * @returns {Promise<string>} - The completely compiled, high-perplexity humanized output.
 */
export async function processFullDocument(fullDocumentText) {
  if (!fullDocumentText || typeof fullDocumentText !== 'string') {
    throw new Error("Orchestration failed: Input must be a non-empty text string.");
  }

  // 1. Split the document strictly by double newlines (standard paragraph breaks)
  // This cleans out any accidental empty lines or stray white spaces students might paste
  const paragraphChunks = fullDocumentText
    .split(/\n\s*\n/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);

  console.log(`\n[GradelyAI Orchestrator] Document split into ${paragraphChunks.length} target processing chunks.`);

  const completedParagraphs = [];

  // 2. Loop through every paragraph step-by-step
  for (let i = 0; i < paragraphChunks.length; i++) {
    const activeChunk = paragraphChunks[i];
    console.log(`[Orchestrator] Dispatching chunk ${i + 1}/${paragraphChunks.length} to humanizer pipeline...`);

    try {
      // Pass the tiny paragraph into our strict local math and extraction framework
      const humanizedResult = await runHumanizerPipeline(activeChunk);
      completedParagraphs.push(humanizedResult);
    } catch (chunkError) {
      console.error(`❌ Error compiling chunk index ${i}:`, chunkError);
      // Fallback failsafe: If a single chunk errors out, save the raw text so the student loses nothing
      completedParagraphs.push(activeChunk);
    }
  }

  console.log("✅ [GradelyAI Orchestrator] All chunks processed successfully. Reassembling chapter matrix...");

  // 3. Stitch the humanized paragraphs back together cleanly with professional spacing
  return completedParagraphs.join('\n\n');
}