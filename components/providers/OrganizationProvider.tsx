"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type OrganizationContextType = {
  currentOrg: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => void;
  isLoading: boolean;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // Track whether the initial load has ever succeeded so we don't redirect mid-load
  const loadedRef = useRef(false);

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('memberships')
        .select(`
          role,
          organization_id,
          organizations:organization_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userData.user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching organizations:', error);
        setIsLoading(false);
        return;
      }

      const orgs: Organization[] = (data || [])
        .filter((m: any) => m.organizations) // guard against null joins
        .map((m: any) => ({
          id: m.organizations.id,
          name: m.organizations.name,
          slug: m.organizations.slug,
          role: m.role,
        }));

      setOrganizations(orgs);
      loadedRef.current = true;

      // Restore previously selected org from localStorage
      const savedOrgId = localStorage.getItem('current_org_id');
      const savedOrg = orgs.find((o) => o.id === savedOrgId);

      if (savedOrg) {
        setCurrentOrg(savedOrg);
        document.cookie = `current_org_id=${savedOrg.id}; path=/; max-age=31536000; SameSite=Lax`;
      } else if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
        localStorage.setItem('current_org_id', orgs[0].id);
        document.cookie = `current_org_id=${orgs[0].id}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        // Only redirect to onboarding AFTER the load confirmed no orgs exist
        if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
          router.push('/onboarding');
        }
      }

      setIsLoading(false);
    }

    loadOrganizations();
  }, []);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return;

    // Update state immediately so the UI doesn't flicker
    setCurrentOrg(org);
    localStorage.setItem('current_org_id', org.id);
    // Set cookie synchronously so the next server render picks it up
    document.cookie = `current_org_id=${org.id}; path=/; max-age=31536000; SameSite=Lax`;
    // Use router.refresh() instead of window.location.reload() — this re-fetches
    // server components without unmounting/remounting client components,
    // so the sidebar never disappears
    router.refresh();
  };

  return (
    <OrganizationContext.Provider value={{ currentOrg, organizations, switchOrganization, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
