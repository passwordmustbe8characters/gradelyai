import { assembleSentences } from './humanizer/chassisAssembler.js';

// MOCK DATA: This simulates exactly what OpenAI will return to us for pennies later
const mockAiIngredients = [
  { subject: "database configurations", action: "speeding up", target: "server processes" },
  { subject: "caching layers", action: "saving", target: "expensive API call tracking" }
];

function runFingerprintInjector(text) {
  // Safe Token-Aware boundary injection: Adds human double spaces after periods
  return text.replace(/\. (?=[A-Z])/g, ".  ");
}

function runFinalBossAuditor(text) {
  console.log("\n[THE FINAL BOSS] Commencing strict quality check...");
  
  // Calculate true human standard deviation burstiness
  const sentenceLengths = text.split(/[.!?]/).map(s => s.trim().split(/\s+/).length).filter(l => l > 1);
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sentenceLengths.length;
  const standardDeviation = Math.sqrt(variance);

  console.log(`-> Calculated Sentence Variance Burstiness: ${standardDeviation.toFixed(2)}`);
  
  if (standardDeviation < 5.0) {
    console.log("❌ [AUDIT FAILED] Text is too mathematically uniform. Re-rolling logic...");
    return false;
  }
  
  console.log("✅ [AUDIT PASSED] Text matches strict human structural chaos metrics.");
  return true;
}

// EXECUTE THE PIPELINE SIMULATION
console.log("[Simulation] Starting local assembly engine...");
let assembledText = assembleSentences(mockAiIngredients);
let humanizedText = runFingerprintInjector(assembledText);

console.log("\n--- GENERATED TEXT OUTPUT ---");
console.log(humanizedText);
console.log("----------------------------");

runFinalBossAuditor(humanizedText);