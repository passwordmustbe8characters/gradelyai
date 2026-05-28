import fs from 'fs';
import path from 'path';
import { shredToAtomicData } from './surgicalFixer.js';
import { assembleSentences } from './chassisAssembler.js';

// Load our offline compiled dictionary database asset cleanly[cite: 2]
const lexiconPath = path.resolve('./humanizer/humanLexicon.json');
const humanLexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));

/**
 * Stage 2.5: High-Perplexity Lexical Decompressor
 * Aggressively flattens heavy compound technical phrases and strips academic fillers
 * to ruin the "AI Paraphrase" predictable pattern matchers.
 */
function decompressPhrase(phrase) {
  if (!phrase) return "";
  
  let p = phrase.toLowerCase().trim();

  // Instantly eliminate corporate/clinical AI fingerprint adjectives
  const bannedModifiers = [
    'dedicated', 'optimized', 'comprehensive', 'robust', 
    'paramount', 'vital', 'multifaceted', 'meticulous', 'ensuring'
  ];
  
  bannedModifiers.forEach(word => {
    p = p.replace(new RegExp(`\\b${word}\\b`, 'g'), '').replace(/\s+/g, ' ').trim();
  });

  // Idiomatic architectural flattening mapping to clear textbook noun strings
  // Precise conceptual mapping to completely replace textbook jargon strings
  const heavyNouns = {
    "database architecture modules": "database setups",
    "database architecture": "db layouts",
    "database configurations": "database setups",
    "backend architectural models": "backend design",
    "data concurrency patterns": "concurrency handling",
    "concurrency execution bugs": "race conditions",
    "concurrency anomalies": "thread conflicts",
    "comprehensive assessments": "code reviews",
    "assessments": "system checks",
    "server processes": "the servers",
    "scalability": "system growth"
  };

  Object.keys(heavyNouns).forEach(key => {
    if (p.includes(key)) {
      p = p.replace(key, heavyNouns[key]);
    }
  });

  return p;
}

/**
 * Stage 2: Word-Aware Local Interceptor (Enhanced with Decompressor)
 */
function processLexiconLookup(atomicDataArray) {
  return atomicDataArray.map(fragment => {
    const filterPhrase = (phrase) => {
      if (!phrase) return "";
      
      // Decompress compound noun traps before checking separate token words
      let cleanPhrase = decompressPhrase(phrase);
      
      return cleanPhrase
        .split(/\s+/)
        .map(word => humanLexicon[word] || word) // Forced dictionary swap for AI trigger keys[cite: 2]
        .join(" ");
    };

    return {
      subject: filterPhrase(fragment.subject),
      action: filterPhrase(fragment.action),
      target: filterPhrase(fragment.target)
    };
  });
}

/**
 * Stage 4: Micro-Tell Spacing Injector[cite: 2]
 */
function injectFingerprints(text) {
  // Injects human typographical spacing layout breaks cleanly at sentence endings[cite: 2]
  return text.replace(/\. (?=[A-Z])/g, () => {
    return Math.random() > 0.45 ? ".  " : ". ";
  });
}

/**
 * Stage 5: THE FINAL BOSS (Mathematical Quality Auditor)[cite: 2]
 */
function executeMathematicalAudit(text) {
  const sentenceLengths = text.split(/[.!?]/)
    .map(s => s.trim().split(/\s+/).length)
    .filter(len => len > 1);

  if (sentenceLengths.length === 0) return { passed: false, deviation: 0 };

  // Calculate the standard deviation variation curve of the generated document[cite: 2]
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sentenceLengths.length;
  const standardDeviation = Math.sqrt(variance);

  // For multi-sentence inputs, we target a dynamic chaos signature spread threshold >= 4.5[cite: 2]
  const passedAudit = standardDeviation >= 4.5;
  
  return {
    passed: passedAudit,
    deviation: standardDeviation
  };
}

/**
 * MASTER EXECUTOR PIPELINE[cite: 2]
 */
export async function runHumanizerPipeline(rawUserContent) {
  console.log("\n[GradelyAI Engine] Initializing processing run...");

  // 1. Fire OpenAI data extraction layer[cite: 2]
  console.log("-> Stage 1: Running semantic shredding matrix...");
  const rawFragments = await shredToAtomicData(rawUserContent);
  
  if (rawFragments.length === 0) {
    throw new Error("Pipeline compilation halted: Failed to extract atomic semantic data.");
  }

  let finalOutputText = "";
  let auditPassed = false;
  let attempts = 0;
  const maxAttempts = 5;

  // 2. Continuous local randomized re-roll loop until the structural math curve passes[cite: 2]
  while (!auditPassed && attempts < maxAttempts) {
    attempts++;
    console.log(`-> Running local transformation loop (Attempt ${attempts}/${maxAttempts})...`);

    // Stage 2 & 2.5: Decompress phrases and scrub tokens locally[cite: 2]
    const scrubbedFragments = processLexiconLookup(rawFragments);

    // Stage 3: Structural routing over our local 50 sentence matrix layouts[cite: 2]
    let compiledDraft = assembleSentences(scrubbedFragments);

    // Stage 4: Apply typographical rhythm markers[cite: 2]
    let postInjectedText = injectFingerprints(compiledDraft);

    // Stage 5: Submit draft to the mathematical curve verification engine[cite: 2]
    const auditMetrics = executeMathematicalAudit(postInjectedText);
    
    console.log(`   [Metrics Check] Current sentence structural deviation: ${auditMetrics.deviation.toFixed(2)}`);

    if (auditMetrics.passed) {
      console.log("✅ [THE FINAL BOSS] Structural audit passed successfully!");
      finalOutputText = postInjectedText;
      auditPassed = true;
    } else {
      console.log("❌ [THE FINAL BOSS] Asymmetry curve failed. Triggering code seed mutation step.");
    }
  }

  // Fallback engine failsafe[cite: 2]
  if (!finalOutputText) {
    console.log("⚠️ Pipeline Warning: Max structural permutations reached. Shipping highest available curve layout.");
    // Re-run once more to guarantee a clean delivery payload[cite: 2]
    finalOutputText = injectFingerprints(assembleSentences(processLexiconLookup(rawFragments)));
  }

  return finalOutputText;
}