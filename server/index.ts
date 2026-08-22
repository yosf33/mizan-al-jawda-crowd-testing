import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { createApp } from "./app";
import { closeDb } from "./db";

const app = createApp();
const port = Number(process.env.PORT || 3000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function start() {
  if (process.env.NODE_ENV === "production") {
    const publicDir = path.join(root, "dist", "public");
    app.use(express.static(publicDir, { index: false, maxAge: "1h" }));
    app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
  } else {
    const vite = await createViteServer({
      configFile: path.join(root, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  const server = app.listen(port, () => console.log(`Application listening on port ${port}`));
  const stop = async () => { server.close(); await closeDb(); process.exit(0); };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}

void start();
