// company-website/src/components/layout/AdminLayout.tsx
"use client";

import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation'; // Use usePathname for App Router
import Link from 'next/link';
import { Home, FolderDot, MessageSquare, Briefcase, Users, LogOut, ChevronLeft, Menu } from 'lucide-react'; // Changed ChevronRight to Menu for toggle

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  currentPath: string;
  sidebarOpen: boolean; // Add sidebarOpen to props
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, currentPath, sidebarOpen }) => {
  const isActive = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href));
  return (
    <Link href={href} className={
      `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
       ${isActive
         ? 'bg-indigo-700 text-white'
         : 'text-gray-300 hover:bg-indigo-600 hover:text-white'
       }`
    }>
      {icon}
      {sidebarOpen && <span className="ml-3">{label}</span>} {/* Conditionally render label */}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname(); // Get current pathname
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-700">Loading user session...</p>
      </div>
    );
  }

  // user check and redirect is handled by AuthContext's useEffect,
  // so if we reach here, user is guaranteed to be present or will be redirected shortly.
  // Add an explicit check just in case, though it should be caught by AuthContext.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-700">Redirecting to login...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', icon: <Home size={20} />, label: 'Dashboard', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/projects', icon: <FolderDot size={20} />, label: 'Projects', roles: ['ADMIN', 'EDITOR'] },
    { href: '/dashboard/testimonials', icon: <MessageSquare size={20} />, label: 'Testimonials', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/contacts', icon: <Briefcase size={20} />, label: 'Contact Forms', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { href: '/dashboard/careers', icon: <Users size={20} />, label: 'Career Submissions', roles: ['ADMIN', 'EDITOR'] },
    // Add User Management if you want admins to create/manage users from the UI
    // { href: '/dashboard/users', icon: <Users size={20} />, label: 'Users', roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const currentRouteTitle = filteredNavItems.find(item => pathname.startsWith(item.href))?.label || "Dashboard";


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`flex flex-col bg-gray-800 text-white transition-all duration-300
                       ${sidebarOpen ? 'w-64' : 'w-20'} `}>
        <div className="flex h-16 items-center justify-between px-4">
          {sidebarOpen && <span className="text-xl font-semibold">Aiconmac Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-700">
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="mt-5 flex-1 px-2">
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <NavItem key={item.href} {...item} currentPath={pathname} sidebarOpen={sidebarOpen} />
            ))}
          </div>
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-medium">
              {user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && <div className="ml-3 text-sm font-medium">{user.name || user.email}</div>}
          </div>
          {sidebarOpen && <div className="ml-11 text-xs text-gray-400">Role: {user.role}</div>}
          <button
            onClick={logout}
            className="mt-4 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{currentRouteTitle}</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}