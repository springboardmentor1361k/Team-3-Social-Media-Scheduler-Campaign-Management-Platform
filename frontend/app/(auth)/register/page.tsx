"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Mail, Lock, User, Zap, ArrowRight, Sparkles, Globe, Shield, ChevronDown } from "lucide-react";
import { FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import Input from "@/components/ui/Input";
import { apiRegister } from "@/lib/api";
import { ALL_ROLES, UserRole, roleBadgeColor } from "@/lib/roleStore";

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const ROLE_VALUES: Record<UserRole, string> = {
  "Admin":           "administrator",
  "Content Creator": "content_creator",
  "Marketing Team":  "marketing_team",
  "Business User":   "business_user",
};

const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number",        test: (p: string) => /\d/.test(p) },
  { label: "Special char",  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const perks = [
  "Free 14-day trial — no credit card",
  "Unlimited social accounts",
  "AI-powered scheduling",
  "Advanced analytics & reporting",
  "Team collaboration tools",
];

const platforms = [
  { icon: FaTwitter,   color: "#1da1f2", bg: "rgba(29,161,242,0.12)",  name: "X (Twitter)" },
  { icon: FaInstagram, color: "#e4405f", bg: "rgba(228,64,95,0.12)",   name: "Instagram"   },
  { icon: FaLinkedin,  color: "#0077b5", bg: "rgba(0,119,181,0.12)",   name: "LinkedIn"    },
  { icon: Globe,       color: "#10b981", bg: "rgba(16,185,129,0.12)",  name: "Facebook"    },
];

const strengthMeta = [
  { label: "",       bar: "bg-transparent" },
  { label: "Weak",   bar: "bg-red-500"     },
  { label: "Fair",   bar: "bg-orange-400"  },
  { label: "Good",   bar: "bg-amber-400"   },
  { label: "Strong", bar: "bg-emerald-500" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading,       setIsLoading]       = useState(false);
  const [watchedPassword, setWatchedPassword] = useState("");
  const [selectedRole,    setSelectedRole]    = useState<UserRole>("Content Creator");
  const [roleDropOpen,    setRoleDropOpen]    = useState(false);
  const [apiError,        setApiError]        = useState("");

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const password = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError("");
    try {
      await apiRegister({
        name: data.fullName,
        email: data.email,
        password: data.password,
        role: ROLE_VALUES[selectedRole],
      });
      router.push("/login");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const strength = passwordRules.filter((r) => r.test(password)).length;
  const sm = strengthMeta[strength];

  return (
    <div className="auth-bg min-h-screen flex auth-scroll-container">
      <div className="auth-orb-1" />
      <div className="auth-orb-2" />
      <div className="auth-orb-3" />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between relative z-10" style={{ padding: "32px 48px" }}>
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#05030e] animate-pulse-glow" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white tracking-tight">SocialPilot</span>
            <span className="ml-2 text-[10px] font-bold text-violet-400 bg-violet-500/15 border border-violet-500/25 rounded-full px-2 py-0.5">FREE TRIAL</span>
          </div>
        </div>

        <div className="animate-fade-in-up delay-100" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">Join 12,000+ marketers</span>
            </div>
            <h1 className="text-[50px] font-black text-white leading-[1.05] tracking-tight mb-4">
              Start your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">free journey</span><br />
              today.
            </h1>
            <p className="text-white/45 text-base leading-relaxed max-w-xs">
              Everything you need to grow your social media presence — in one powerful platform.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {perks.map((text, i) => (
              <div key={i} className="animate-fade-in-up" style={{ display: "flex", alignItems: "center", gap: "12px", animationDelay: `${(i + 2) * 80}ms` }}>
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-[10px] font-black">✓</span>
                </div>
                <span className="text-sm text-white/65 font-medium">{text}</span>
              </div>
            ))}
          </div>

          <div className="animate-fade-in-up delay-500">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Works with</p>
            <div className="flex items-center gap-2.5">
              {platforms.map(({ icon: Icon, color, bg, name }) => (
                <div key={name} title={name} className="w-10 h-10 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform" style={{ background: bg, border: `1px solid ${color}25` }}>
                  <Icon size={18} style={{ color }} />
                </div>
              ))}
              <span className="text-white/35 text-sm font-semibold">+8 more</span>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up delay-600">
          <p className="text-[11px] text-white/30 font-medium">🔒 SOC 2 Type II Certified · GDPR Compliant · 99.9% Uptime</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[54%] flex items-center justify-center p-6 relative z-10">
        <div className="glass-card w-full max-w-[460px] p-8 md:p-10 animate-scale-in">
          <div className="flex items-center gap-2.5 mb-7 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-extrabold text-white">SocialPilot</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[28px] font-black text-white leading-tight tracking-tight mb-1.5">Create your account</h2>
            <p className="text-[13px] text-white/40">Start your free 14-day trial · No credit card required</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input id="register-full-name" label="Full Name" type="text" dark placeholder="Alexandra Chen"
              leftIcon={<User size={18} />} error={errors.fullName?.message}
              {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } })}
            />
            <Input id="register-email" label="Email address" type="email" dark placeholder="you@company.com"
              leftIcon={<Mail size={18} />} error={errors.email?.message}
              {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })}
            />

            <div className="space-y-2.5">
              <Input id="register-password" label="Password" type="password" dark placeholder="Create a strong password"
                leftIcon={<Lock size={18} />} error={errors.password?.message}
                {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" }, onChange: (e) => setWatchedPassword(e.target.value) })}
              />
              {watchedPassword.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1 flex-1">
                      {[0,1,2,3].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < strength ? sm.bar : "bg-white/10"}`} />
                      ))}
                    </div>
                    {sm.label && (
                      <span className={`text-[11px] font-bold shrink-0 ${strength <= 1 ? "text-red-400" : strength <= 2 ? "text-orange-400" : strength <= 3 ? "text-amber-400" : "text-emerald-400"}`}>
                        {sm.label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {passwordRules.map((rule, i) => (
                      <span key={i} className={`text-[11px] flex items-center gap-1 font-medium ${rule.test(watchedPassword) ? "text-emerald-400" : "text-white/30"}`}>
                        <span>{rule.test(watchedPassword) ? "✓" : "○"}</span>{rule.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input id="register-confirm-password" label="Confirm Password" type="password" dark placeholder="Repeat your password"
              leftIcon={<Lock size={18} />} error={errors.confirmPassword?.message}
              {...register("confirmPassword", { required: "Please confirm your password", validate: (val) => val === password || "Passwords do not match" })}
            />

            {/* Role Selector */}
            <div className="relative">
              <label className="text-[13px] font-semibold text-white/70 mb-1.5 block">I am a</label>
              <button type="button" onClick={() => setRoleDropOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  roleDropOpen ? "border-violet-500/50 bg-white/5" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                } text-white`}
              >
                <span className={`flex items-center gap-2 ${roleBadgeColor(selectedRole)}`}>
                  <Shield size={13} />{selectedRole}
                </span>
                <ChevronDown size={14} className={`text-white/40 transition-transform ${roleDropOpen ? "rotate-180" : ""}`} />
              </button>
              {roleDropOpen && (
                <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#0d0920] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                  {ALL_ROLES.map((r) => (
                    <button key={r} type="button" onClick={() => { setSelectedRole(r); setRoleDropOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-white/5 transition-colors ${
                        selectedRole === r ? "bg-violet-500/10" : ""
                      } ${roleBadgeColor(r)}`}
                    >
                      <Shield size={12} />{r}
                      {selectedRole === r && <span className="ml-auto text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input id="register-terms" type="checkbox" className="w-4 h-4 mt-0.5 rounded accent-violet-500 shrink-0"
                  {...register("terms", { required: "You must accept the terms to continue" })}
                />
                <span className="text-[13px] text-white/50 leading-relaxed group-hover:text-white/65 transition-colors">
                  I agree to the{" "}
                  <button type="button" className="text-violet-400 hover:text-violet-300 font-bold">Terms</button>
                  {" & "}
                  <button type="button" className="text-violet-400 hover:text-violet-300 font-bold">Privacy Policy</button>
                </span>
              </label>
              {errors.terms && <p className="text-[11px] font-semibold text-red-400 mt-1.5 ml-7">{errors.terms.message}</p>}
            </div>

            {apiError && <p className="text-[13px] font-semibold text-red-400">{apiError}</p>}

            <button id="register-submit" type="submit" disabled={isLoading}
              className="w-full h-[52px] mt-1 rounded-2xl font-bold text-[15px] text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(124,58,237,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 relative overflow-hidden"
            >
              {isLoading ? (
                <><svg className="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="10" className="opacity-30" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>Creating account…</>
              ) : (<>Create free account<ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="text-center text-[13px] text-white/35 mt-7 pt-5 border-t border-white/[0.07]">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
