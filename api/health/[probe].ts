import handler from "../vercel-handler.js";

/**
 * Vercel requires an explicit nested Function entrypoint for the data-free
 * database-readiness probe at /api/health/database.
 */
export default handler;
