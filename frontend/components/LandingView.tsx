"use client";

import Link from "next/link";
import { Zap, Sparkles, BarChart3, Clock, Shield, TrendingUp } from "lucide-react";

export default function LandingView() {
  return (
    <div className="min-h-screen auth-bg selection:bg-violet-500/20 selection:text-violet-200">
      <div className="auth-orb-1" />
      <div className="auth-orb-2" />
      <div className="auth-orb-3" />

      {/* Nav */}
      <header className="relative z-10">
        <nav
          className="flex items-center justify-between px-6 py-5 max-w-7xl"
          style={{ margin: "0 auto" }}
        >
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">SocialPilot</span>
            <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/25 rounded-full px-2 py-0.5">PRO</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-sm font-semibold text-white/70 hover:text-white transition-colors h-10 leading-none"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 sm:px-5 h-10 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-indigo-500 transition-all leading-none"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="relative z-10 px-6 pt-12 sm:pt-20 pb-16 sm:pb-32 max-w-4xl"
        style={{ margin: "0 auto", textAlign: "center" }}
      >
        <div
          className="bg-violet-500/12 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in-up"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 tracking-wide uppercase">
            Trusted by 12,000+ marketers
          </span>
        </div>

        <h1
          className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up delay-100"
          style={{ textAlign: "center" }}
        >
          Scale your social media
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
            strategy effortlessly
          </span>
        </h1>

        <p
          className="text-sm sm:text-lg text-white/50 leading-relaxed max-w-2xl mb-6 sm:mb-10 animate-fade-in-up delay-200"
          style={{ textAlign: "center", margin: "0 auto 2.5rem auto" }}
        >
          Schedule posts, analyze performance, and manage all your brand accounts in one
          centralized dashboard. Take control of your digital presence today.
        </p>

        <div
          className="animate-fade-in-up delay-300"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}
        >
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-2"
          >
            Start free trial <Sparkles className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all"
          >
            Sign in →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        className="relative z-10 max-w-5xl px-6 pb-32"
        style={{ margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Clock,      title: "Visual Content Calendar",   desc: "Plan your entire month at a glance. Drag and drop posts, manage queues, and ensure consistent delivery.",        gradient: "from-violet-500 to-purple-600" },
            { icon: BarChart3,  title: "Advanced Analytics",        desc: "Track engagement, follower growth, and campaign success with beautiful, easy-to-understand metrics.",           gradient: "from-blue-500 to-indigo-600"   },
            { icon: TrendingUp, title: "Campaign Management",       desc: "Create, schedule and monitor all your marketing campaigns with budget tracking and ROI insights.",              gradient: "from-emerald-500 to-teal-600"  },
            { icon: Shield,     title: "Role-Based Access",         desc: "Assign Admin, Creator, Marketing or Business roles. Each user sees only what they need.",                       gradient: "from-amber-500 to-orange-600"  },
            { icon: Zap,        title: "Smart Scheduling",          desc: "AI picks the perfect time to maximize your reach across every connected platform.",                             gradient: "from-pink-500 to-rose-600"     },
            { icon: Sparkles,   title: "Multi-Platform Support",    desc: "Connect Twitter, Instagram, LinkedIn, Facebook, YouTube and Pinterest — all in one place.",                     gradient: "from-cyan-500 to-blue-600"     },
          ].map(({ icon: Icon, title, desc, gradient }, i) => (
            <div
              key={i}
              className="auth-feature-card animate-fade-in-up"
              style={{ animationDelay: `${(i + 4) * 80}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/90 leading-tight mb-1">{title}</p>
                <p className="text-[12px] text-white/40 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <div className="relative z-10 pb-20 px-6" style={{ textAlign: "center" }}>
        <p className="text-white/30 text-sm font-medium">
          🔒 SOC 2 Type II Certified · GDPR Compliant · 99.9% Uptime
        </p>
      </div>
    </div>
  );
}
