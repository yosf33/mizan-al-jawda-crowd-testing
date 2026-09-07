import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { getDb } from "./db";
import { env } from "./env";
import { profiles } from "../drizzle/schema";
import { getSupabaseAdmin } from "./supabase";

export type AuthUser = { id: string; email: string | null; name: string | null; role: "user" | "tester" | "client" | "community_manager" | "admin" };
export type TrpcContext = { req: Request; res: Response; user: AuthUser | null };

async function verifyToken(token: string): Promise<{ id: string; email: string | null; name: string | null } | null> {
  if (env.supabaseJwtSecret) {
    try {
      const secret = new TextEncoder().encode(env.supabaseJwtSecret);
      const { payload } = await jwtVerify(token, secret);
      if (payload && typeof payload.sub === "string") {
        const userMetadata = (payload.user_metadata as Record<string, unknown> | undefined) ?? {};
        const name = typeof userMetadata.full_name === "string" ? userMetadata.full_name : null;
        const email = typeof payload.email === "string" ? payload.email : null;
        return { id: payload.sub, email, name };
      }
    } catch {
      // If local verification fails, fall through to admin client verification
    }
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  const name = typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null;
  return { id: data.user.id, email: data.user.email ?? null, name };
}

async function resolveUser(req: Request): Promise<AuthUser | null> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const verifiedUser = await verifyToken(token);
  if (!verifiedUser) return null;

  const db = getDb();
  if (!db) throw new Error("Database is not configured.");

  const { id: userId, email: userEmail, name } = verifiedUser;

  const [existing] = await db
    .select({ id: profiles.id, email: profiles.email, name: profiles.name, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (existing && existing.email === userEmail && existing.name === name) {
    return { id: existing.id, email: existing.email, name: existing.name, role: existing.role };
  }

  const [profile] = await db
    .insert(profiles)
    .values({ id: userId, email: userEmail, name })
    .onConflictDoUpdate({ target: profiles.id, set: { email: userEmail, name, updatedAt: new Date() } })
    .returning();

  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<TrpcContext> {
  return { req, res, user: await resolveUser(req) };
}
