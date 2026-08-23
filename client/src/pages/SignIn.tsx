import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSupabase } from "@/lib/supabase";

function localizeAuthError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";
  if (/invalid login credentials/i.test(message)) return "بيانات تسجيل الدخول غير صحيحة.";
  if (/email not confirmed/i.test(message)) return "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.";
  if (/supabase is not configured/i.test(message)) return "تعذر إعداد خدمة تسجيل الدخول. حاول مرة أخرى لاحقاً.";
  return "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.";
}

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: signInError } = await requireSupabase().auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setLocation("/workspace");
    } catch (cause) {
      setError(localizeAuthError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main dir="rtl" className="sign-in-page min-h-svh bg-[#f8f4e9]">
      <section className="sign-in-card surface-card p-5 sm:p-8">
        <button className="flex items-center gap-2 text-sm text-[#7d6b3d] hover:text-[#102a43]" onClick={() => setLocation("/")}><ArrowRight className="h-4 w-4" />العودة للرئيسية</button>
        <div className="mt-8 text-center">
          <span className="geometry-mark mx-auto"><ShieldCheck className="h-5 w-5" /></span>
          <p className="mt-5 text-sm font-bold text-[#a87921]">وصول محمي</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#102a43]">تسجيل الدخول</h1>
          <p className="mt-3 text-sm leading-6 text-[#66747d]">أكّد بريدك الإلكتروني أولاً، ثم سجّل الدخول لإدارة حسابك ودورات الاختبار.</p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2"><Label htmlFor="email">البريد الإلكتروني</Label><Input id="email" dir="ltr" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="password">كلمة المرور</Label><Input id="password" dir="ltr" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></div>
          {error && <p role="alert" aria-live="polite" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button disabled={busy} className="w-full bg-[#102a43] hover:bg-[#173a59]">{busy ? "جارٍ التحقق…" : "دخول آمن"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#66747d]">ليس لديك حساب؟ <button type="button" className="inline-flex items-center gap-1 font-bold text-[#7d6b3d] underline-offset-4 hover:underline" onClick={() => setLocation("/sign-up")}><UserPlus className="h-3.5 w-3.5" />إنشاء حساب</button></p>
      </section>
    </main>
  );
}
