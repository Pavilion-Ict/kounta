"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/** Reads the current user's role from the DB for the specified or current org cookie.
 *  Never trusts client-supplied data — always re-checks against memberships. */
export async function getCurrentUserRole(specificOrgId?: string): Promise<"owner" | "staff" | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let orgId = specificOrgId;
  if (!orgId) {
    const cookieStore = await cookies();
    orgId = cookieStore.get("current_org_id")?.value;
  }
  if (!orgId) return null;

  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("status", "active")
    .single();

  return (data?.role as "owner" | "staff") ?? null;
}

/** Throws a Permission denied error if the current user is not an owner. */
export async function requireOwner(orgId?: string): Promise<void> {
  const role = await getCurrentUserRole(orgId);
  if (role !== "owner") {
    throw new Error("Permission denied: owner role required.");
  }
}
