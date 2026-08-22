import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireSupabase, supabase } from "@/lib/supabase";

export type AppUser = { id: string; email: string | null; name: string | null };
function mapUser(user: User | null): AppUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] ?? null };
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase) { setError(new Error("Supabase is not configured.")); setLoading(false); return; }
    let active = true;
    void supabase.auth.getUser().then(({ data, error: authError }) => { if (!active) return; setUser(mapUser(data.user)); setError(authError ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => { if (active) { setUser(mapUser(session?.user ?? null)); setLoading(false); } });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  return { user, loading, error, isAuthenticated: Boolean(user), logout: () => requireSupabase().auth.signOut() };
}
