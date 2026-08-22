import handler from "./vercel-handler.js";

/**
 * Vercel detects this catch-all API file and invokes the exported Express app
 * for every /api/* request. No listener is started in the serverless runtime.
 */
export default handler;
