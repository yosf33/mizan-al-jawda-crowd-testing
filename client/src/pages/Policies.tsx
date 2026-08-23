import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

const policies = [
  {
    id: "privacy",
    title: "الخصوصية",
    body: "نستخدم بيانات الحساب والتواصل فقط لتشغيل الحساب، تقديم الدعم، وحماية نزاهة المنصة. لا تصبح تفاصيل الهوية أو وسائل الدفع أو الأدلة مرئية للعامة.",
  },
  {
    id: "terms",
    title: "شروط الاستخدام",
    body: "يجب أن تكون التقارير أصلية وقابلة لإعادة الإنتاج وضمن نطاق دورة اختبار مصرح بها. يظل قرار اعتماد التقرير والمكافأة خاضعاً لمسار الفرز والمراجعة المعروض في المنصة.",
  },
  {
    id: "evidence",
    title: "سياسة الأدلة",
    body: "ترتبط الأدلة بتقرير محدد وتخزن بشكل خاص. يقتصر الوصول على المختبر المبلّغ، والعميل المرتبط بالدورة، والمشرفين المخولين وفق الصلاحيات المعتمدة.",
  },
];

export default function Policies() {
  const [, setLocation] = useLocation();
  return <main dir="rtl" className="min-h-screen bg-[#f8f4e9] px-5 py-10 text-right md:py-16"><section className="surface-card mx-auto w-full max-w-3xl p-7 md:p-11"><Button variant="outline" onClick={() => setLocation("/")} className="border-[#d6bd75] text-[#6f5520]"><ArrowRight className="h-4 w-4" />العودة للرئيسية</Button><div className="mt-8"><span className="geometry-mark"><ShieldCheck className="h-5 w-5" /></span><p className="mt-5 text-sm font-bold text-[#a87921]">شفافية قابلة للرجوع إليها</p><h1 className="mt-2 text-3xl font-extrabold text-[#102a43]">سياسات المنصة</h1><p className="mt-3 leading-7 text-[#63717b]">نسخة موجزة للمراجعة داخل المنتج. لا تغني عن الاتفاقيات المكتوبة التي تصدرها إدارة المنصة عند توفرها.</p></div><div className="mt-10 space-y-6">{policies.map((policy) => <article id={policy.id} key={policy.id} className="scroll-mt-24 rounded-2xl border border-[#e6d9b5] bg-[#fffdf8] p-5"><h2 className="text-xl font-extrabold text-[#102a43]">{policy.title}</h2><p className="mt-3 leading-8 text-[#5f6c75]">{policy.body}</p></article>)}</div></section></main>;
}
