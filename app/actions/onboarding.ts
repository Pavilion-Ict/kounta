"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to create a URL-safe slug from a company name
function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
}

export async function createOrganization(formData: FormData) {
  const companyName = formData.get('companyName') as string;
  if (!companyName) return { error: "Company name is required." };

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { /* handled in middleware */ },
      },
    }
  );

  const { createClient } = await import('@supabase/supabase-js');
  // We need to use the Service Role to bypass RLS for initial creation. 
  // We MUST NOT pass cookies here, or Supabase will downgrade the permissions to the user's JWT.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  try {
    // 1. Ensure profile exists
    const fullName = user.user_metadata?.full_name || 'Unknown User';
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName }) // upsert in case it already exists

    // 2. Create the Organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({ 
        name: companyName, 
        slug: generateSlug(companyName) 
      })
      .select('id')
      .single();

    if (orgError) throw orgError;

    // 3. Link the user to the Organization as 'owner'
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      });

    if (membershipError) throw membershipError;

    return { success: true };
  } catch (err: any) {
    console.error("Onboarding Error:", err);
    return { error: err.message || "Failed to create organization." };
  }
}
