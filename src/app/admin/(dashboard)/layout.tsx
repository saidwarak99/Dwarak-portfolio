import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  FolderKanban,
  Wrench,
  FileText,
  Image as ImageIcon,
  Settings,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { connection } from "next/server";
import { getAuthenticatedAdmin, getSessionUser } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";

export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const admin = await getAuthenticatedAdmin();

  // 1. If no authenticated admin, inspect if user is logged in as non-admin
  if (!admin) {
    const sessionUser = await getSessionUser();

    // Case A: Completely unauthenticated -> Redirect to login
    if (!sessionUser) {
      redirect("/admin/login");
    }

    // Case B: Authenticated, but not allowlisted in admin_users -> Show Unauthorized Screen
    return (
      <div className="min-h-screen bg-[#FFF7F5] flex flex-col justify-center items-center p-4 selection:bg-[#EC2929] selection:text-white editorial-grid">
        <div className="w-full max-w-lg border-2 border-[#230D10] bg-white p-8 brutalist-shadow-lg relative">
          <div className="absolute top-2 left-2 text-xs font-mono text-[#EC2929]">[!]</div>
          <div className="absolute top-2 right-2 text-xs font-mono text-[#EC2929]">[!]</div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 border-2 border-[#230D10] bg-[#FFF0F0] flex items-center justify-center text-[#EC2929] brutalist-shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#EC2929] uppercase tracking-wider">
                Access Denied • 403 Forbidden
              </span>
              <h1 className="text-xl font-black text-[#230D10] uppercase">
                UNAUTHORIZED ACCOUNT
              </h1>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#230D10] font-mono border-t border-b border-[#E8CEC9] py-4 my-4">
            <p className="text-[#4A2E33] leading-relaxed">
              You are authenticated with Supabase as:
            </p>
            <div className="p-3 bg-[#F5D9D5] border border-[#230D10] font-bold break-all">
              {sessionUser.email}
            </div>
            <p className="text-[#4A2E33] leading-relaxed">
              This user ID (<code className="text-[10px] bg-gray-100 px-1 py-0.5">{sessionUser.id}</code>) is <strong>not present in the <code className="bg-[#F5D9D5] px-1 py-0.5">public.admin_users</code> allowlist</strong>.
            </p>
            <p className="text-[#4A2E33] leading-relaxed">
              Only allowlisted administrators may access the CMS dashboard or execute administrative operations.
            </p>
          </div>

          <form action={signOutAction} className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              <LogOut className="w-4 h-4" />
              <span>SIGN OUT & SWITCH ACCOUNT</span>
            </button>
            <Link
              href="/"
              className="py-2.5 px-4 bg-[#FFF7F5] text-[#230D10] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm"
            >
              <span>RETURN HOME</span>
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated Administrator Shell
  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Projects CMS", href: "/admin/projects", icon: FolderKanban },
    { label: "Tools & Tech", href: "/admin/tools", icon: Wrench },
    { label: "Build Logs", href: "/admin/posts", icon: FileText },
    { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FFF7F5] text-[#230D10] flex flex-col selection:bg-[#EC2929] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b-2 border-[#230D10] bg-[#FFF7F5]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 border-2 border-[#230D10] bg-[#EC2929] text-white flex items-center justify-center font-black text-sm brutalist-shadow-sm">
                SD
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-[#EC2929] uppercase tracking-wider leading-none">
                  ADMIN PORTAL
                </span>
                <span
                  className="text-base font-black text-[#230D10] uppercase tracking-tight group-hover:text-[#EC2929] transition-colors leading-tight"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Sai Dwarak
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block border border-[#230D10] bg-[#E8F8EE] text-[#166534] text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-none">
              {admin.role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}
            </span>
          </div>

          {/* User Details & Sign Out */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs font-mono font-bold text-[#4A2E33] hover:text-[#EC2929] px-2.5 py-1.5 border border-[#230D10] bg-white transition-colors brutalist-shadow-sm"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[11px] font-mono text-[#230D10] font-bold truncate max-w-[180px]">
                {admin.email}
              </span>
              <span className="text-[9px] font-mono text-[#166534] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#166534]" />
                RLS Guard Active
              </span>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign Out"
                className="p-2 border-2 border-[#230D10] bg-white text-[#230D10] hover:bg-[#FFF0F0] hover:text-[#EC2929] transition-colors brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-[#E8CEC9] bg-white/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar py-1.5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] hover:bg-[#F5D9D5]/50 border border-transparent hover:border-[#230D10] transition-all whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#EC2929]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-[#E8CEC9] bg-white/50 py-4 text-center text-xs font-mono text-[#4A2E33]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sai Dwarak Portfolio Admin Engine • Phase 3A</span>
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
            PostgreSQL Row Level Security Verified
          </span>
        </div>
      </footer>
    </div>
  );
}
