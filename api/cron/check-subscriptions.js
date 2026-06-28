// api/cron/check-subscriptions.js
export default async function handler(req, res) {
  // Hardcode the check for a second just to see if the function actually runs
  console.log("Function started successfully");
  
  return res.status(200).json({ 
    success: true, 
    message: "Function executed successfully",
    envCheck: typeof globalThis !== "undefined" && globalThis.process?.env?.CRON_SECRET ? "Secret found" : "Secret missing"
  });
}