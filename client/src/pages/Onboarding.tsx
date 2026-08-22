import { useAuth } from "@/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, ShieldCheck, Smartphone, TestTube2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const payoutLabels = { instapay: "Instapay", vodafone_cash: "Vodafone Cash", paypal: "PayPal", bank_transfer: "bank transfer" } as const;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"tester" | "client">("tester");
  const [form, setForm] = useState({ country: "", phoneNumber: "", payoutMethod: "instapay" as keyof typeof payoutLabels, payoutDetails: "", deviceType: "mobile" as "mobile" | "desktop" | "tablet", brandModel: "", osName: "android" as "android" | "ios" | "windows" | "macos" | "linux", osVersion: "" });
  const onboarding = trpc.account.onboarding.useMutation({ onSuccess: () => { toast.success("تم إعداد الحساب بنجاح."); setLocation("/workspace"); }, onError: error => toast.error(error.message) });
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));

  if (loading) return <div className="min-h-screen bg-[#f8f4e9]" />;
  if (!user) {
    return <main dir="rtl" className="min-h-screen grid place-items-center bg-[#f8f4e9] p-6"><section className="surface-card max-w-md p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#b8882e]" /><h1 className="mt-4 text-2xl font-bold">ابدأ من حساب موثّق</h1><p className="mt-2 text-[#65727c]">نسجّل الهوية أولاً لحماية المشاريع والمكافآت.</p><Button className="mt-6 w-full bg-[#102a43]" onClick={() => startLogin()}>تسجيل الدخول</Button></section></main>;
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#f8f4e9] px-5 py-10 text-right md:py-16">
      <div className="golden-grid absolute inset-0 opacity-70" />
      <section className="relative mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-[#e6d9b5] bg-[#fffdf8]/95 shadow-[0_25px_70px_rgba(25,45,65,.10)] md:grid-cols-[.8fr_1.2fr]" style={{ direction: "rtl" }}>
        <aside className="bg-[#102a43] p-8 text-[#fffdf8] md:p-11">
          <div className="geometry-mark bg-[#f0d37d] text-[#102a43]"><ShieldCheck className="h-5 w-5" /></div>
          <p className="mt-8 text-sm text-[#e7cf88]">بوابة الانضمام</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight">نبني جودةً يمكن قياسها.</h1>
          <p className="mt-5 leading-8 text-[#dbe4ea]">اختر مسارك، ثم نهيّئ مساحة العمل الخاصة بك ضمن بيئة تحمي التقارير والأدلة المالية.</p>
          <div className="mt-10 space-y-4 text-sm text-[#dbe4ea]"><p className="flex items-center gap-3"><TestTube2 className="h-4 w-4 text-[#e7cf88]" />تقارير منظمة وأدلة مشفّرة</p><p className="flex items-center gap-3"><CircleDollarSign className="h-4 w-4 text-[#e7cf88]" />محفظة وسجل مالي واضح</p><p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#e7cf88]" />صلاحيات منفصلة لكل دور</p></div>
        </aside>
        <section className="p-7 md:p-11">
          <button className="mb-8 flex items-center gap-2 text-sm text-[#7d6b3d] hover:text-[#102a43]" onClick={() => setLocation("/")}><ArrowRight className="h-4 w-4" />العودة للرئيسية</button>
          <p className="text-sm font-semibold text-[#ad812c]">مرحباً، {user.name || "عضو المنصة"}</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102a43]">اختر الدور المناسب</h2><p className="mt-2 text-[#6d7880]">يمكن لمسؤولي المنصة فقط منح دور المشرف حفاظاً على نزاهة الفرز والدفعات.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button onClick={() => setRole("tester")} className={`rounded-2xl border p-4 text-right transition ${role === "tester" ? "border-[#b98c30] bg-[#fbf3d8] shadow-sm" : "border-[#e7dcc0] hover:border-[#cfb367]"}`}><TestTube2 className="h-5 w-5 text-[#a87921]" /><strong className="mt-3 block">مختبر</strong><span className="mt-1 block text-xs leading-5 text-[#6d7880]">أبلغ عن الأخطاء واكسب مقابل التقرير الصحيح.</span></button>
            <button onClick={() => setRole("client")} className={`rounded-2xl border p-4 text-right transition ${role === "client" ? "border-[#b98c30] bg-[#fbf3d8] shadow-sm" : "border-[#e7dcc0] hover:border-[#cfb367]"}`}><BriefcaseBusiness className="h-5 w-5 text-[#a87921]" /><strong className="mt-3 block">عميل</strong><span className="mt-1 block text-xs leading-5 text-[#6d7880]">أنشئ دورات اختبار، وراجع التقارير المعتمدة.</span></button>
          </div>
          {role === "tester" ? <div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="الدولة"><Input value={form.country} onChange={e => update("country", e.target.value)} placeholder="مثال: مصر" /></Field><Field label="رقم الهاتف"><Input value={form.phoneNumber} onChange={e => update("phoneNumber", e.target.value)} placeholder="للتواصل عند الحاجة" /></Field><Field label="طريقة التحويل"><select value={form.payoutMethod} onChange={e => update("payoutMethod", e.target.value)} className="rtl-select">{Object.entries(payoutLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="بيانات التحويل"><Input value={form.payoutDetails} onChange={e => update("payoutDetails", e.target.value)} placeholder="رقم الحساب أو المعرف" /></Field><div className="sm:col-span-2 mt-2 flex items-center gap-2 text-sm font-bold text-[#102a43]"><Smartphone className="h-4 w-4 text-[#b8882e]" />الجهاز الأول</div><Field label="نوع الجهاز"><select value={form.deviceType} onChange={e => update("deviceType", e.target.value)} className="rtl-select"><option value="mobile">هاتف</option><option value="desktop">حاسوب</option><option value="tablet">لوحي</option></select></Field><Field label="العلامة والطراز"><Input value={form.brandModel} onChange={e => update("brandModel", e.target.value)} placeholder="مثال: Samsung S23" /></Field><Field label="نظام التشغيل"><select value={form.osName} onChange={e => update("osName", e.target.value)} className="rtl-select"><option value="android">Android</option><option value="ios">iOS</option><option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option></select></Field><Field label="إصدار النظام"><Input value={form.osVersion} onChange={e => update("osVersion", e.target.value)} placeholder="مثال: 14" /></Field></div> : <p className="mt-7 rounded-2xl border border-[#e3d3a7] bg-[#fffbef] p-5 leading-7 text-[#5c6670]">ستتمكن بعد الإعداد من إنشاء مشاريع ودورات اختبار، وتحديد النطاق والمكافآت لكل مستوى خطورة.</p>}
          <Button disabled={onboarding.isPending} onClick={() => onboarding.mutate(role === "tester" ? { role, country: form.country || undefined, phoneNumber: form.phoneNumber || undefined, payoutMethod: form.payoutMethod, payoutDetails: form.payoutDetails, device: { deviceType: form.deviceType, brandModel: form.brandModel, osName: form.osName, osVersion: form.osVersion } } : { role })} className="mt-8 w-full bg-[#102a43] hover:bg-[#173a59]">{onboarding.isPending ? "يجري إعداد الحساب..." : "دخول مساحة العمل"}</Button>
        </section>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-[#334e68]">{label}</span>{children}</label>; }
