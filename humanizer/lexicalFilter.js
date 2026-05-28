/**
 * STAGE 1: THE SWEEPER
 * Aggressively targets and replaces the top 120+ statistically probable AI trigger words.
 */

const aiDictionary = {
  "delve": "explore",
  "tapestry": "mix",
  "crucial": "important",
  "vital": "key",
  "beacon": "sign",
  "testament": "proof",
  "underscore": "highlight",
  "paramount": "top",
  "multifaceted": "complex",
  "navigate": "handle",
  "leverage": "use",
  "utilize": "use",
  "foster": "build",
  "catalyst": "spark",
  "seamless": "smooth",
  "robust": "strong",
  "dynamic": "active",
  "paradigm": "model",
  "holistic": "complete",
  "synergy": "teamwork",
  "intricate": "detailed",
  "nuance": "detail",
  "pivotal": "key",
  "realm": "area",
  "myriad": "many",
  "plethora": "lot",
  "embark": "start",
  "endeavor": "effort",
  "spearhead": "lead",
  "orchestrate": "organize",
  "meticulous": "careful",
  "unwavering": "steady",
  "profound": "deep",
  "resonate": "connect",
  "elevate": "raise",
  "empower": "help",
  "illuminate": "show",
  "elucidate": "explain",
  "commendable": "good",
  "imperative": "needed",
  "transformative": "changing",
  "unprecedented": "new",
  "ubiquitous": "common",
  "quintessential": "classic",
  "epitome": "best example",
  "amalgamation": "mix",
  "conundrum": "problem",
  "metamorphosis": "change",
  "symbiotic": "shared",
  "fabric": "structure",
  "woven": "mixed",
  "intertwined": "linked",
  "landscape": "field",
  "milieu": "setting",
  "zenith": "top",
  "pinnacle": "peak",
  "culmination": "end",
  "inception": "start",
  "genesis": "start",
  "impetus": "drive",
  "cornerstone": "base",
  "bedrock": "foundation",
  "linchpin": "key part",
  "vanguard": "front",
  "trailblazer": "leader",
  "pioneer": "lead",
  "innovative": "new",
  "cutting-edge": "modern",
  "bespoke": "custom",
  "tailored": "made",
  "curated": "chosen",
  "comprehensive": "full",
  "exhaustive": "thorough",
  "intelligible": "clear",
  "cognizant": "aware",
  "ascertain": "find out",
  "elicit": "get",
  "mitigate": "reduce",
  "alleviate": "ease",
  "exacerbate": "worsen",
  "ameliorate": "improve",
  "expedite": "speed up",
  "facilitate": "help",
  "streamline": "simplify",
  "optimize": "improve",
  "maximize": "increase",
  "bolster": "boost",
  "augment": "add to",
  "supplement": "add to",
  "amplify": "boost",
  "fortify": "strengthen",
  "harness": "use",
  "deploy": "use",
  "implement": "use",
  "execute": "do",
  "actualize": "make real",
  "manifest": "show",
  "epitomize": "show",
  "encapsulate": "sum up",
  "reiterate": "repeat",
  "accentuate": "highlight",
  "substantiate": "prove",
  "corroborate": "back up",
  "validate": "check",
  "verify": "check",
  "evaluate": "judge",
  "assess": "check",
  "appraise": "judge",
  "scrutinize": "examine",
  "peruse": "read",
  "perceive": "see",
  "discern": "spot",
  "distinguish": "tell apart",
  "delineate": "outline",
  "portray": "show",
  "depict": "show",
  "illustrate": "show",
  "exemplify": "show",
  "embody": "represent",
  "personify": "show",
  "encompass": "include",
  "entail": "involve",
  "necessitate": "need",
  "warrant": "justify",
  "merit": "deserve",
  "furthermore": "also",
  "moreover": "plus",
  "additionally": "also",
  "conversely": "but",
  "nevertheless": "still"
};

/**
 * Helper function to match the casing of the original word.
 * If original is "Delve", replacement becomes "Explore".
 */
function preserveCasing(original, replacement) {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original.charAt(0) === original.charAt(0).toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function runLexicalFilter(rawText, chosenProfile = 'academic') {
  let processedText = rawText;

  // Build a dynamic regex pattern that matches any of our dictionary keys as whole words
  const words = Object.keys(aiDictionary).join('|');
  const regex = new RegExp(`\\b(${words})\\b`, 'gi');

  // Replace each matched word with its equivalent, preserving the original casing
  processedText = processedText.replace(regex, (match) => {
    const lowerMatch = match.toLowerCase();
    const replacement = aiDictionary[lowerMatch];
    return preserveCasing(match, replacement);
  });

  return processedText;
}