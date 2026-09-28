"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

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

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsLoading(false);
        return;
      }

      // Fetch active memberships for this user
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

      const orgs: Organization[] = data.map((m: any) => ({
        id: m.organizations.id,
        name: m.organizations.name,
        slug: m.organizations.slug,
        role: m.role,
      }));

      setOrganizations(orgs);

      // Check localStorage for a previously selected org
      const savedOrgId = localStorage.getItem('current_org_id');
      const savedOrg = orgs.find((o) => o.id === savedOrgId);

      if (savedOrg) {
        setCurrentOrg(savedOrg);
        document.cookie = `current_org_id=${savedOrg.id}; path=/; max-age=31536000`;
      } else if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
        localStorage.setItem('current_org_id', orgs[0].id);
        document.cookie = `current_org_id=${orgs[0].id}; path=/; max-age=31536000`;
      } else {
        // User is logged in but has no memberships
        if (window.location.pathname !== '/onboarding') {
          window.location.href = '/onboarding';
        }
      }

      setIsLoading(false);
    }

    loadOrganizations();
  }, []);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('current_org_id', org.id);
      document.cookie = `current_org_id=${org.id}; path=/; max-age=31536000`;
      // Optional: Force a page reload to reset any local state
      window.location.reload();
    }
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
