import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, MailCheck, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSupabase } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 12;

function localizeSignupError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";
  if (/signup is disabled|signups not allowed/i.test(message)) return "التسجيل غير متاح حالياً. يرجى المحاولة لاحقاً.";
  if (/password should be at least|password.*length/i.test(message)) return `يجب أن تتكون كلمة المرور من ${MIN_PASSWORD_LENGTH} رمزاً على الأقل.`;
  if (/invalid email/i.test(message)) return "يرجى إدخال بريد إلكتروني صالح.";
  if (/supabase is not configured/i.test(message)) return "تعذر إعداد خدمة إنشاء الحساب. حاول مرة أخرى لاحقاً.";
  return "تعذر إنشاء الحساب حالياً. تحقق من البيانات وحاول مرة أخرى.";
}

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`يجب أن تتكون كلمة المرور من ${MIN_PASSWORD_LENGTH} رمزاً على الأقل.`);
      return;
    }
    if (password !== passwordConfirmation) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);
    try {
      const { error: signupError } = await requireSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signupError) throw signupError;
      setPassword("");
      setPasswordConfirmation("");
      setConfirmationSent(true);
    } catch (cause) {
      setError(localizeSignupError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main dir="rtl" className="sign-in-page min-h-svh bg-[#f8f4e9]">
      <section className="sign-in-card surface-card p-5 sm:p-8">
        <button className="flex items-center gap-2 text-sm text-[#7d6b3d] hover:text-[#102a43]" onClick={() => setLocation("/")}>
          <ArrowRight className="h-4 w-4" />العودة للرئيسية
        </button>
        <div className="mt-8 text-center">
          <span className="geometry-mark mx-auto"><UserPlus className="h-5 w-5" /></span>
          <p className="mt-5 text-sm font-bold text-[#a87921]">انضم بأمان</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#102a43]">إنشاء حساب</h1>
          <p className="mt-3 text-sm leading-6 text-[#66747d]">فعّل بريدك الإلكتروني أولاً، ثم أكمل دورك وبياناتك في مساحة العمل.</p>
        </div>

        {confirmationSent ? (
          <div className="mt-7 rounded-xl border border-[#d9c27a] bg-[#fffbeb] p-5 text-center">
            <MailCheck className="mx-auto h-7 w-7 text-[#a87921]" />
            <h2 className="mt-3 text-lg font-extrabold text-[#102a43]">تحقق من بريدك الإلكتروني</h2>
            <p className="mt-2 text-sm leading-6 text-[#66747d]">إذا كان إنشاء الحساب متاحاً لهذا البريد، فقد أرسلنا رسالة تأكيد. افتح الرابط فيها ثم سجّل دخولك لإكمال إعداد الحساب.</p>
            <Button className="mt-5 w-full bg-[#102a43] hover:bg-[#173a59]" onClick={() => setLocation("/sign-in")}>الانتقال إلى تسجيل الدخول</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="signup-email">البريد الإلكتروني</Label>
              <Input id="signup-email" dir="ltr" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">كلمة المرور</Label>
              <Input id="signup-password" dir="ltr" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={password} onChange={event => setPassword(event.target.value)} />
              <p className="text-xs text-[#66747d]">12 رمزاً على الأقل.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password-confirmation">تأكيد كلمة المرور</Label>
              <Input id="signup-password-confirmation" dir="ltr" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} />
            </div>
            {error && <p role="alert" aria-live="polite" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button disabled={busy} className="w-full bg-[#102a43] hover:bg-[#173a59]">{busy ? "جارٍ إنشاء الحساب…" : <><UserPlus className="h-4 w-4" />إنشاء حساب آمن</>}</Button>
          </form>
        )}

        {!confirmationSent && <p className="mt-6 text-center text-sm text-[#66747d]">لديك حساب بالفعل؟ <button type="button" className="font-bold text-[#7d6b3d] underline-offset-4 hover:underline" onClick={() => setLocation("/sign-in")}>تسجيل الدخول</button></p>}
      </section>
    </main>
  );
}
