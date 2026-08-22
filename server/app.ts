import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context";
import { hasServerConfiguration } from "./env";
import { appRouter } from "./routers";

function healthPayload() {
  const configured = hasServerConfiguration();
  return { configured, ok: configured, service: "mizan-al-jawda" };
}

/**
 * Builds the request handler shared by the local Node launcher and the Vercel
 * Function. This module must never bind a port or retain request-specific state.
 */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use((_, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.get(["/healthz", "/api/health"], (_, res) => {
    const payload = healthPayload();
    res.status(payload.ok ? 200 : 503).json(payload);
  });

  app.use(express.json({ limit: "16mb" }));
  app.use(express.urlencoded({ extended: false, limit: "16mb" }));
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  return app;
}
