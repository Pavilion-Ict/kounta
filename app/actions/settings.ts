"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/utils/permissions";

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

  return { supabase, user, orgId };
}

export async function updateOrgName(name: string) {
  const { orgId } = await getOrgContext();
  await requireOwner(orgId);

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Business name cannot be empty.");
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ name: cleanName })
    .eq("id", orgId);

  if (error) {
    console.error("Error updating organization name:", error);
    throw new Error("Failed to update organization name.");
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function updateOrgLogo(logoUrl: string | null) {
  const { orgId } = await getOrgContext();
  await requireOwner(orgId);

  const admin = getAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", orgId);

  if (error) {
    console.error("Error updating organization logo:", error);
    throw new Error("Failed to update organization logo.");
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function updateAccountEmail(newEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const cleanEmail = newEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const { error } = await supabase.auth.updateUser({ email: cleanEmail });
  if (error) {
    console.error("Error updating email:", error);
    throw new Error(error.message || "Failed to update email.");
  }

  return { 
    success: true, 
    message: "Confirmation link sent to your new email. Please verify to complete the change." 
  };
}

export async function updateAccountPassword(password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Error updating password:", error);
    throw new Error(error.message || "Failed to update password.");
  }

  return { success: true, message: "Password updated successfully." };
}

export async function updateAccountProfile(fullName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const cleanName = fullName.trim();
  if (!cleanName) throw new Error("Full name cannot be empty.");

  // Update Supabase auth user metadata
  const { error: metaError } = await supabase.auth.updateUser({
    data: { full_name: cleanName }
  });
  if (metaError) {
    console.error("Error updating user metadata:", metaError);
  }

  // Update profiles table
  const admin = getAdminClient();
  await admin.from("profiles").upsert({
    id: user.id,
    full_name: cleanName
  });

  return { success: true, message: "Profile updated successfully." };
}
