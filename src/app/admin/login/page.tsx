"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, Loader2, LogOut } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setCurrentUser(data.user.email);
        }
      });
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        "Supabase is not yet configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setErrorMessage("Could not initialize Supabase client.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        setSuccessMessage(`Authenticated as ${data.user.email}. Checking administrator status...`);
        setCurrentUser(data.user.email ?? null);
        // In Phase 3, redirect to /admin dashboard
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSuccessMessage("Signed out successfully.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F5] flex flex-col justify-center items-center p-4 selection:bg-[#EC2929] selection:text-white editorial-grid">
      <div className="w-full max-w-md border-2 border-[#230D10] bg-[#FFF7F5] p-8 brutalist-shadow-lg relative">
        {/* Corner Marks */}
        <div className="absolute top-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
        <div className="absolute top-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
        <div className="absolute bottom-2 left-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>
        <div className="absolute bottom-2 right-2 text-xs font-mono text-[#EC2929] select-none">[+]</div>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 border-2 border-[#230D10] bg-[#F5D9D5] flex items-center justify-center text-[#EC2929] brutalist-shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#EC2929]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Concealed Entry Point</span>
            </div>
            <h1
              className="text-2xl font-black text-[#230D10] uppercase tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              CMS ADMIN PORTAL
            </h1>
          </div>
        </div>

        {/* Informative Security Notice */}
        <div className="border border-[#230D10] bg-white p-4 mb-6 text-xs text-[#230D10] space-y-2">
          <div className="flex items-center gap-1.5 font-mono font-bold text-[#EC2929]">
            <ShieldCheck className="w-4 h-4" />
            <span>SUPABASE AUTHENTICATION GATE</span>
          </div>
          <p className="text-[#4A2E33] leading-relaxed">
            The logo gesture or shortcut reveals this sign-in interface. Real CMS access requires verified Supabase Auth credentials and explicit allowlisting in the <code className="bg-[#F5D9D5] px-1 py-0.5 rounded font-mono">admin_users</code> database table.
          </p>
          {!configured && (
            <div className="pt-2 border-t border-[#E8CEC9] text-[#EC2929] font-mono text-[11px] font-bold">
              • Status: Supabase not configured in .env.local (Running in safe fallback mode)
            </div>
          )}
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 border-2 border-[#EC2929] bg-[#FFF0F0] flex items-start gap-2.5 text-xs text-[#EC2929] font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 border-2 border-[#230D10] bg-[#E8F8EE] flex items-start gap-2.5 text-xs text-[#166534] font-mono">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Active Session Display */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 border border-[#230D10] bg-white text-xs font-mono space-y-1">
              <span className="text-[#4A2E33] uppercase">Current Session:</span>
              <p className="font-bold text-[#230D10] break-all">{currentUser}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 bg-[#FFF7F5] text-[#230D10] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#F5D9D5] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SIGN OUT</span>
            </button>
          </div>
        ) : (
          /* Sign-in Form */
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sai@domain.com"
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono text-[#230D10] focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#230D10] uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border-2 border-[#230D10] bg-white text-xs font-mono text-[#230D10] focus:outline-none focus:ring-2 focus:ring-[#EC2929]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#D01C1C] transition-colors flex items-center justify-center gap-2 brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>SIGN IN TO CMS</span>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-[#E8CEC9] text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#230D10] hover:text-[#EC2929] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO PUBLIC PORTFOLIO</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
