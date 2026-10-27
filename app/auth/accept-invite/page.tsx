import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Building2, ArrowRight } from "lucide-react";

interface AcceptInviteProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInviteProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation Link</h1>
          <p className="text-sm text-gray-500 mb-6">
            This invitation link is missing a required token. Please check the email link and try again.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/auth/accept-invite?token=${encodeURIComponent(token)}`);
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let { data: invitation, error } = await admin
    .from("invitations")
    .select("*, organizations(id, name, slug, logo_url)")
    .eq("token", token)
    .single();

  if (error) {
    const fallback = await admin
      .from("invitations")
      .select("*, organizations(id, name, slug)")
      .eq("token", token)
      .single();
    if (fallback.data) {
      invitation = fallback.data;
      error = null;
    }
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            This invitation token is invalid or has expired. Please ask the business owner to re-send your invitation.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.accepted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Already Used</h1>
          <p className="text-sm text-gray-500 mb-6">
            This invitation to join <strong>{invitation.organizations?.name || "the business"}</strong> was already accepted.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 1. Ensure user profile exists
  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Team Member";
  await admin.from("profiles").upsert({ id: user.id, full_name: fullName });

  // 2. Upsert membership
  const { error: memberError } = await admin.from("memberships").upsert(
    {
      organization_id: invitation.org_id,
      user_id: user.id,
      role: invitation.role,
      status: "active",
    },
    { onConflict: "organization_id, user_id" }
  );

  if (memberError) {
    console.error("Error accepting invitation:", memberError);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Failed to Accept Invitation</h1>
          <p className="text-sm text-gray-500 mb-6">
            Something went wrong while linking your account. Please try again or contact support.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gray-900 text-white font-medium rounded-xl text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 3. Mark invitation as accepted
  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  // 4. Set cookie to this organization
  const cookieStore = await cookies();
  cookieStore.set("current_org_id", invitation.org_id, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });

  const orgName = invitation.organizations?.name || "the business";
  const roleLabel = invitation.role === "owner" ? "Owner" : "Staff";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-3">
          <Building2 className="w-3.5 h-3.5" />
          {roleLabel} Access Granted
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to {orgName}!</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          You have successfully joined as <strong>{roleLabel}</strong>. You can now access all records and tools for this business.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#3E4095] hover:bg-[#343680] text-white font-semibold rounded-xl text-sm shadow-md transition-all hover:shadow-lg"
        >
          Enter Workspace
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
