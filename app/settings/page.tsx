import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings — Kounta",
  description: "Manage your business profile, team members, and account settings.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get("current_org_id")?.value;

  if (!orgId) {
    redirect("/onboarding");
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch current user's membership in this org
  const { data: membership } = await admin
    .from("memberships")
    .select("role, status")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("status", "active")
    .single();

  const isOwner = membership?.role === "owner";

  // Fetch organization info (with graceful fallback if logo_url column isn't added yet)
  let { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug, logo_url")
    .eq("id", orgId)
    .single();

  if (orgErr) {
    const { data: fallbackOrg } = await admin
      .from("organizations")
      .select("id, name, slug")
      .eq("id", orgId)
      .single();
    if (fallbackOrg) {
      org = { ...fallbackOrg, logo_url: null };
    }
  }

  // Fetch user profile
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      initialOrg={org || { id: orgId, name: "Your Business", slug: "", logo_url: null }}
      initialUser={{
        id: user.id,
        email: user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || "",
      }}
      isOwner={isOwner}
      role={membership?.role || "staff"}
    />
  );
}
