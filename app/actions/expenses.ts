"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/utils/permissions";

async function getOrgId(): Promise<string> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('current_org_id')?.value;
  if (!orgId) throw new Error("No organization selected");
  return orgId;
}

export async function addExpense(data: any, path: string) {
  const supabase = await createClient();
  const orgId = await getOrgId();

  const { error } = await supabase
    .from('company_expenses')
    .insert([{
      entry_date: data.entry_date,
      category: data.category,
      description: data.description,
      amount: data.amount,
      organization_id: orgId,
    }]);

  if (error) {
    console.error("Add expense error:", error);
    throw new Error("Failed to add expense");
  }

  revalidatePath(path);
}

export async function deleteExpense(id: string, path: string) {
  const orgId = await getOrgId();
  await requireOwner(orgId);
  const supabase = await createClient();

  const { error } = await supabase
    .from('company_expenses')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) throw new Error("Failed to delete expense");
  revalidatePath(path);
}

export async function addIncome(data: any, path: string) {
  const supabase = await createClient();
  const orgId = await getOrgId();

  const { error } = await supabase
    .from('company_income')
    .insert([{
      entry_date: data.entry_date,
      source: data.source,
      description: data.description,
      amount: data.amount,
      organization_id: orgId,
    }]);

  if (error) {
    console.error("Add income error:", error);
    throw new Error("Failed to add income");
  }

  revalidatePath(path);
}

export async function deleteIncome(id: string, path: string) {
  const orgId = await getOrgId();
  await requireOwner(orgId);
  const supabase = await createClient();

  const { error } = await supabase
    .from('company_income')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) throw new Error("Failed to delete income");
  revalidatePath(path);
}
