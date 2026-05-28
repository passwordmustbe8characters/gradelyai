import { runHumanizerPipeline } from './humanizer/humanizerEngine.js';

// Simulated high-density complex document input pasted by a user
const sampleEssayInput = `
The utilization of advanced database configurations is paramount to optimizing server processes when workloads experience significant escalation. Furthermore, implementing robust backend architectural models fosters substantial scalability. Consequently, developers must conduct comprehensive assessments concerning data concurrency patterns to ensure smooth operations.
`;

async function executeProductionTest() {
  console.log("==================================================");
  console.log("GRADELYAI LIVE PIPELINE PRODUCTION INTEGRATION TEST");
  console.log("==================================================");
  
  try {
    const finalHumanizedResult = await runHumanizerPipeline(sampleEssayInput);
    
    console.log("\n==================================================");
    console.log("FINAL PRODUCTION RE-WRITTEN TEXT DELIVERY POOL:");
    console.log("==================================================");
    console.log(finalHumanizedResult);
    console.log("==================================================\n");
    
  } catch (error) {
    console.error("Live environment compilation failed:", error.message);
  }
}

executeProductionTest();