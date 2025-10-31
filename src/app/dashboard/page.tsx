// company-website/src/app/dashboard/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <AdminLayout>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Welcome to your Dashboard, {user?.name || user?.email}!</h2>
        <p className="text-gray-700">
          From here, you can manage your website's content. Use the sidebar to navigate.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-800">Projects</h3>
            <p className="text-gray-600">Manage all architectural and industrial models.</p>
            <Link href="/dashboard/projects" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
              Go to Projects &rarr;
            </Link>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-800">Testimonials</h3>
            <p className="text-gray-600">Review and approve client testimonials.</p>
            <Link href="/dashboard/testimonials" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
              Go to Testimonials &rarr;
            </Link>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-800">Submissions</h3>
            <p className="text-gray-600">View contact and career form entries.</p>
            <Link href="/dashboard/contacts" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
              Go to Contact Forms &rarr;
            </Link>
            <Link href="/dashboard/careers" className="mt-1 inline-block text-indigo-600 hover:text-indigo-800">
              Go to Career Submissions &rarr;
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}