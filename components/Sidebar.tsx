"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Box, 
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard
  },
  {
    name: "Fixed Cost Product",
    href: "/fixed-cost-product",
    icon: Package
  },
  {
    name: "Non-Fixed Cost",
    href: "/non-fixed-cost-product",
    icon: Box
  },
  {
    name: "Additional Income/Exp",
    href: "/income-expenses",
    icon: CircleDollarSign
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
        
        {/* Footer area - optional account settings link */}
        <div className="p-4 border-t border-gray-50/50">
           <div className={`flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}>
             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
               <span className="font-bold text-gray-600 text-xs">A</span>
             </div>
             <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
               Admin User
             </span>
           </div>
        </div>
      </aside>
    </>
  );
}
