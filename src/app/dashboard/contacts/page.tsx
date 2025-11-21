// company-website/src/app/dashboard/contacts/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Mail, Phone, MessageSquare, BookOpen, BookMinus, Trash2, X, Eye, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  projectType?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ContactSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<ContactSubmission | null>(null);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contact'); // Fetch all contact submissions
      setSubmissions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch contact submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['ADMIN', 'EDITOR', 'VIEWER'].includes(user.role)) {
      fetchSubmissions();
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user]);

  const toggleReadStatus = async (submission: ContactSubmission) => {
    setError(null);
    try {
      // Only Admin/Editor can mark as read
      if (user?.role === 'ADMIN' || user?.role === 'EDITOR') {
        await api.put(`/contact/${submission.id}`, { isRead: !submission.isRead });
        fetchSubmissions(); // Re-fetch to update list
      } else {
        setError('You are not authorized to change read status.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update read status.');
    }
  };

  const openViewModal = (submission: ContactSubmission) => {
    setViewingSubmission(submission);
    // Automatically mark as read when viewing, if user is authorized
    if (!submission.isRead && (user?.role === 'ADMIN' || user?.role === 'EDITOR')) {
      toggleReadStatus(submission);
    }
  };

  const closeModal = () => {
    setViewingSubmission(null);
    setDeletingSubmissionId(null);
    setError(null);
  };

  const confirmDelete = (id: string) => {
    setDeletingSubmissionId(id);
  };

  const deleteSubmission = async (id: string) => {
    setError(null);
    try {
      // Only Admin can delete
      if (user?.role === 'ADMIN') {
        await api.delete(`/contact/${id}`);
        fetchSubmissions();
        closeModal();
      } else {
        setError('You are not authorized to delete submissions.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete submission.');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  // Display authorization error if user is not allowed
  if (error && (!user || !['ADMIN', 'EDITOR', 'VIEWER'].includes(user.role))) {
    return <AdminLayout><p className="text-destructive">{error}</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Contact Submissions</h2>
            <p className="text-muted-foreground">Manage inquiries and messages from the contact form.</p>
          </div>
        </div>

        {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className={`relative flex flex-col rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${submission.isRead ? 'bg-card border-border' : 'bg-card border-primary/50 ring-1 ring-primary/10'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${submission.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{submission.fullName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!submission.isRead && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    New
                  </span>
                )}
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail size={14} />
                  <span className="truncate">{submission.email}</span>
                </div>
                {submission.projectType && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare size={14} />
                    <span>{submission.projectType}</span>
                  </div>
                )}
                <div className="mt-2 line-clamp-3 text-sm text-foreground/80">
                  "{submission.message}"
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <button
                  onClick={() => openViewModal(submission)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View Details
                </button>

                <div className="flex items-center gap-1">
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                    <button
                      onClick={() => toggleReadStatus(submission)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title={submission.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {submission.isRead ? <BookMinus size={16} /> : <BookOpen size={16} />}
                    </button>
                  )}
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => confirmDelete(submission.id)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {submissions.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No submissions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Contact form submissions will appear here.</p>
          </div>
        )}
      </div>

      {/* View Submission Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-background shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h3 className="text-xl font-semibold text-foreground">Submission Details</h3>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase text-muted-foreground">Full Name</label>
                  <p className="mt-1 text-sm font-medium text-foreground">{viewingSubmission.fullName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-muted-foreground">Date</label>
                  <p className="mt-1 text-sm text-foreground">{new Date(viewingSubmission.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
                  <a href={`mailto:${viewingSubmission.email}`} className="mt-1 block text-sm text-primary hover:underline">{viewingSubmission.email}</a>
                </div>
                {viewingSubmission.phone && (
                  <div>
                    <label className="text-xs font-medium uppercase text-muted-foreground">Phone</label>
                    <a href={`tel:${viewingSubmission.phone}`} className="mt-1 block text-sm text-primary hover:underline">{viewingSubmission.phone}</a>
                  </div>
                )}
              </div>

              {viewingSubmission.projectType && (
                <div>
                  <label className="text-xs font-medium uppercase text-muted-foreground">Project Type</label>
                  <p className="mt-1 text-sm text-foreground">{viewingSubmission.projectType}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">Message</label>
                <div className="mt-2 rounded-md bg-muted p-4 text-sm text-foreground whitespace-pre-wrap">
                  {viewingSubmission.message}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border p-6">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubmissionId && (user?.role === 'ADMIN') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Submission</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSubmission(deletingSubmissionId)}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}