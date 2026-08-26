"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

type CatalogueItem = {
  id: string;
  service_name: string;
  cop_rate: number;
};

type StockLog = {
  id: string;
  date: string;
  opening_stock: string | null;
  additional_notes: string | null;
  closing_stock: string | null;
};

export async function verifyCopPin(pin: string): Promise<boolean> {
  const secret = process.env.COP_SECRET_PIN;
  if (!secret) return false;
  return pin === secret;
}

export async function getCatalogue() {
  const { data, error } = await supabase.from("publishing_catalogue").select("*").order("service_name");
  
  if (error) {
    console.error("Error fetching catalogue:", error);
    return [];
  }
  
  return data as CatalogueItem[];
}

export async function updateCatalogue(services: { service_name: string; cop_rate: number }[]) {
  const { error } = await supabase
    .from("publishing_catalogue")
    .upsert(services, { onConflict: "service_name" });

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/publishing");
}

export async function deleteCatalogueItem(serviceName: string) {
  const { error } = await supabase.from("publishing_catalogue").delete().eq("service_name", serviceName);
  
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/publishing");
}

export async function getStockLogs() {
  const { data, error } = await supabase.from("publishing_catalogue").select("*").order("date", { ascending: false });
  
  if (error) {
    console.error("Error fetching stock:", error);
    return [];
  }
  
  return data as StockLog[];
}

export async function saveStockLog(log: { date: string; opening_stock: string; additional_notes: string; closing_stock: string }) {
  const { error } = await supabase
    .from("publishing_stock")
    .upsert(log, { onConflict: "date" });

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/publishing");
}
