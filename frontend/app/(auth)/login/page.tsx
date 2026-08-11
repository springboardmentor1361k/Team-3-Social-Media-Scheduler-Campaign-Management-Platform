"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Mail, Lock, BarChart2, Zap, Shield, TrendingUp,
  ArrowRight, Sparkles, Users,
} from "lucide-react";
import Input from "@/components/ui/Input";
import { setRole, UserRole } from "@/lib/roleStore";
import { apiLogin } from "@/lib/api";
import { setToken, getFrontendRole } from "@/lib/authStore";

type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const features = [
  { icon: BarChart2, title: "Real-time Analytics", desc: "Track every post's performance live across all channels.", gradient: "from-violet-500 to-purple-600" },
  { icon: Zap,       title: "Smart Scheduling",    desc: "AI picks the perfect time to maximize your reach.",       gradient: "from-amber-400 to-orange-500"  },
  { icon: Shield,    title: "Enterprise Security", desc: "SOC 2 compliant with 2FA and team access controls.",      gradient: "from-emerald-400 to-teal-500"  },
  { icon: TrendingUp,title: "AI Insights",         desc: "Get content suggestions powered by machine learning.",    gradient: "from-blue-400 to-indigo-500"   },
];

const avatars = [
  { color: "#7c3aed", letter: "A" },
  { color: "#2563eb", letter: "J" },
  { color: "#059669", letter: "M" },
  { color: "#dc2626", letter: "R" },
  { color: "#d97706", letter: "S" },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError,  setApiError]  = useState("");

  const { register, handleSubmit, formState: { errors } } =
    useForm<LoginFormData>({ defaultValues: { rememberMe: false } });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError("");
    try {
      const { access_token } = await apiLogin(data.email, data.password);
      setToken(access_token);
      const { getUser } = await import("@/lib/authStore");
      const user = getUser();
      const frontendRole = user ? getFrontendRole(user.role) as UserRole : "Content Creator";
      setRole(frontendRole);
      router.push("/dashboard");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg h-screen flex" style={{ overflow: "hidden" }}>
      <div className="auth-orb-1" />
      <div className="auth-orb-2" />
      <div className="auth-orb-3" />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[54%] flex-col justify-between p-8 lg:p-12 relative z-10">
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#07040f] animate-pulse-glow" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white tracking-tight">SocialPilot</span>
            <span className="ml-2 text-[10px] font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/25 rounded-full px-2 py-0.5">PRO</span>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8 animate-fade-in-up delay-100">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/12 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300 tracking-wide uppercase">#1 Social Media Platform</span>
            </div>
            <h1 className="text-[56px] font-black text-white leading-[1.05] tracking-tight mb-5">
              Manage all your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">social media</span><br />
              from one place.
            </h1>
            <p className="text-white/45 text-lg leading-relaxed max-w-sm">
              Schedule, analyze, and grow your brand presence across every platform — effortlessly.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc, gradient }, i) => (
              <div key={i} className="auth-feature-card animate-fade-in-up" style={{ animationDelay: `${(i + 2) * 100}ms` }}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90 leading-tight">{title}</p>
                  <p className="text-[11px] text-white/40 leading-snug mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 animate-fade-in-up delay-500">
          <div className="flex -space-x-2.5">
            {avatars.map(({ color, letter }, i) => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-[#07040f] flex items-center justify-center text-xs font-bold text-white shadow-lg" style={{ backgroundColor: color }}>
                {letter}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
              <span className="text-white/60 text-xs ml-1">5.0</span>
            </div>
            <p className="text-white/50 text-sm">Trusted by <span className="text-white font-bold">12,000+</span> marketers worldwide</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[46%] flex items-center justify-center p-6 relative z-10">
        <div className="glass-card w-full max-w-[430px] p-8 md:p-10 animate-scale-in border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-extrabold text-white">SocialPilot</span>
          </div>

          <div className="mb-7">
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight mb-2">Welcome back 👋</h2>
            <p className="text-[13px] text-white/40">Continue to your SocialPilot workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input id="login-email" label="Email address" type="email" dark placeholder="you@company.com"
              leftIcon={<Mail size={18} />} error={errors.email?.message}
              {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })}
            />
            <Input id="login-password" label="Password" type="password" dark placeholder="Enter your password"
              leftIcon={<Lock size={18} />} error={errors.password?.message}
              {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input id="login-remember-me" type="checkbox" className="w-4 h-4 rounded accent-violet-500" {...register("rememberMe")} />
                <span className="text-[13px] text-white/50">Remember me</span>
              </label>
              <button type="button" className="text-[13px] text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Forgot password?
              </button>
            </div>

            {apiError && <p className="text-[13px] font-semibold text-red-400 -mt-2">{apiError}</p>}

            <button id="login-submit" type="submit" disabled={isLoading}
              className="w-full h-[52px] mt-2 rounded-2xl relative overflow-hidden font-bold text-[15px] text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(124,58,237,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {isLoading ? (
                <><svg className="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="10" className="opacity-30" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>Signing in…</>
              ) : (<>Sign in<ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
            <div className="relative flex justify-center">
              <span className="px-4 text-[11px] font-medium text-white/25 bg-[#0c0818] rounded-full border border-white/8">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Google", gradient: "from-red-500 to-orange-400" }, { label: "Microsoft", gradient: "from-blue-600 to-blue-500" }].map(({ label, gradient }) => (
              <button key={label} type="button" className="flex items-center justify-center gap-2.5 h-11 rounded-2xl bg-white/5 border border-white/10 text-white/65 text-sm font-semibold hover:bg-white/9 hover:border-white/20 hover:text-white transition-all">
                <span className={`w-4 h-4 rounded-md bg-gradient-to-br ${gradient} inline-block flex-shrink-0`} />{label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-7 pt-6 border-t border-white/[0.06]">
            <Users className="w-3.5 h-3.5 text-white/30" />
            <p className="text-[13px] text-white/35">
              New to SocialPilot?{" "}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">Start free →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
