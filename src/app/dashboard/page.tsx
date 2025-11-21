// company-website/src/app/dashboard/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderDot, MessageSquare, Briefcase, Users, ArrowRight, Plus, Activity } from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { label: 'Total Projects', value: '...', icon: <FolderDot className="h-5 w-5 text-blue-500" />, change: 'Loading...' },
    { label: 'Testimonials', value: '...', icon: <MessageSquare className="h-5 w-5 text-green-500" />, change: 'Loading...' },
    { label: 'New Contacts', value: '...', icon: <Briefcase className="h-5 w-5 text-purple-500" />, change: 'Loading...' },
    { label: 'Career Apps', value: '...', icon: <Users className="h-5 w-5 text-orange-500" />, change: 'Loading...' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projectsRes, testimonialsRes, contactsRes, careersRes] = await Promise.all([
          api.get('/projects'),
          api.get('/testimonials'),
          api.get('/contact'),
          api.get('/careers')
        ]);

        const projects = projectsRes.data;
        const testimonials = testimonialsRes.data;
        const contacts = contactsRes.data;
        const careers = careersRes.data;

        const pendingTestimonials = testimonials.filter((t: any) => !t.isApproved).length;
        const unreadContacts = contacts.filter((c: any) => !c.isRead).length;
        const unreadCareers = careers.filter((c: any) => !c.isRead).length;

        setStats([
          {
            label: 'Total Projects',
            value: projects.length.toString(),
            icon: <FolderDot className="h-5 w-5 text-blue-500" />,
            change: `${projects.filter((p: any) => p.isPublished).length} published`
          },
          {
            label: 'Testimonials',
            value: testimonials.length.toString(),
            icon: <MessageSquare className="h-5 w-5 text-green-500" />,
            change: `${pendingTestimonials} pending`
          },
          {
            label: 'New Contacts',
            value: contacts.length.toString(),
            icon: <Briefcase className="h-5 w-5 text-purple-500" />,
            change: `${unreadContacts} unread`
          },
          {
            label: 'Career Apps',
            value: careers.length.toString(),
            icon: <Users className="h-5 w-5 text-orange-500" />,
            change: `${unreadCareers} new`
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your website today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                {stat.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Quick Actions */}
          <div className="col-span-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/dashboard/projects/new" className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 hover:border-primary/50 hover:bg-accent transition-colors">
                  <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-foreground">Add New Project</span>
                </Link>
                <Link href="/dashboard/testimonials" className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 hover:border-primary/50 hover:bg-accent transition-colors">
                  <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-foreground">Review Testimonials</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="col-span-3 rounded-xl border border-border bg-card shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">New contact form submission</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}