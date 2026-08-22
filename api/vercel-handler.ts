import { createApp } from "../server/app";

/**
 * This source is bundled into api/vercel-handler.js by the Vercel build
 * command. Keeping the application graph in one ESM artifact prevents the
 * Vercel runtime from resolving source-only extensionless imports at runtime.
 */
const handler = createApp();

export default handler;
