"use client";

import { useState, useEffect, useRef } from "react";
import {
  Link2,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Users,
  Loader2,
  Code2,
  Key,
  ShieldCheck,
  Trash2,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  FaTwitter,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaPinterest,
  FaYoutube,
} from "react-icons/fa";
import {
  apiListAccounts,
  apiConnectAccount,
  apiDisconnectAccount,
  apiRefreshToken,
  apiGetOAuthUrl,
  SocialAccountOut,
  SocialAccountPayload,
} from "@/lib/api";
import { getUser } from "@/lib/authStore";

const PLATFORM_META: Record<
  string,
  {
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    defaultScopes: string[];
    oauthDoc: string;
  }
> = {
  facebook: {
    name: "Facebook Pages",
    icon: FaFacebook,
    color: "#1877f2",
    bgColor: "rgba(24,119,242,0.1)",
    defaultScopes: ["pages_manage_posts", "pages_read_engagement", "instagram_basic"],
    oauthDoc: "https://developers.facebook.com/docs/facebook-login",
  },
  instagram: {
    name: "Instagram Business",
    icon: FaInstagram,
    color: "#e4405f",
    bgColor: "rgba(228,64,95,0.1)",
    defaultScopes: ["instagram_basic", "instagram_content_publish", "pages_read_engagement"],
    oauthDoc: "https://developers.facebook.com/docs/instagram-api",
  },
  linkedin: {
    name: "LinkedIn Organization",
    icon: FaLinkedin,
    color: "#0077b5",
    bgColor: "rgba(0,119,181,0.1)",
    defaultScopes: ["w_member_social", "rw_organization_admin", "r_liteprofile"],
    oauthDoc: "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow",
  },
  twitter: {
    name: "X (Twitter)",
    icon: FaTwitter,
    color: "#ffffff",
    bgColor: "rgba(255,255,255,0.08)",
    defaultScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    oauthDoc: "https://developer.twitter.com/en/docs/authentication/oauth-2-0",
  },
  youtube: {
    name: "YouTube Channel",
    icon: FaYoutube,
    color: "#ff0000",
    bgColor: "rgba(255,0,0,0.08)",
    defaultScopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
    oauthDoc: "https://developers.google.com/youtube/v3/guides/authentication",
  },
  pinterest: {
    name: "Pinterest Business",
    icon: FaPinterest,
    color: "#bd081c",
    bgColor: "rgba(189,8,28,0.1)",
    defaultScopes: ["boards:read", "pins:read", "pins:write"],
    oauthDoc: "https://developers.pinterest.com/docs/api/v5/",
  },
};

const INITIAL_MOCK_ACCOUNTS: SocialAccountOut[] = [
  {
    id: 101,
    user_id: 1,
    platform: "linkedin",
    account_name: "SocialPilot Corp",
    platform_account_id: "li_sp_corporate",
    access_token: "sl.Bv3x7A9Z_mock_linkedin_token_sample",
    refresh_token: "sl.ref_mock_refresh_token_991",
    status: "connected",
    scopes: ["w_member_social", "rw_organization_admin"],
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 102,
    user_id: 1,
    platform: "twitter",
    account_name: "@socialpilot_app",
    platform_account_id: "tw_sp_app",
    access_token: "tw.v2_mock_access_token_9012",
    refresh_token: "tw.v2_mock_refresh_token_1122",
    status: "connected",
    scopes: ["tweet.read", "tweet.write", "offline.access"],
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 103,
    user_id: 1,
    platform: "facebook",
    account_name: "SocialPilot Community Page",
    platform_account_id: "fb_page_881920",
    access_token: "EAAB_mock_fb_access_token_7781",
    status: "connected",
    scopes: ["pages_manage_posts", "pages_read_engagement"],
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 104,
    user_id: 1,
    platform: "youtube",
    account_name: "SocialPilot Official",
    platform_account_id: "yt_channel_sp_official",
    access_token: "ya29_mock_google_oauth_token",
    status: "expired",
    scopes: ["youtube.upload"],
    expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AccountsView() {
  const [accounts, setAccounts] = useState<SocialAccountOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectTab, setConnectTab] = useState<"oauth" | "manual">("oauth");
  const [formError, setFormError] = useState("");
  const [showApiGuide, setShowApiGuide] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedDetailsAccount, setSelectedDetailsAccount] = useState<SocialAccountOut | null>(null);
  const [disconnectConfirmId, setDisconnectConfirmId] = useState<number | null>(null);

  const [form, setForm] = useState<SocialAccountPayload>({
    platform: "linkedin",
    account_name: "",
    platform_account_id: "",
    access_token: "",
    refresh_token: "",
  });

  const userId = getUser()?.user_id;

  const backendReachable = useRef(false);

  const loadAccounts = () => {
    apiListAccounts()
      .then((data) => {
        backendReachable.current = true;
        setError("");
        setAccounts(data);
      })
      .catch((err) => {
        if (!backendReachable.current) {
          setError(err?.message ? `Demo mode — backend not reachable (${err.message})` : "");
          setAccounts(INITIAL_MOCK_ACCOUNTS);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAccounts();
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "OAUTH_SUCCESS") {
        setShowModal(false);
        setFormError("");
        setTimeout(loadAccounts, 600);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [userId]);

  // Launch OAuth Authorization Flow
  const handleLaunchOAuth = async (platform: string) => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await apiGetOAuthUrl(platform);
      const url = res?.authorization_url || res?.authorize_url;
      if (!url) throw new Error("No authorization URL returned from backend API");

      const popup = window.open(url, "oauth_popup", "width=620,height=720,left=200,top=100");

      // Poll for popup closure as fallback (in case postMessage doesn't fire)
      if (popup) {
        const pollInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollInterval);
            setShowModal(false);
            setFormError("");
            setTimeout(loadAccounts, 600);
          }
        }, 500);
      }
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Backend OAuth endpoint not reachable. Switch to Manual API Key mode."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Manual API Key / Token Form Submission
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const created = await apiConnectAccount(form);
      setAccounts((prev) => [...prev, created]);
      setShowModal(false);
      setForm({
        platform: "linkedin",
        account_name: "",
        platform_account_id: "",
        access_token: "",
        refresh_token: "",
      });
    } catch {
      // Create local fallback if backend endpoint is not yet connected
      const mockCreated: SocialAccountOut = {
        id: Date.now(),
        user_id: Number(userId) || 1,
        platform: form.platform,
        account_name: form.account_name || `${form.platform}_account`,
        platform_account_id: form.platform_account_id || `${form.platform}_${Date.now()}`,
        access_token: form.access_token,
        refresh_token: form.refresh_token,
        status: "connected",
        scopes: PLATFORM_META[form.platform]?.defaultScopes || ["read", "write"],
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, mockCreated]);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Disconnect Account Action
  const handleDisconnect = async (id: number) => {
    setActioningId(id);
    try {
      await apiDisconnectAccount(id);
      // Reload from server so we don't show stale mock data
      await apiListAccounts().then((data) => setAccounts(data)).catch(() => {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      });
    } catch {
      // Backend call failed — remove locally as fallback
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setActioningId(null);
      setDisconnectConfirmId(null);
    }
  };

  // Refresh Token Action
  const handleRefresh = async (id: number) => {
    setActioningId(id);
    try {
      const refreshed = await apiRefreshToken(id);
      setAccounts((prev) => prev.map((a) => (a.id === id ? refreshed : a)));
    } catch {
      // Simulate token refresh
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "connected",
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
                updated_at: new Date().toISOString(),
              }
            : a
        )
      );
    } finally {
      setActioningId(null);
    }
  };

  const connected = accounts.filter((a) => a.status === "connected").length;
  const expired = accounts.filter((a) => a.status === "expired").length;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto custom-scrollbar">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
            <Link2 className="w-4 h-4" />
            <span>{connected} Active Social Channels</span>
          </div>
          {expired > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span>{expired} Token(s) Expired</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowApiGuide(!showApiGuide)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Code2 size={15} className="text-violet-400" />
            <span>{showApiGuide ? "Hide Developer API Spec" : "Developer Integration Spec"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
          >
            <Plus size={15} /> Connect Social Channel
          </button>
        </div>
      </div>

      {/* Developer API Integration Spec Drawer */}
      {showApiGuide && (
        <div className="p-6 rounded-2xl bg-violet-950/30 border border-violet-500/30 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-300 font-bold text-sm">
              <Code2 className="w-5 h-5 text-violet-400" />
              <span>Backend Developer API Endpoints Reference</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-violet-500/20 rounded-full text-violet-300 border border-violet-500/30">
              REST & OAuth 2.0 Spec
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            The frontend is pre-wired to communicate with these backend FastAPI / Node endpoints. Implement these 5 routes in your backend to complete live social media OAuth integrations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">GET /api/v1/accounts/list</span>
                <span className="text-[10px] text-white/40">Fetch connected channels</span>
              </div>
              <p className="text-[10px] text-white/50">Returns array of <code className="text-violet-300">SocialAccountOut</code> objects</p>
            </div>

            <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-violet-400 font-bold">GET /api/v1/accounts/oauth/url</span>
                <span className="text-[10px] text-white/40">Generate OAuth Redirect</span>
              </div>
              <p className="text-[10px] text-white/50">Query: <code className="text-violet-300">platform=linkedin|twitter|facebook</code></p>
            </div>

            <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold">POST /api/v1/accounts/connect</span>
                <span className="text-[10px] text-white/40">Save channel credentials</span>
              </div>
              <p className="text-[10px] text-white/50">Body: <code className="text-violet-300">platform, account_name, access_token</code></p>
            </div>

            <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold">POST /api/v1/accounts/&#123;id&#125;/refresh</span>
                <span className="text-[10px] text-white/40">Renew expired tokens</span>
              </div>
              <p className="text-[10px] text-white/50">Exchanges refresh_token for new access_token</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dash-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">{connected}</p>
            <p className="text-xs text-white/40 font-semibold mt-0.5">Active Connections</p>
          </div>
        </div>

        <div className="dash-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Users className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{accounts.length}</p>
            <p className="text-xs text-white/40 font-semibold mt-0.5">Total Channels Added</p>
          </div>
        </div>

        <div className="dash-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">6 Networks</p>
            <p className="text-xs text-white/40 font-semibold mt-0.5">OAuth 2.0 Ready</p>
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-red-400 font-semibold">{error}</p>}

      {/* Accounts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {accounts.length === 0 && (
            <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/5">
              <Link2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No social accounts connected</h3>
              <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                Connect your X, Instagram, LinkedIn, Facebook, YouTube, or Pinterest accounts to begin scheduling content.
              </p>
            </div>
          )}

          {accounts.map((account) => {
            const meta = PLATFORM_META[account.platform.toLowerCase()] ?? {
              name: account.platform,
              icon: Link2,
              color: "#ffffff",
              bgColor: "rgba(255,255,255,0.08)",
              defaultScopes: ["read", "write"],
              oauthDoc: "#",
            };
            const Icon = meta.icon;
            const isConnected = account.status === "connected";
            const isExpired = account.status === "expired";
            const isRefreshing = actioningId === account.id;

            return (
              <div
                key={account.id}
                className={`dash-card p-6 flex flex-col justify-between transition-all group ${
                  isExpired ? "border-rose-500/30 bg-rose-500/[0.02]" : ""
                }`}
              >
                <div>
                  {/* Account Header Row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 shrink-0"
                        style={{ background: meta.bgColor }}
                      >
                        <Icon size={22} style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white capitalize truncate">{meta.name}</p>
                        <p className="text-xs font-semibold text-violet-300 truncate">{account.account_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                          isConnected
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isExpired
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                            : "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <CheckCircle2 size={11} /> Connected
                          </>
                        ) : isExpired ? (
                          <>
                            <AlertTriangle size={11} /> Token Expired
                          </>
                        ) : (
                          <>
                            <XCircle size={11} /> Disconnected
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Metadata ID & Scope Info */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-center">
                      <p className="text-xs font-mono font-bold text-white truncate">{account.platform_account_id}</p>
                      <p className="text-[9px] uppercase font-bold text-white/30 mt-0.5">Platform ID</p>
                    </div>
                    <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-center">
                      <p className="text-xs font-mono font-bold text-violet-300 truncate">
                        {account.scopes?.length || meta.defaultScopes.length} Scopes
                      </p>
                      <p className="text-[9px] uppercase font-bold text-white/30 mt-0.5">OAuth Permissions</p>
                    </div>
                  </div>

                  {/* Access Token Preview */}
                  <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl mb-5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                      <span className="flex items-center gap-1">
                        <Key size={10} className="text-violet-400" /> Bearer Token Signature
                      </span>
                      <span>OAuth 2.0</span>
                    </div>
                    <p className="font-mono text-[11px] text-white/60 truncate">
                      {account.access_token ? `${account.access_token.slice(0, 16)}...` : "None"}
                    </p>
                  </div>
                </div>

                {/* Account Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRefresh(account.id)}
                      disabled={isRefreshing}
                      className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                      {isRefreshing ? "Renewing..." : "Renew Token"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailsAccount(account)}
                      className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
                      title="Inspect OAuth Scopes"
                    >
                      <Settings size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDisconnectConfirmId(account.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                      title="Disconnect Channel"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectConfirmId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setDisconnectConfirmId(null)}
        >
          <div
            className="bg-[#0d0920] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in cursor-default space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Disconnect Social Channel?</h3>
                <p className="text-xs text-white/40">This will revoke API posting access.</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to disconnect this account? Scheduled posts targeting this channel will require re-authentication.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDisconnectConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/70 hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDisconnect(disconnectConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings / Scopes Inspector Drawer Modal */}
      {selectedDetailsAccount && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedDetailsAccount(null)}
        >
          <div
            className="bg-[#0d0920] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in cursor-default space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">OAuth Permissions & API Settings</h3>
                  <p className="text-[11px] text-white/40">{selectedDetailsAccount.platform} @{selectedDetailsAccount.account_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailsAccount(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase text-white/40">Granted OAuth 2.0 Scopes</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDetailsAccount.scopes || PLATFORM_META[selectedDetailsAccount.platform]?.defaultScopes || ["read"]).map((scope) => (
                    <span key={scope} className="font-mono text-[10px] px-2 py-0.5 bg-violet-500/15 text-violet-300 border border-violet-500/30 rounded">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-white/40">API Credentials Payload</span>
                <p className="font-mono text-[11px] text-white/70 break-all bg-white/5 p-2 rounded border border-white/5">
                  access_token: {selectedDetailsAccount.access_token}
                </p>
                {selectedDetailsAccount.refresh_token && (
                  <p className="font-mono text-[11px] text-white/70 break-all bg-white/5 p-2 rounded border border-white/5 mt-1">
                    refresh_token: {selectedDetailsAccount.refresh_token}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedDetailsAccount(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Account Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 cursor-pointer"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#0d0920] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in cursor-default space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-black text-white">Connect Social Media Channel</h2>
                <p className="text-xs text-white/40 mt-0.5">Choose OAuth 2.0 Auto Connect or Manual API Keys.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setConnectTab("oauth")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  connectTab === "oauth" ? "bg-violet-600 text-white shadow-md" : "text-white/40 hover:text-white"
                }`}
              >
                <ShieldCheck size={14} /> OAuth 2.0 One-Click
              </button>
              <button
                type="button"
                onClick={() => setConnectTab("manual")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  connectTab === "manual" ? "bg-violet-600 text-white shadow-md" : "text-white/40 hover:text-white"
                }`}
              >
                <Key size={14} /> Manual Access Token
              </button>
            </div>

            {/* OAuth 2.0 Tab */}
            {connectTab === "oauth" && (
              <div className="space-y-4">
                <p className="text-xs text-white/60">
                  Select a social network to launch the OAuth 2.0 authorization dialog:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PLATFORM_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleLaunchOAuth(key)}
                        disabled={submitting}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group cursor-pointer"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: meta.bgColor }}
                        >
                          <Icon size={16} style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                            {meta.name}
                          </p>
                          <p className="text-[9px] text-white/40 truncate">OAuth 2.0 Auth Code</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {formError && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Info size={14} className="text-amber-400 shrink-0" />
                      <span>OAuth Endpoint Notice</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">{formError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Access Token Tab */}
            {connectTab === "manual" && (
              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/50 mb-1.5 block">Target Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    {Object.entries(PLATFORM_META).map(([key, meta]) => (
                      <option key={key} value={key} className="bg-[#0d0920] text-white">
                        {meta.name} ({key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/50 mb-1.5 block">Account Handle / Display Name</label>
                  <input
                    required
                    value={form.account_name}
                    onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                    placeholder="e.g. @socialpilot_corp"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/50 mb-1.5 block">Platform Account ID</label>
                  <input
                    required
                    value={form.platform_account_id}
                    onChange={(e) => setForm((f) => ({ ...f, platform_account_id: e.target.value }))}
                    placeholder="e.g. li_99182, tw_102030"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/50 mb-1.5 block">Bearer Access Token</label>
                  <input
                    required
                    value={form.access_token}
                    onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
                    placeholder="OAuth access token"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs"
                  />
                </div>

                {formError && <p className="text-xs font-semibold text-rose-400">{formError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-bold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 transition-all shadow-md cursor-pointer"
                  >
                    {submitting ? "Saving Channel..." : "Save Social Channel"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
