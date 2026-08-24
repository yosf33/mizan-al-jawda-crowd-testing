import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { profiles } from "../drizzle/schema";
import { getSupabaseAdmin } from "./supabase";

export type AuthUser = { id: string; email: string | null; name: string | null; role: "user" | "tester" | "client" | "community_manager" | "admin" };
export type TrpcContext = { req: Request; res: Response; user: AuthUser | null };

async function resolveUser(req: Request): Promise<AuthUser | null> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  const db = getDb();
  if (!db) throw new Error("Database is not configured.");
  const name = typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null;
  const [profile] = await db
    .insert(profiles)
    .values({ id: data.user.id, email: data.user.email ?? null, name })
    .onConflictDoUpdate({ target: profiles.id, set: { email: data.user.email ?? null, name, updatedAt: new Date() } })
    .returning();
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<TrpcContext> {
  return { req, res, user: await resolveUser(req) };
}
