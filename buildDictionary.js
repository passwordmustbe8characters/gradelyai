import fs from 'fs';
import natural from 'natural';

console.log("Initializing WordNet Database Compiler...");

// Zero arguments needed — natural automatically detects your local wordnet-db package!
const wordnet = new natural.WordNet();
const humanLexicon = {};

// 1. The Hardcoded Anti-AI Priority Filter (Known detector triggers)
const strictAiOverrides = {
  "utilization": "use", "utilize": "use", "paramount": "key", "robust": "solid",
  "multifaceted": "complex", "delve": "look into", "tapestry": "mix", "spearhead": "lead",
  "transformative": "deep", "conducted": "did", "concerning": "about", "furthermore": "also",
  "moreover": "plus", "additionally": "and", "consequently": "so", "subsequently": "later",
  "pivotal": "major", "crucial": "important", "vital": "key", "underscore": "highlight",
  "testament": "proof", "beacon": "sign", "navigate": "handle", "leverage": "use",
  "foster": "build", "catalyst": "spark", "seamless": "smooth", "dynamic": "active",
  "paradigm": "model", "holistic": "complete", "synergy": "teamwork", "intricate": "detailed",
  "nuance": "detail", "realm": "area", "myriad": "many", "plethora": "lot", "embark": "start",
  "endeavor": "effort", "orchestrate": "organize", "meticulous": "careful", "unwavering": "steady",
  "profound": "deep", "resonate": "connect", "elevate": "raise", "empower": "help",
  "illuminate": "show", "elucidate": "explain", "imperative": "needed", "unprecedented": "new",
  "ubiquitous": "common", "optimizing": "speeding up", "concurrency": "parallel runs",
  "infrastructure": "setups", "framework": "system", "methodology": "approach"
};

// Seed words to crawl the local database for synonyms (academic & technical verbs/adjectives)
const coreSeeds = [
  "accelerate", "achieve", "analyze", "assessment", "autonomous", "capacity", "classify",
  "cognizant", "collaborate", "comprehensive", "determine", "distinct", "elements", "eliminate",
  "evaluate", "execute", "factors", "formulate", "generate", "identify", "incorporate",
  "indicate", "initial", "isolate", "manifest", "objective", "obtain", "perceive", "phenomenon",
  "precise", "primary", "rationale", "requirement", "retain", "sequence", "significant",
  "simultaneous", "strategy", "subsequent", "sufficient", "terminate", "variable", "verify"
];

// Seed the dictionary with our custom overrides first
Object.assign(humanLexicon, strictAiOverrides);

function compileMassiveLexicon() {
  if (coreSeeds.length === 0) {
    saveDictionaryJSON();
    return;
  }

  const currentWord = coreSeeds.pop();

  wordnet.lookup(currentWord, (results) => {
    // If wordnet returns data, unpack the full synonym ring
    if (results) {
      results.forEach((result) => {
        result.synonyms.forEach((synonym) => {
          const cleanSynonym = synonym.toLowerCase().replace(/_/g, " ");
          
          // If it's a multi-word or complex term, map it to our current simple seed
          if (cleanSynonym.length > 3 && cleanSynonym !== currentWord && !humanLexicon[cleanSynonym]) {
            humanLexicon[cleanSynonym] = currentWord;
          }
        });
      });
    }
    
    // Recursive call to handle async database lookups sequentially
    compileMassiveLexicon();
  });
}

function saveDictionaryJSON() {
  try {
    if (!fs.existsSync('./humanizer')) {
      fs.mkdirSync('./humanizer');
    }
    
    fs.writeFileSync('./humanizer/humanLexicon.json', JSON.stringify(humanLexicon, null, 2));
    console.log(`\n✅ Legit Data Compilation Complete!`);
    console.log(`-> Saved ${Object.keys(humanLexicon).length} word-mapping configurations to ./humanizer/humanLexicon.json`);
  } catch (error) {
    console.error("Failed to write lexicon file:", error);
  }
}

// Fire off the compiler loop
compileMassiveLexicon();