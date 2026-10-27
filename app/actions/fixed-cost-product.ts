"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/utils/permissions";

type CatalogueItem = {
  id: string;
  service_name: string;
  cop_rate: number;
  organization_id: string;
};

type StockLog = {
  id: string;
  date: string;
  opening_stock: string | null;
  additional_notes: string | null;
  closing_stock: string | null;
  organization_id: string;
};

export async function verifyCopPin(pin: string): Promise<boolean> {
  const secret = process.env.COP_SECRET_PIN;
  if (!secret) return false;
  return pin === secret;
}

export async function getCatalogue(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publishing_catalogue")
    .select("*")
    .eq('organization_id', orgId)
    .order("service_name");
  
  if (error) {
    console.error("Error fetching catalogue:", error);
    return [];
  }
  
  return data as CatalogueItem[];
}

export async function updateCatalogue(services: { service_name: string; cop_rate: number }[], orgId: string) {
  await requireOwner(orgId);
  const supabase = await createClient();
  const payload = services.map(s => ({ ...s, organization_id: orgId }));
  const { error } = await supabase
    .from("publishing_catalogue")
    .upsert(payload, { onConflict: "service_name, organization_id" });

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/fixed-cost-product");
}

export async function deleteCatalogueItem(serviceName: string, orgId: string) {
  await requireOwner(orgId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("publishing_catalogue")
    .delete()
    .eq("service_name", serviceName)
    .eq("organization_id", orgId);
  
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/fixed-cost-product");
}

export async function getStockLogs(orgId: string) {
  const supabase = await createClient();
  // Fixing the table name from publishing_catalogue to inventory_record which has the date column
  const { data, error } = await supabase
    .from("inventory_record")
    .select("*")
    .eq('organization_id', orgId)
    .order("date", { ascending: false });
  
  if (error) {
    console.error("Error fetching stock:", error);
    return [];
  }
  
  return data as StockLog[];
}

export async function saveStockLog(log: { date: string; opening_stock: string; additional_notes: string; closing_stock: string }, orgId: string) {
  const supabase = await createClient();
  // Fixing the table name from publishing_stock to inventory_record
  const { error } = await supabase
    .from("inventory_record")
    .upsert({ ...log, organization_id: orgId }, { onConflict: "date, organization_id" });

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/fixed-cost-product");
}
