import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

describe("Supabase runtime credentials", () => {
  it("authenticates a minimal server-side administrative request", async () => {
    const url = process.env.SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    expect(url).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(secret).toMatch(/^sb_secret_/);

    const client = createClient(url!, secret!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });

    expect(error).toBeNull();
    expect(Array.isArray(data?.users)).toBe(true);
  });
});
