import { defineConfig } from "drizzle-kit";
import { requirePostgresDatabaseUrl } from "./server/database-url";

const databaseUrl = requirePostgresDatabaseUrl();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
});
