import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { Bell, LogOut, PanelRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export type DashboardNavItem = { label: string; path: string; icon: LucideIcon };

export default function DashboardLayout({
  children,
  title,
  roleLabel,
  navItems,
  notificationCount = 0,
}: {
  children: React.ReactNode;
  title: string;
  roleLabel: string;
  navItems: DashboardNavItem[];
  notificationCount?: number;
}) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <main dir="rtl" className="min-h-screen grid place-items-center bg-[#f8f4e9] p-6 text-right">
        <section className="surface-card w-full max-w-md p-8 text-center">
          <div className="geometry-mark mx-auto mb-5"><Sparkles className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-[#102a43]">سجّل دخولك للمتابعة</h1>
          <p className="mt-3 leading-7 text-[#58656f]">ادخل إلى مساحة العمل الآمنة لإدارة دورات الاختبار وتقارير الجودة.</p>
          <Button className="mt-7 w-full bg-[#102a43] hover:bg-[#173a59]" onClick={() => startLogin()}>تسجيل الدخول</Button>
        </section>
      </main>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f4e9] text-[#102a43]">
      <SidebarProvider defaultOpen>
        <Sidebar side="right" className="border-l border-[#ddc982]/45 bg-[#fffdf8]" collapsible="offcanvas">
          <SidebarHeader className="px-5 pb-5 pt-7">
            <button onClick={() => setLocation("/")} className="flex items-center gap-3 text-right" aria-label="العودة إلى الصفحة الرئيسية">
              <span className="geometry-mark"><Sparkles className="h-4 w-4" /></span>
              <span>
                <strong className="block text-base tracking-tight">ميزان الجودة</strong>
                <span className="text-xs text-[#a87d2e]">منصة الاختبار الجماعي</span>
              </span>
            </button>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#a87d2e]">{roleLabel}</p>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} className="h-11 rounded-xl px-3 data-[active=true]:bg-[#f5edd3] data-[active=true]:text-[#102a43]">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-[#e7dcc0] bg-[#fffdf8] p-3 text-right transition hover:bg-[#faf4e5]">
                  <Avatar className="h-9 w-9 border border-[#d6b968]">
                    <AvatarFallback className="bg-[#f2e6bf] text-xs font-bold text-[#102a43]">{user.name?.slice(0, 1).toUpperCase() || "م"}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{user.name || "عضو المنصة"}</span>
                    <span className="block truncate pt-0.5 text-xs text-[#73808a]">{user.email || "حساب موثّق"}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 text-right">
                <div dir="rtl">
                  <DropdownMenuLabel>الحساب</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                    <LogOut className="h-4 w-4" /> تسجيل الخروج
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-h-screen bg-[radial-gradient(circle_at_76%_9%,rgba(220,183,89,.14),transparent_26%),#f8f4e9]">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#e8ddc2] bg-[#f8f4e9]/90 px-5 backdrop-blur md:px-9">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" aria-label="فتح القائمة"><PanelRight className="h-5 w-5" /></SidebarTrigger>
              <div>
                <p className="text-xs text-[#a87d2e]">مساحة العمل</p>
                <h1 className="text-lg font-bold tracking-tight">{title}</h1>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative border-[#dfcc8d] bg-[#fffdf8] hover:bg-[#faf4e5]" aria-label="الإشعارات">
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 ? <span className="absolute -left-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#b94242] px-1 text-[10px] text-white">{notificationCount}</span> : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 text-right">
                <div dir="rtl">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[#67747d]">راجع مركز الإشعارات داخل لوحة التحكم.</DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="p-5 md:p-9">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
