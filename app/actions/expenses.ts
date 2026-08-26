"use server";


import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addExpense(data: any, path: string) {


  const { error } = await supabase
    .from('company_expenses')
    .insert([{
      entry_date: data.entry_date,
      category: data.category,
      description: data.description,
      amount: data.amount,
    }]);

  if (error) {
    console.error("Add expense error:", error);
    throw new Error("Failed to add expense");
  }

  revalidatePath(path);
}

export async function deleteExpense(id: string, path: string) {


  const { error } = await supabase.from('company_expenses').delete().eq('id', id);
  if (error) throw new Error("Failed to delete expense");
  revalidatePath(path);
}

export async function addIncome(data: any, path: string) {


  const { error } = await supabase
    .from('company_income')
    .insert([{
      entry_date: data.entry_date,
      source: data.source,
      description: data.description,
      amount: data.amount,
    }]);

  if (error) {
    console.error("Add income error:", error);
    throw new Error("Failed to add income");
  }

  revalidatePath(path);
}

export async function deleteIncome(id: string, path: string) {


  const { error } = await supabase.from('company_income').delete().eq('id', id);
  if (error) throw new Error("Failed to delete income");
  revalidatePath(path);
}
