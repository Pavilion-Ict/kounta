"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Box, 
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Plus
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useOrganization } from "@/components/providers/OrganizationProvider";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Fixed Cost Product", href: "/fixed-cost-product", icon: Package },
  { name: "Non-Fixed Cost", href: "/non-fixed-cost-product", icon: Box },
  { name: "Additional Income/Exp", href: "/income-expenses", icon: CircleDollarSign },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const { currentOrg, organizations, switchOrganization } = useOrganization();

  const isAuthPage = pathname.startsWith('/login') || 
                     pathname.startsWith('/signup') || 
                     pathname.startsWith('/forgot-password') || 
                     pathname.startsWith('/onboarding');

  if (isAuthPage) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear org cookie
    document.cookie = 'current_org_id=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  };

  const userInitials = currentOrg?.name?.slice(0, 2).toUpperCase() ?? 'KT';

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-100"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 
          transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header/Logo area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50/50">
          <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
            <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl text-primary tracking-tight">Kounta</span>
          </div>
          {isCollapsed && (
            <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain mx-auto" />
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-6 bg-white border border-gray-100 rounded-full p-1.5 hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors shadow-sm"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Organization Switcher */}
        {!isCollapsed && currentOrg && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (organizations.length > 1) setShowOrgMenu(!showOrgMenu);
                }}
                className="flex flex-1 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:bg-gray-50 min-w-0"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  {currentOrg.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{currentOrg.name}</span>
                  <span className="block text-[11px] text-gray-500 capitalize">{currentOrg.role}</span>
                </span>
                {organizations.length > 1 && (
                  <ChevronRight size={14} className={`shrink-0 text-gray-400 transition-transform ${showOrgMenu ? 'rotate-90' : ''}`} />
                )}
              </button>
              <Link
                href="/onboarding"
                title="Create new organization"
                className="shrink-0 w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors shadow-sm"
              >
                <Plus size={14} />
              </Link>
            </div>
            {/* Org dropdown */}
            {showOrgMenu && organizations.length > 1 && (
              <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setShowOrgMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 ${
                      org.id === currentOrg.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-200 text-[10px] font-bold text-gray-600">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 py-3 border-b border-gray-100">
            {currentOrg && (
              <div
                className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white cursor-default"
                title={currentOrg.name}
              >
                {currentOrg.name.charAt(0).toUpperCase()}
              </div>
            )}
            <Link
              href="/onboarding"
              title="Create new organization"
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <Plus size={14} />
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
          <div className={`text-xs font-bold text-gray-400 mb-2 px-2 tracking-wider transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
            MAIN MENU
          </div>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-brand-blue-200/5 text-primary font-semibold' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Footer — user info + logout */}
        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="font-bold text-blue-700 text-xs">{userInitials}</span>
              </div>
              <div className={`min-w-0 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                <p className="text-sm font-semibold text-gray-800 truncate">{currentOrg?.name ?? 'Kounta'}</p>
                <p className="text-xs text-gray-400 capitalize">{currentOrg?.role ?? ''}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              className={`shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
