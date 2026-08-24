import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  Banknote,
  Bug,
  CheckCircle2,
  CircleDotDashed,
  Fingerprint,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  Workflow,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  { icon: Banknote, title: "Pay per Valid Bug", text: "نموذج مكافآت واضح؛ لا تُصرف القيمة إلا للتقرير الذي يثبت أثره." },
  { icon: Network, title: "100+ devices", text: "سياقات حقيقية متعددة لاختبار التطبيقات عبر شاشات وأنظمة واتصالات مختلفة." },
  { icon: ShieldCheck, title: "سلسلة ثقة متكاملة", text: "فرز مستقل، قرار عميل، ومحفظة موثقة لكل خطوة مالية." },
];

const steps = [
  { no: "01", title: "حدد نطاقك", text: "ينشئ العميل دورة اختبار، النسخة المستهدفة، معايير القبول، ومكافأة كل مستوى خطورة." },
  { no: "02", title: "اختبر وأثبت", text: "يوثق المختبر المشكلة بخطوات قابلة للإعادة ونتيجة متوقعة وفعلية وأدلة آمنة." },
  { no: "03", title: "اعتمد وادفع", text: "يفرز المشرف التقرير ثم يقرر العميل. تُطلق المكافأة إلى محفظة المختبر عند الاعتماد." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const goOnboard = () => setLocation(user ? "/workspace" : "/sign-up");
  const accountName = user?.name || "عضو ميزان الجودة";

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#f8f4e9] text-[#102a43]">
      <div className="golden-grid fixed inset-0 -z-0 opacity-80" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <button onClick={() => setLocation("/")} className="flex items-center gap-3" aria-label="الصفحة الرئيسية">
          <span className="geometry-mark"><Sparkles className="h-4 w-4" /></span>
          <span className="text-right"><strong className="block text-lg leading-5">ميزان الجودة</strong><small className="text-xs text-[#a87d2e]">Crowd Testing Platform</small></span>
        </button>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#566773] md:flex" aria-label="التنقل الرئيسي">
          <a href="#how">كيف تعمل؟</a>
          <a href="#trust">الثقة والأمان</a>
          <button onClick={() => setLocation("/workspace")} className="hover:text-[#a87921]">مساحة العمل</button>
        </nav>
        <div className="flex items-center gap-3">
          {user ? <div className="signed-in-identity hidden text-right md:flex"><BadgeCheck className="h-4 w-4 shrink-0 text-[#25815b]" /><div className="min-w-0"><span className="block text-xs font-bold text-[#16344d]">تم تسجيل الدخول</span><p dir="ltr">{user.email}</p></div></div> : null}
          <Button variant="outline" onClick={() => user ? setLocation("/workspace") : startLogin()} className="border-[#c7a751] bg-[#fffdf8] text-[#604a18] hover:bg-[#fbf4dd]">{user ? <><BadgeCheck className="h-4 w-4" />مساحة العمل</> : "تسجيل الدخول"}</Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div className="relative">
          {user ? <div className="signed-in-home-card mb-7 text-right"><div><span className="flex items-center gap-2 text-xs font-extrabold text-[#247552]"><BadgeCheck className="h-4 w-4" />حسابك نشط وجاهز للعمل</span><p className="mt-2 text-sm font-bold text-[#193b55]">مرحباً، {accountName}</p><span className="signed-in-home-card__email">{user.email}</span></div><Button size="sm" onClick={() => setLocation("/workspace")} className="shrink-0 bg-[#102a43] hover:bg-[#173a59]">فتح المساحة</Button></div> : null}
          <p className="eyebrow">{user ? "مساحة الجودة الخاصة بك" : "منظومة عربية لاكتشاف العيوب قبل الإطلاق"}</p>
          <h1 className="arabic-display mt-5 max-w-3xl text-[2.25rem] font-extrabold text-[#102a43] sm:text-6xl lg:text-7xl">{user ? <>كل ما تحتاجه لقيادة <span className="block text-[#b58225]">الجودة بثقة.</span></> : <>الجودة ليست مصادفة.<span className="block text-[#b58225]">إنها هندسة ثقة.</span></>}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#53626d]">{user ? "أنت مسجّل الدخول الآن. افتح مساحة العمل لمتابعة دورات الاختبار والتقارير والإشعارات والدفعات المرتبطة بحسابك." : "نربط فرق البرمجيات بمختبرين موثوقين لاكتشاف الأخطاء الوظيفية وتجارب الاستخدام الحرجة، ضمن دورة فرز ومكافآت شفافة."}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" onClick={goOnboard} className="bg-[#102a43] px-6 hover:bg-[#173a59]"><TestTube2 className="h-4 w-4" />انضم كمختبر</Button>
            <Button size="lg" variant="outline" onClick={goOnboard} className="border-[#c8a952] bg-[#fffdf8] px-6 text-[#70531c] hover:bg-[#fbf4dd]"><Target className="h-4 w-4" />أطلق دورة اختبار</Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-[#63717b]">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#a67a20]" />تغطية RTL أصلية</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#a67a20]" />أدلة محمية بالصلاحيات</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#a67a20]" />دفعات قابلة للتتبع</span>
          </div>
        </div>
        <div className="relative min-h-[410px]">
          <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" /><div className="hero-orbit hero-orbit-three" />
          <div className="absolute inset-[12%] grid place-items-center"><div className="relative grid aspect-square w-[78%] place-items-center rounded-full border border-[#d4b45e]/70 bg-[#fffdf8]/55 shadow-[0_30px_70px_rgba(41,58,71,.10)] backdrop-blur"><div className="absolute inset-[15%] rounded-full border border-[#d4b45e]/60" /><div className="absolute inset-[30%] rounded-full border border-[#d4b45e]/60" /><div className="relative z-10 text-center"><span className="geometry-mark mx-auto">{user ? <BadgeCheck className="h-5 w-5" /> : <Fingerprint className="h-5 w-5" />}</span><p className="mt-5 text-sm font-bold text-[#a87921]">{user ? "Session Active" : "Quality Signal"}</p><p className="arabic-display mt-1 text-2xl font-extrabold">{user ? "مساحتك جاهزة" : "دقة · نزاهة · أثر"}</p></div></div></div>
          <div className="absolute bottom-0 left-0 rounded-2xl border border-[#e1d3ab] bg-[#fffdf8]/95 p-4 shadow-lg backdrop-blur"><p className="text-xs text-[#8f7a44]">دورة القرار</p><p className="mt-1 flex items-center gap-2 text-sm font-bold"><Bug className="h-4 w-4 text-[#b5463c]" />تقرير <ArrowLeft className="h-3 w-3" /> فرز <ArrowLeft className="h-3 w-3" /> مكافأة</p></div>
        </div>
      </section>

      <section className="relative z-10 border-y border-[#e6dbc0] bg-[#fffdf8]/75 py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-2xl"><p className="eyebrow">لماذا ميزان الجودة؟</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">نظام واحد يحول اكتشاف العيب إلى قرار موثق.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="surface-card group p-6"><feature.icon className="h-6 w-6 text-[#b58225] transition group-hover:scale-110" /><h3 className="mt-8 text-xl font-extrabold">{feature.title}</h3><p className="mt-3 leading-7 text-[#66747d]">{feature.text}</p><ArrowUpLeft className="mt-6 h-4 w-4 text-[#b58225]" /></article>)}</div></div></section>

      <section id="how" className="relative z-10 mx-auto max-w-7xl px-5 py-24 lg:px-8"><div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]"><div><p className="eyebrow">من الشك إلى الإثبات</p><h2 className="mt-3 text-4xl font-extrabold leading-tight">عملية متوازنة تحمي وقت الفريق وحق المختبر.</h2><p className="mt-5 max-w-md leading-8 text-[#607079]">كل مرحلة مصممة لتقديم سياق تقني واضح، وحدود صلاحيات، ومسار مالي لا يسمح بالغموض.</p><div className="mt-8 rounded-2xl bg-[#102a43] p-6 text-white"><Workflow className="h-6 w-6 text-[#e8cc7a]" /><p className="mt-5 font-bold">لا دفعات بلا قرار.</p><p className="mt-2 text-sm leading-6 text-[#d7e2e9]">تتحرك المكافأة من معلّقة إلى متاحة فقط عند الاعتماد النهائي من العميل.</p></div></div><div className="space-y-4">{steps.map((step) => <article key={step.no} className="group grid grid-cols-[auto_1fr] gap-5 rounded-3xl border border-[#e5d8b8] bg-[#fffdf8]/80 p-6 transition hover:-translate-x-1 hover:border-[#c6a34b]"><span className="text-2xl font-black text-[#d5b45c]">{step.no}</span><div><h3 className="text-xl font-extrabold">{step.title}</h3><p className="mt-2 leading-7 text-[#66747d]">{step.text}</p></div></article>)}</div></div></section>

      <section id="trust" className="relative z-10 mx-auto max-w-7xl px-5 pb-24 lg:px-8"><div className="grid overflow-hidden rounded-[2rem] bg-[#102a43] text-white lg:grid-cols-[1.1fr_.9fr]"><div className="p-9 md:p-12"><p className="text-sm font-bold text-[#e3c56e]">حماية من البداية للنهاية</p><h2 className="arabic-display mt-3 text-4xl font-extrabold">ملفاتك الحساسة لا تصبح عامة أبداً.</h2><p className="mt-5 max-w-xl leading-8 text-[#d7e2e9]">تُحفظ الصور والفيديو وسجلات الأعطال كأدلة خاصة، ولا تتاح إلا للمختبر المبلّغ، والعميل المرتبط بالدورة، والمشرفين المخولين.</p><Button onClick={goOnboard} className="mt-8 bg-[#e2bf5f] text-[#102a43] hover:bg-[#f1d27b]">ابدأ الآن <ArrowLeft className="h-4 w-4" /></Button></div><div className="relative min-h-[290px] bg-[radial-gradient(circle_at_center,rgba(229,199,108,.34)_0_2px,transparent_3px),linear-gradient(135deg,rgba(255,255,255,.07),transparent)]"><div className="absolute inset-10 rounded-full border border-[#e3c56e]/60" /><div className="absolute inset-[22%] rounded-full border border-[#e3c56e]/55" /><CircleDotDashed className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-[#e3c56e]" /></div></div></section>

      <footer className="relative z-10 border-t border-[#e4d7b8] bg-[#fffdf8]/75"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-7 text-sm text-[#6b7982] md:flex-row lg:px-8"><p>© 2026 ميزان الجودة. اختبار برمجي قائم على الثقة.</p><nav className="flex gap-5" aria-label="السياسات القانونية"><a href="/policies#privacy" className="underline-offset-4 hover:text-[#102a43] hover:underline">الخصوصية</a><a href="/policies#terms" className="underline-offset-4 hover:text-[#102a43] hover:underline">شروط الاستخدام</a><a href="/policies#evidence" className="underline-offset-4 hover:text-[#102a43] hover:underline">سياسة الأدلة</a></nav></div></footer>
    </main>
  );
}
