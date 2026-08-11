"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Camera, Mail, Phone, FileText, User,
  Edit3, Save, X, Lock, LogOut,
  ChevronDown, Shield, Sparkles,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiGetMe, apiListAccounts, apiChangePassword, UserOut, SocialAccountOut } from "@/lib/api";

type ProfileFormData = {
  fullName: string; email: string; phone: string; bio: string;
};
type PasswordFormData = {
  currentPassword: string; newPassword: string; confirmPassword: string;
};

const statItems = [
  { label: "Posts Published",  value: "48"    },
  { label: "Total Reach",      value: "61.1K" },
  { label: "Avg. Engagement",  value: "5.8%"  },
  { label: "Active Campaigns", value: "3"     },
];

export default function ProfileView() {
  const router = useRouter();
  const [isEditing,     setIsEditing]     = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isSavingPw,    setIsSavingPw]    = useState(false);
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [pwSuccess,     setPwSuccess]     = useState(false);
  const [pwError,       setPwError]       = useState("");
  const [currentUser,   setCurrentUser]   = useState<UserOut | null>(null);
  const [accounts,      setAccounts]      = useState<SocialAccountOut[]>([]);

  useEffect(() => {
    apiGetMe().then((u) => {
      setCurrentUser(u);
      resetProfile({ fullName: u.name, email: u.email, phone: "", bio: "" });
    }).catch(() => {});
    apiListAccounts().then(setAccounts).catch(() => {});
  }, []);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors }, reset: resetProfile } =
    useForm<ProfileFormData>({
      defaultValues: { fullName: "", email: "", phone: "", bio: "" },
    });

  const { register: regPw, handleSubmit: handlePw, watch: watchPw, reset: resetPw, formState: { errors: pwErrors } } =
    useForm<PasswordFormData>();
  const newPw = watchPw("newPassword", "");

  const onSaveProfile = async (_data: ProfileFormData) => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSaving(false); setIsEditing(false); setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const onSavePassword = async (data: PasswordFormData) => {
    setIsSavingPw(true);
    setPwError("");
    try {
      await apiChangePassword(data.currentPassword, data.newPassword);
      resetPw();
      setShowPwSection(false);
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsSavingPw(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 lg:space-y-10">
      {saveSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-fade-in-up text-sm font-semibold border border-emerald-500/20">
          ✓ Profile saved successfully
        </div>
      )}
      {pwSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-fade-in-up text-sm font-semibold border border-emerald-500/20">
          ✓ Password updated successfully
        </div>
      )}

      {/* Profile Hero */}
      <div className="dash-card overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 mb-5">
            <div className="relative group w-fit">
              <Avatar name={currentUser?.name || "U"} size="2xl" color="#7c3aed" className="ring-4 ring-black/40 shadow-xl" />
              <button className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                <Camera size={20} className="text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{currentUser?.name ?? "—"}</h1>
                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">{currentUser?.role ?? ""}</span>
              </div>
              <p className="text-sm text-white/50 mt-1">{currentUser?.email ?? ""}</p>
            </div>
            <div className="flex items-center gap-2 pb-1">
              {!isEditing ? (
                <Button id="profile-edit-btn" variant="secondary" size="sm" leftIcon={<Edit3 size={14} />} onClick={() => setIsEditing(true)} className="bg-white/5 hover:bg-white/10 text-white border-white/10">
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button id="profile-cancel-btn" variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={() => { resetProfile(); setIsEditing(false); }} className="text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
                  <Button id="profile-save-btn" variant="primary" size="sm" leftIcon={<Save size={14} />} loading={isSaving} onClick={handleProfile(onSaveProfile)}>Save Changes</Button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-8 pt-5 border-t border-white/5">
            {statItems.map(({ label, value }) => (
              <div key={label} className="min-w-[100px]">
                <p className="text-lg font-black text-white">{value}</p>
                <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form + Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "24px" }}>
        <div className="lg:col-span-2 dash-card p-6">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2.5">
            <User size={16} className="text-violet-400" /> Personal Information
          </h2>
          <form onSubmit={handleProfile(onSaveProfile)} className="space-y-5" noValidate>
            <Input id="profile-full-name" label="Full Name" type="text" dark disabled={!isEditing} leftIcon={<User size={15} />} error={profileErrors.fullName?.message} {...regProfile("fullName", { required: "Full name is required" })} />
            <Input id="profile-email" label="Email Address" type="email" dark disabled={!isEditing} leftIcon={<Mail size={15} />} hint={isEditing ? "Changing your email will require re-verification." : undefined} error={profileErrors.email?.message} {...regProfile("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />
            <Input id="profile-phone" label="Phone Number" type="tel" dark disabled={!isEditing} leftIcon={<Phone size={15} />} {...regProfile("phone")} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-bio" className="text-[13px] font-semibold text-white/70 flex items-center gap-1.5">
                <FileText size={14} className="text-white/40" /> Bio / About
              </label>
              <textarea id="profile-bio" rows={4} disabled={!isEditing}
                className="sp-input resize-none leading-relaxed"
                style={{ height: "auto", background: "rgba(255,255,255,0.03)", color: isEditing ? "#fff" : "rgba(255,255,255,0.5)", borderColor: isEditing ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", cursor: !isEditing ? "not-allowed" : undefined }}
                {...regProfile("bio")}
              />
            </div>
            {isEditing && (
              <div className="flex justify-end gap-3 pt-2">
                <Button id="profile-form-cancel" variant="ghost" size="md" type="button" onClick={() => { resetProfile(); setIsEditing(false); }} className="text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
                <Button id="profile-form-save" variant="primary" size="md" type="submit" loading={isSaving}>Save Changes</Button>
              </div>
            )}
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="dash-card p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield size={15} className="text-violet-400" /> Account Details</h3>
            <ul className="space-y-3.5 text-[13px]">
              {[
                { icon: Shield, label: "Plan", value: "Pro"                          },
                { icon: User,   label: "Role", value: currentUser?.role ?? "—"       },
              ].map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-1.5"><Icon size={13} />{label}</span>
                  <span className="font-bold text-white/90">{value}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-white/5">
              <button className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                Upgrade to Enterprise <Sparkles size={10} className="animate-pulse" />
              </button>
            </div>
          </div>

          <div className="dash-card p-5">
            <h3 className="text-sm font-bold text-white mb-4">Connected Platforms</h3>
            {accounts.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-3">No accounts connected.</p>
            ) : (
            <ul className="space-y-3">
              {accounts.map((acc) => (
                <li key={acc.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 bg-violet-600">
                    {acc.platform.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/90 truncate capitalize">{acc.platform}</p>
                    <p className="text-[11px] text-white/40 truncate">{acc.account_name}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${acc.status === "connected" ? "bg-emerald-400" : "bg-white/20"}`} />
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="dash-card overflow-hidden">
        <button id="profile-change-password-toggle" type="button" onClick={() => setShowPwSection((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Lock size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Change Password</p>
              <p className="text-xs text-white/40 mt-0.5">Update your account security credentials</p>
            </div>
          </div>
          <ChevronDown size={18} className={`text-white/40 transition-transform duration-200 ${showPwSection ? "rotate-180" : ""}`} />
        </button>
        {showPwSection && (
          <div className="px-6 pb-6 border-t border-white/5 animate-fade-in-up">
            <form onSubmit={handlePw(onSavePassword)} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5" noValidate>
              <Input id="change-current-password" label="Current Password" type="password" dark placeholder="••••••••" leftIcon={<Lock size={15} />} error={pwErrors.currentPassword?.message} {...regPw("currentPassword", { required: "Current password is required" })} />
              <Input id="change-new-password" label="New Password" type="password" dark placeholder="Create new password" leftIcon={<Lock size={15} />} error={pwErrors.newPassword?.message} hint="Min 8 characters, 1 uppercase, 1 number" {...regPw("newPassword", { required: "New password is required", minLength: { value: 8, message: "Must be at least 8 characters" } })} />
              <Input id="change-confirm-password" label="Confirm New Password" type="password" dark placeholder="Repeat new password" leftIcon={<Lock size={15} />} error={pwErrors.confirmPassword?.message} {...regPw("confirmPassword", { required: "Please confirm your password", validate: (v) => v === newPw || "Passwords do not match" })} />
              <div className="md:col-span-3 flex justify-end gap-3">
                {pwError && <p className="text-[13px] font-semibold text-red-400 self-center mr-auto">{pwError}</p>}
                <Button id="change-password-cancel" variant="ghost" size="md" type="button" onClick={() => { resetPw(); setPwError(""); setShowPwSection(false); }} className="text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
                <Button id="change-password-save" variant="primary" size="md" type="submit" loading={isSavingPw} leftIcon={<Shield size={15} />}>Update Password</Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="dash-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-rose-500/20 bg-rose-950/10">
        <div>
          <p className="text-sm font-bold text-white">Sign Out</p>
          <p className="text-xs text-white/40 mt-0.5">Sign out from all devices and return to login.</p>
        </div>
        <Button id="profile-logout-btn" variant="danger" size="md" leftIcon={<LogOut size={15} />} onClick={() => router.push("/login")}>Sign Out</Button>
      </div>
    </div>
  );
}
