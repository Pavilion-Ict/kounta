"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/utils/permissions";
import { sendInviteEmail } from "@/utils/email";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOrgContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const cookieStore = await cookies();
  const orgId = cookieStore.get("current_org_id")?.value;
  if (!orgId) throw new Error("No organization selected");

  return { user, orgId };
}

export async function inviteTeamMember(email: string, role: "owner" | "staff") {
  const { user, orgId } = await getOrgContext();
  await requireOwner(orgId);

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }
  if (!["owner", "staff"].includes(role)) {
    throw new Error("Invalid role specified.");
  }

  const admin = getAdminClient();

  // Check if this email is already an active member of this organization
  const { data: existingMemberships } = await admin
    .from("memberships")
    .select("user_id, status")
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (existingMemberships && existingMemberships.length > 0) {
    const memberUserIds = existingMemberships.map((m) => m.user_id);
    for (const uid of memberUserIds) {
      const { data: u } = await admin.auth.admin.getUserById(uid);
      if (u?.user?.email?.toLowerCase() === cleanEmail) {
        throw new Error("This user is already an active member of this organization.");
      }
    }
  }

  // Check if there is already a pending invitation for this email; remove old one if exists
  await admin
    .from("invitations")
    .delete()
    .eq("org_id", orgId)
    .eq("email", cleanEmail)
    .is("accepted_at", null);

  // Generate unique token
  const token = crypto.randomUUID();

  const { error: inviteInsertError } = await admin.from("invitations").insert({
    org_id: orgId,
    email: cleanEmail,
    role,
    token,
    invited_by: user.id,
  });

  if (inviteInsertError) {
    console.error("Error creating invitation:", inviteInsertError);
    throw new Error("Failed to create invitation record.");
  }

  // Fetch org name
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const orgName = org?.name || "your organization";
  const inviterName = user.user_metadata?.full_name || user.email || "A team admin";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/auth/accept-invite?token=${token}`;

  try {
    await sendInviteEmail({
      to: cleanEmail,
      inviterName,
      orgName,
      role,
      inviteUrl,
    });
  } catch (emailErr: any) {
    console.error("Nodemailer error:", emailErr);
    // Don't fail the whole action if SMTP is not configured yet in local/dev
    // Return friendly warning
    return {
      success: true,
      warning:
        "Invitation created, but failed to send email. Ensure SMTP environment variables are configured in .env.",
      inviteUrl,
    };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getTeamMembers() {
  const { orgId } = await getOrgContext();
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("memberships")
    .select("id, user_id, role, status, created_at, profiles(full_name)")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }

  const members = await Promise.all(
    (data || []).map(async (m: any) => {
      let email = "";
      try {
        const { data: userData } = await admin.auth.admin.getUserById(m.user_id);
        email = userData?.user?.email || "";
      } catch (err) {
        // ignore
      }

      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role as "owner" | "staff",
        status: m.status,
        created_at: m.created_at,
        name: m.profiles?.full_name || email.split("@")[0] || "User",
        email: email || "—",
      };
    })
  );

  return members;
}

export async function getPendingInvitations() {
  const { orgId } = await getOrgContext();
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("invitations")
    .select("id, email, role, token, created_at, accepted_at")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }

  return (data || []).map((inv: any) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    created_at: inv.created_at,
  }));
}

export async function revokeInvitation(invitationId: string) {
  const { orgId } = await getOrgContext();
  await requireOwner(orgId);

  const admin = getAdminClient();
  const { error } = await admin
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("org_id", orgId);

  if (error) {
    console.error("Error revoking invitation:", error);
    throw new Error("Failed to revoke invitation.");
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function removeTeamMember(membershipId: string) {
  const { user, orgId } = await getOrgContext();
  await requireOwner(orgId);

  const admin = getAdminClient();

  const { data: targetMember } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("id", membershipId)
    .eq("organization_id", orgId)
    .single();

  if (!targetMember) {
    throw new Error("Member not found in this organization.");
  }

  if (targetMember.user_id === user.id) {
    throw new Error("You cannot remove yourself from the organization.");
  }

  const { error } = await admin
    .from("memberships")
    .update({ status: "inactive" })
    .eq("id", membershipId);

  if (error) {
    console.error("Error removing member:", error);
    throw new Error("Failed to remove member.");
  }

  revalidatePath("/settings");
  return { success: true };
}
