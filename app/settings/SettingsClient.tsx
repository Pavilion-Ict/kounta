"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Users, 
  User, 
  Upload, 
  Trash2, 
  Check, 
  Copy, 
  Mail, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import { updateOrgName, updateOrgLogo, updateAccountEmail, updateAccountPassword, updateAccountProfile } from "@/app/actions/settings";
import { inviteTeamMember, getTeamMembers, getPendingInvitations, revokeInvitation, removeTeamMember } from "@/app/actions/team";
import { createClient } from "@/utils/supabase/client";
import { useOrganization } from "@/components/providers/OrganizationProvider";

interface SettingsClientProps {
  initialOrg: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  initialUser: {
    id: string;
    email: string;
    fullName: string;
  };
  isOwner: boolean;
  role: string;
}

export default function SettingsClient({
  initialOrg,
  initialUser,
  isOwner,
  role,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"business" | "team" | "account">("business");
  const { reloadOrganizations } = useOrganization();

  // ── BUSINESS STATE ──────────────────────────────────────────────────────────
  const [orgName, setOrgName] = useState(initialOrg.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialOrg.logo_url);
  const [logoInputUrl, setLogoInputUrl] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [businessMsg, setBusinessMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── TEAM STATE ─────────────────────────────────────────────────────────────
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "owner">("staff");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ 
    type: "success" | "warning" | "error"; 
    text: string; 
    inviteUrl?: string; 
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // ── ACCOUNT STATE ───────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(initialUser.fullName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load team data when team tab is selected
  useEffect(() => {
    if (activeTab === "team") {
      loadTeamData();
    }
  }, [activeTab]);

  const loadTeamData = async () => {
    setIsLoadingTeam(true);
    try {
      const [members, invites] = await Promise.all([
        getTeamMembers(),
        isOwner ? getPendingInvitations() : Promise.resolve([]),
      ]);
      setTeamMembers(members);
      setPendingInvites(invites);
    } catch (err) {
      console.error("Failed to load team data", err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  // ── HANDLERS: BUSINESS ──────────────────────────────────────────────────────
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setIsSavingName(true);
    setBusinessMsg(null);
    try {
      await updateOrgName(orgName);
      await reloadOrganizations();
      setBusinessMsg({ type: "success", text: "Business name updated successfully." });
    } catch (err: any) {
      setBusinessMsg({ type: "error", text: err.message || "Failed to update business name." });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;

    if (!file.type.startsWith("image/")) {
      setBusinessMsg({ type: "error", text: "Please select an image file (PNG, JPG, SVG, WebP)." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setBusinessMsg({ type: "error", text: "Image size must be less than 2MB." });
      return;
    }

    setIsUploadingLogo(true);
    setBusinessMsg(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const filePath = `${initialOrg.id}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes("bucket not found")) {
          throw new Error(
            "Supabase storage bucket 'org-logos' was not found. Please create the public bucket 'org-logos' in your Supabase dashboard or paste an image URL below."
          );
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from("org-logos").getPublicUrl(filePath);

      await updateOrgLogo(publicUrl);
      setLogoUrl(publicUrl);
      await reloadOrganizations();
      setBusinessMsg({ type: "success", text: "Logo uploaded and saved successfully." });
    } catch (err: any) {
      setBusinessMsg({ type: "error", text: err.message || "Failed to upload logo." });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyLogoUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoInputUrl.trim() || !isOwner) return;
    setIsUploadingLogo(true);
    setBusinessMsg(null);
    try {
      await updateOrgLogo(logoInputUrl.trim());
      setLogoUrl(logoInputUrl.trim());
      setLogoInputUrl("");
      await reloadOrganizations();
      setBusinessMsg({ type: "success", text: "Logo URL saved successfully." });
    } catch (err: any) {
      setBusinessMsg({ type: "error", text: err.message || "Failed to save logo URL." });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!isOwner) return;
    if (!confirm("Are you sure you want to remove the business logo?")) return;
    setIsUploadingLogo(true);
    setBusinessMsg(null);
    try {
      await updateOrgLogo(null);
      setLogoUrl(null);
      await reloadOrganizations();
      setBusinessMsg({ type: "success", text: "Logo removed successfully." });
    } catch (err: any) {
      setBusinessMsg({ type: "error", text: err.message || "Failed to remove logo." });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ── HANDLERS: TEAM ──────────────────────────────────────────────────────────
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setIsSendingInvite(true);
    setInviteResult(null);

    try {
      const res = await inviteTeamMember(inviteEmail, inviteRole);
      if (res.warning) {
        setInviteResult({
          type: "warning",
          text: res.warning,
          inviteUrl: res.inviteUrl,
        });
      } else {
        setInviteResult({
          type: "success",
          text: `Invitation successfully sent to ${inviteEmail}.`,
        });
        setInviteEmail("");
      }
      await loadTeamData();
    } catch (err: any) {
      setInviteResult({
        type: "error",
        text: err.message || "Failed to send invitation.",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!isOwner) return;
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      await revokeInvitation(invitationId);
      await loadTeamData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation.");
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !isOwner) return;
    setIsRemovingMember(true);
    try {
      await removeTeamMember(memberToRemove.id);
      setMemberToRemove(null);
      await loadTeamData();
    } catch (err: any) {
      alert(err.message || "Failed to remove member.");
    } finally {
      setIsRemovingMember(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // ── HANDLERS: ACCOUNT ───────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateAccountProfile(fullName);
      setProfileMsg({ type: "success", text: "Full name updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setEmailMsg(null);
    try {
      const res = await updateAccountEmail(newEmail);
      setEmailMsg({ type: "success", text: res.message });
      setNewEmail("");
    } catch (err: any) {
      setEmailMsg({ type: "error", text: err.message || "Failed to update email." });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setIsSavingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await updateAccountPassword(newPassword);
      setPasswordMsg({ type: "success", text: res.message });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your business information, team access, and account preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-8 space-x-2 sm:space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("business")}
          className={`flex items-center gap-2 pb-3.5 px-1 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "business"
              ? "border-[#3E4095] text-[#3E4095]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Profile
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 pb-3.5 px-1 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "team"
              ? "border-[#3E4095] text-[#3E4095]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Team Members
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 pb-3.5 px-1 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "account"
              ? "border-[#3E4095] text-[#3E4095]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <User className="w-4 h-4" />
          Account & Security
        </button>
      </div>

      {/* ── TAB 1: BUSINESS ─────────────────────────────────────────────────── */}
      {activeTab === "business" && (
        <div className="space-y-6">
          {!isOwner && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Staff View</p>
                <p className="text-amber-700 mt-0.5">
                  You are currently logged in as a <strong>Staff member</strong>. Only organization Owners can change the business name and upload or remove the logo.
                </p>
              </div>
            </div>
          )}

          {businessMsg && (
            <div
              className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                businessMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {businessMsg.type === "success" ? (
                <Check className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              )}
              <p>{businessMsg.text}</p>
            </div>
          )}

          {/* Business Name Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Name</h2>
            <p className="text-xs text-gray-500 mb-5">
              This name is shown across your dashboards, receipt templates, and exports.
            </p>

            <form onSubmit={handleSaveName} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  disabled={!isOwner || isSavingName}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095] disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. Acme Printing Press"
                />
              </div>

              {isOwner && (
                <button
                  type="submit"
                  disabled={isSavingName || orgName === initialOrg.name}
                  className="px-5 py-2.5 bg-[#3E4095] hover:bg-[#343680] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSavingName ? "Saving..." : "Save Name"}
                </button>
              )}
            </form>
          </div>

          {/* Business Logo Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Logo</h2>
            <p className="text-xs text-gray-500 mb-5">
              Your logo is rendered in the top sidebar switcher and automatically printed on all receipts and PDF exports.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                  <img src={logoUrl} alt="Business logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-300" />
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {logoUrl ? "Current Brand Logo" : "No Logo Uploaded"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recommended dimensions: 256x256 square PNG, JPG, or SVG under 2MB.
                  </p>
                </div>

                {isOwner && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Direct URL Fallback */}
            {isOwner && (
              <div className="pt-4 border-t border-gray-100 max-w-md">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Or provide a direct image URL:
                </label>
                <form onSubmit={handleApplyLogoUrl} className="flex gap-2">
                  <input
                    type="url"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095]"
                  />
                  <button
                    type="submit"
                    disabled={!logoInputUrl.trim() || isUploadingLogo}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Set URL
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: TEAM ─────────────────────────────────────────────────────── */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Role Status Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                {isOwner ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Your Access Level</p>
                <p className="text-base font-bold text-gray-900 capitalize">{role}</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 hidden sm:block">
              {isOwner ? "Full permissions: create, edit, delete & manage team" : "Limited permissions: record sales & view reports"}
            </div>
          </div>

          {/* Invite Form (Owner only) */}
          {isOwner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Invite Team Member</h2>
              <p className="text-xs text-gray-500 mb-5">
                Send an email invitation. The recipient will click a secure link and land directly in your workspace.
              </p>

              {inviteResult && (
                <div
                  className={`p-4 rounded-xl text-sm mb-5 ${
                    inviteResult.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : inviteResult.type === "warning"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <p className="font-semibold">{inviteResult.text}</p>
                  {inviteResult.inviteUrl && (
                    <div className="mt-3 pt-3 border-t border-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="text-xs text-amber-700 font-mono break-all bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 flex-1">
                        {inviteResult.inviteUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(inviteResult.inviteUrl!, "manual-url")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                      >
                        {copiedToken === "manual-url" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095]"
                  >
                    <option value="staff">Staff (No edit/delete)</option>
                    <option value="owner">Owner (Full access)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={isSendingInvite || !inviteEmail.trim()}
                    className="w-full py-2.5 px-4 bg-[#3E4095] hover:bg-[#343680] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSendingInvite ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" /> Send Invite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pending Invitations (Owner only) */}
          {isOwner && pendingInvites.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Pending Invitations</h2>
              <p className="text-xs text-gray-500 mb-4">
                People invited who haven't yet logged in and accepted.
              </p>

              <div className="divide-y divide-gray-100">
                {pendingInvites.map((inv) => {
                  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                  const link = `${appUrl}/auth/accept-invite?token=${inv.token}`;

                  return (
                    <div key={inv.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 capitalize">
                            {inv.role}
                          </span>
                          <span className="text-xs text-gray-400">
                            Invited {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(link, inv.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 transition-colors"
                          title="Copy invitation link"
                        >
                          {copiedToken === inv.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Link
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Members Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Active Members</h2>
                <p className="text-xs text-gray-500">People with current access to {orgName}.</p>
              </div>
              <button
                onClick={loadTeamData}
                disabled={isLoadingTeam}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                title="Refresh team list"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingTeam ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-3">Member</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    {isOwner && <th className="pb-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamMembers.map((member) => {
                    const isSelf = member.user_id === initialUser.id;
                    const initials = (member.name || member.email || "U").slice(0, 2).toUpperCase();

                    return (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {member.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(you)</span>}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              member.role === "owner"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {member.role === "owner" && <ShieldCheck className="w-3 h-3" />}
                            <span className="capitalize">{member.role}</span>
                          </span>
                        </td>

                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        {isOwner && (
                          <td className="py-3.5 text-right">
                            {!isSelf && (
                              <button
                                onClick={() => setMemberToRemove(member)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remove Member Confirmation Modal */}
          {memberToRemove && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Team Member?</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to remove <strong>{memberToRemove.name || memberToRemove.email}</strong> from this organization? They will lose all access immediately.
                </p>
                <div className="flex gap-3">
                  <button
                    disabled={isRemovingMember}
                    onClick={() => setMemberToRemove(null)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isRemovingMember}
                    onClick={handleConfirmRemoveMember}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {isRemovingMember ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ACCOUNT ─────────────────────────────────────────────────── */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Profile Name */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Profile</h2>
            <p className="text-xs text-gray-500 mb-5">Your display name shown to other team members.</p>

            {profileMsg && (
              <div
                className={`p-3.5 rounded-xl text-sm mb-4 flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {profileMsg.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <p className="text-xs">{profileMsg.text}</p>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095]"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile || fullName === initialUser.fullName}
                className="px-5 py-2.5 bg-[#3E4095] hover:bg-[#343680] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Update Name"}
              </button>
            </form>
          </div>

          {/* Change Email */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Change Email Address</h2>
            <p className="text-xs text-gray-500 mb-4">
              Current email: <strong className="text-gray-800">{initialUser.email}</strong>
            </p>

            {emailMsg && (
              <div
                className={`p-3.5 rounded-xl text-sm mb-4 flex items-center gap-2 ${
                  emailMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {emailMsg.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <p className="text-xs">{emailMsg.text}</p>
              </div>
            )}

            <form onSubmit={handleSaveEmail} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095]"
                  placeholder="newemail@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingEmail || !newEmail.trim() || newEmail === initialUser.email}
                className="px-5 py-2.5 bg-[#3E4095] hover:bg-[#343680] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingEmail ? "Sending Link..." : "Update Email"}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h2>
            <p className="text-xs text-gray-500 mb-4">
              Ensure your account is using a long, random password to stay secure.
            </p>

            {passwordMsg && (
              <div
                className={`p-3.5 rounded-xl text-sm mb-4 flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {passwordMsg.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <p className="text-xs">{passwordMsg.text}</p>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095] pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3E4095]/20 focus:border-[#3E4095]"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPassword || !newPassword || !confirmPassword}
                className="px-5 py-2.5 bg-[#3E4095] hover:bg-[#343680] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
