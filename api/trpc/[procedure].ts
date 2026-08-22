import handler from "../vercel-handler.js";

/**
 * Vercel’s generic API catch-all serves shallow API paths, but nested tRPC
 * procedures need an explicit dynamic Function entrypoint in production.
 */
export default handler;
