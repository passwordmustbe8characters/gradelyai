import { processFullDocument } from './pipelineOrchestrator.js';

// A multi-paragraph sample mimicking a final year project chapter section
const sampleAcademicChapter = `
The utilization of optimized database architecture is paramount to ensuring robust scalability for enterprise applications. Furthermore, developers must delve into multifaceted backend setups to meticulously handle concurrency anomalies. Consequently, executing comprehensive assessments is vital to streamline the framework.

Moreover, the infrastructure requires deep monitoring to navigate hidden thread conflicts. Leveraging a holistic approach fosters synergy across server environments. It is imperative to underscore that unoptimized methodologies create major performance bottlenecks.
`;

async function runLocalOrchestratorTest() {
  console.log("=== STARTING GRADELYAI ORCHESTRATION TEST ===");
  
  try {
    const finalHumanizedOutput = await processFullDocument(sampleAcademicChapter);
    
    console.log("\n==========================================");
    console.log("FINAL STITCHED HUMAN OUTPUT POOL:");
    console.log("==========================================");
    console.log(finalHumanizedOutput);
    console.log("==========================================\n");
    
  } catch (error) {
    console.error("❌ Test Runner execution failed:", error);
  }
}

runLocalOrchestratorTest();