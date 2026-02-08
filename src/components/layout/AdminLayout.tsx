// company-website/src/components/layout/AdminLayout.tsx
"use client";

import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FolderDot,
  MessageSquare,
  Briefcase,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Building2,
  FileText,
  UserCog
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  currentPath: string;
  sidebarOpen: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, currentPath, sidebarOpen }) => {
  const isActive = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href));
  return (
    <Link href={href} className={
      `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out
       ${isActive
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`
    }>
      <span className={`${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`}>
        {icon}
      </span>
      {sidebarOpen && (
        <span className="ml-3 fade-in-5 duration-300">{label}</span>
      )}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/projects', icon: <FolderDot size={20} />, label: 'Projects', roles: ['ADMIN', 'EDITOR'] },
    { href: '/dashboard/clients', icon: <Building2 size={20} />, label: 'Clients', roles: ['ADMIN', 'EDITOR'] },
    { href: '/dashboard/testimonials', icon: <MessageSquare size={20} />, label: 'Testimonials', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/contacts', icon: <Briefcase size={20} />, label: 'Contact Forms', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/careers', icon: <Users size={20} />, label: 'Career Submissions', roles: ['ADMIN', 'EDITOR'] },
    { href: '/dashboard/brochure-requests', icon: <FileText size={20} />, label: 'Brochure Requests', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/users', icon: <UserCog size={20} />, label: 'User Management', roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));
  const currentRouteTitle = filteredNavItems.find(item => pathname.startsWith(item.href))?.label || "Dashboard";

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'} 
        `}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          {sidebarOpen && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              Aiconmac
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ml-auto"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {filteredNavItems.map((item) => (
            <NavItem key={item.href} {...item} currentPath={pathname} sidebarOpen={sidebarOpen} />
          ))}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div className={`flex items-center ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-sm">
              {user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{user.name || user.email}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`mt-4 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive
              ${!sidebarOpen ? 'justify-center' : ''}
            `}
            title="Logout"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-8 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{currentRouteTitle}</h1>
          </div>
        </header>
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}