"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "ABOUT", href: "#about" },
  { name: "TOOLS", href: "#tools" },
  { name: "WORK", href: "#work" },
  { name: "CONTACT", href: "#contact" },
];

interface NavbarProps {
  showResume?: boolean;
}

export function Navbar({}: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [logoClickCount, setLogoClickCount] = useState<number>(0);
  const logoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden admin entry via 5 clicks on logo within 3 seconds
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);

    if (newCount >= 5) {
      setLogoClickCount(0);
      router.push("/admin/login");
      return;
    }

    logoTimerRef.current = setTimeout(() => {
      setLogoClickCount(0);
    }, 3000);

    // If regular single click, smooth scroll to top
    if (newCount === 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard shortcut Ctrl+Shift+A or Cmd+Shift+A for secret admin entrance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        router.push("/admin/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Active section scroll spy
  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector(item.href))
      .filter(Boolean) as HTMLElement[];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      let current = "";
      sections.forEach((sec) => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          current = `#${sec.id}`;
        }
      });
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF7F5]/90 backdrop-blur-md border-b-2 border-[#230D10] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand / Logo (Concealed Admin Entry Trigger on 5 clicks) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogoClick}
            className="text-left font-black tracking-wider text-base sm:text-lg text-[#230D10] hover:text-[#EC2929] transition-colors inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#EC2929]"
            title="Sai Dwarak / Portfolio"
            aria-label="Sai Dwarak Logo (Click to scroll to top)"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            <span className="w-2.5 h-2.5 bg-[#EC2929] inline-block" />
            <span>SAI DWARAK</span>
            {logoClickCount > 1 && (
              <span className="text-[10px] font-mono text-[#EC2929] font-normal">
                ({logoClickCount}/5)
              </span>
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 sm:gap-2"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`px-3 py-1.5 text-xs font-bold font-mono tracking-wider transition-all rounded-sm ${
                  isActive
                    ? "bg-[#230D10] text-[#FFF7F5]"
                    : "text-[#230D10] hover:text-[#EC2929] hover:bg-[#F5D9D5]/50"
                }`}
              >
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#contact"
            className="hidden sm:inline-flex items-center px-4 py-1.5 bg-[#EC2929] text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#230D10] hover:bg-[#230D10] transition-colors brutalist-shadow-sm focus-visible:ring-2 focus-visible:ring-[#EC2929]"
          >
            Connect
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 border-2 border-[#230D10] bg-[#FFF7F5] hover:bg-[#F5D9D5] transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#230D10]" />
            ) : (
              <Menu className="w-5 h-5 text-[#230D10]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-[#230D10] bg-[#FFF7F5] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-mono font-bold text-[#230D10] hover:bg-[#EC2929] hover:text-white transition-colors border border-transparent hover:border-[#230D10]"
            >
              {item.name}
            </a>
          ))}
          <div className="pt-2 border-t border-[#E8CEC9] flex justify-between items-center text-xs font-mono text-[#4A2E33]">
            <span>SAI DWARAK · HYDERABAD</span>
            <span className="text-[#EC2929] font-bold">2026</span>
          </div>
        </div>
      )}
    </header>
  );
}
