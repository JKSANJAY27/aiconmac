// company-website/src/app/dashboard/careers/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Mail, Phone, BookOpen, BookMinus, Download, Eye, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface CareerSubmission {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
  resumeUrl?: string; // URL from Cloudinary
  isRead: boolean;
  createdAt: string;
}

export default function CareerSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CareerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<CareerSubmission | null>(null);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/careers'); // Fetch all career submissions
      setSubmissions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch career submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['ADMIN', 'EDITOR'].includes(user.role)) { // Only Admin/Editor can view career submissions
      fetchSubmissions();
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user]);

  const toggleReadStatus = async (submission: CareerSubmission) => {
    setError(null);
    try {
      // Only Admin/Editor can mark as read
      if (user?.role === 'ADMIN' || user?.role === 'EDITOR') {
        await api.put(`/careers/${submission.id}`, { isRead: !submission.isRead });
        fetchSubmissions(); // Re-fetch to update list
      } else {
        setError('You are not authorized to change read status.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update read status.');
    }
  };

  const openViewModal = (submission: CareerSubmission) => {
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
        await api.delete(`/careers/${id}`);
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
    return <AdminLayout><p>Loading career submissions...</p></AdminLayout>;
  }

  // Display authorization error if user is not allowed
  if (error && (!user || !['ADMIN', 'EDITOR'].includes(user.role))) {
    return <AdminLayout><p className="text-red-600">{error}</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Career Submissions</h2>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Resume</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {submissions.map((submission) => (
              <tr key={submission.id} className={submission.isRead ? 'bg-gray-50' : 'bg-blue-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{submission.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {submission.resumeUrl ? (
                    <Link href={submission.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
                      <Download size={16} className="mr-1" /> View Resume
                    </Link>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {/* Status indicator, conditional on user role for interactivity */}
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') ? (
                    <button
                      onClick={() => toggleReadStatus(submission)}
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        submission.isRead ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}
                      title={submission.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {submission.isRead ? 'Read' : 'New'}
                    </button>
                  ) : (
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      submission.isRead ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {submission.isRead ? 'Read' : 'New'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openViewModal(submission)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {/* Only Admin/Editor can mark as read/unread */}
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                    <button
                      onClick={() => toggleReadStatus(submission)}
                      className={`mr-4 ${submission.isRead ? 'text-blue-500 hover:text-blue-700' : 'text-green-500 hover:text-green-700'}`}
                      title={submission.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {submission.isRead ? <BookMinus size={18} /> : <BookOpen size={18} />}
                    </button>
                  )}
                  {/* Only Admin can delete */}
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => confirmDelete(submission.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Submission"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {user?.role === 'VIEWER' && (
                    <span className="text-gray-400">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Submission Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Career Submission Details</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 text-gray-700">
              <p><strong>Name:</strong> {viewingSubmission.fullName}</p>
              <p><strong>Email:</strong> <a href={`mailto:${viewingSubmission.email}`} className="text-indigo-600 hover:underline">{viewingSubmission.email}</a></p>
              {viewingSubmission.phone && <p><strong>Phone:</strong> <a href={`tel:${viewingSubmission.phone}`} className="text-indigo-600 hover:underline">{viewingSubmission.phone}</a></p>}
              {viewingSubmission.message && <p><strong>Message:</strong></p>}
              {viewingSubmission.message && <p className="border border-gray-200 rounded-md p-3 bg-gray-50 whitespace-pre-wrap">{viewingSubmission.message}</p>}
              {viewingSubmission.resumeUrl && (
                <p>
                  <strong>Resume:</strong>{' '}
                  <Link href={viewingSubmission.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-indigo-600 hover:underline">
                    <Download size={16} className="mr-1" /> View Resume
                  </Link>
                </p>
              )}
              <p className="text-sm text-gray-500">Submitted on: {new Date(viewingSubmission.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubmissionId && (user?.role === 'ADMIN') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this career submission? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteSubmission(deletingSubmissionId)}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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