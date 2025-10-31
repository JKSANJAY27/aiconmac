// company-website/src/app/dashboard/testimonials/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { CheckCircle, XCircle, Trash2, X, Edit } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod schema for testimonial validation
const testimonialSchema = z.object({
  quote: z.string().min(10, "Quote is required"),
  author: z.string().min(3, "Author name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
  isApproved: z.boolean(),
});

type TestimonialFormInputs = z.infer<typeof testimonialSchema>;

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title?: string;
  company?: string;
  isApproved: boolean;
  createdAt: string;
}

export default function TestimonialsPage() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TestimonialFormInputs>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      isApproved: false,
    },
  });

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/testimonials'); // Fetch all, including unapproved ones
      setTestimonials(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['ADMIN', 'EDITOR', 'VIEWER'].includes(user.role)) {
      fetchTestimonials();
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user]);

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    reset({
      quote: testimonial.quote,
      author: testimonial.author,
      title: testimonial.title,
      company: testimonial.company,
      isApproved: testimonial.isApproved,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTestimonial(null);
    setDeletingTestimonialId(null);
    reset();
    setError(null);
  };

  
    const onSubmit: SubmitHandler<TestimonialFormInputs> = async (data) => {
    setError(null);
    try {
      // Testimonials are typically created from public site, this is for editing/approving
      if (editingTestimonial) {
        await api.put(`/testimonials/${editingTestimonial.id}`, data);
      } else {
        // If an admin/editor needs to manually create, uncomment and handle this
        // await api.post('/testimonials', data);
      }
      fetchTestimonials();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during submission.');
    }
  };

  const toggleApproval = async (testimonial: Testimonial) => {
    setError(null);
    try {
      // Only Admin/Editor can approve
      if (user?.role === 'ADMIN' || user?.role === 'EDITOR') {
        await api.put(`/testimonials/${testimonial.id}`, { isApproved: !testimonial.isApproved });
        fetchTestimonials(); // Re-fetch to update list
      } else {
        setError('You are not authorized to change approval status.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle approval.');
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingTestimonialId(id);
  };

  const deleteTestimonial = async (id: string) => {
    setError(null);
    try {
      // Only Admin/Editor can delete
      if (user?.role === 'ADMIN' || user?.role === 'EDITOR') {
        await api.delete(`/testimonials/${id}`);
        fetchTestimonials();
        closeModal();
      } else {
        setError('You are not authorized to delete testimonials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete testimonial.');
    }
  };

  if (loading) {
    return <AdminLayout><p>Loading testimonials...</p></AdminLayout>;
  }

  // Display authorization error if user is not allowed
  if (error && (!user || !['ADMIN', 'EDITOR', 'VIEWER'].includes(user.role))) {
    return <AdminLayout><p className="text-red-600">{error}</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Testimonials Management</h2>
        {/* Only Admin/Editor can create testimonials (if allowed by backend) */}
        {/* {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusCircle size={20} className="mr-2" /> New Testimonial
          </button>
        )} */}
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quote</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company / Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Approved</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {testimonials.map((testimonial) => (
              <tr key={testimonial.id}>
                <td className="px-6 py-4 max-w-xs truncate text-sm font-medium text-gray-900">{testimonial.quote}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{testimonial.author}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{testimonial.company || testimonial.title || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {/* Only Admin/Editor can toggle approval */}
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') ? (
                    <button
                      onClick={() => toggleApproval(testimonial)}
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        testimonial.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                      title={testimonial.isApproved ? 'Click to Unapprove' : 'Click to Approve'}
                    >
                      {testimonial.isApproved ? <CheckCircle size={16} className="mr-1" /> : <XCircle size={16} className="mr-1" />}
                      {testimonial.isApproved ? 'Yes' : 'No'}
                    </button>
                  ) : (
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      testimonial.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {testimonial.isApproved ? 'Yes' : 'No'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Only Admin/Editor can edit/delete */}
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') ? (
                    <>
                      <button
                        onClick={() => openEditModal(testimonial)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        title="Edit Testimonial"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(testimonial.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Testimonial"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Testimonial Modal (Edit) */}
      {showModal && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Testimonial</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {error && <p className="mb-4 text-red-600">{error}</p>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="quote" className="block text-sm font-medium text-gray-700">Quote</label>
                <textarea
                  id="quote" {...register('quote')} rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.quote && <p className="mt-1 text-sm text-red-600">{errors.quote.message}</p>}
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
                <input
                  type="text" id="author" {...register('author')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text" id="title" {...register('title')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text" id="company" {...register('company')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="isApproved" type="checkbox" {...register('isApproved')}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-900">Approve Testimonial</label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTestimonialId && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this testimonial? This action cannot be undone.</p>
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
                onClick={() => deleteTestimonial(deletingTestimonialId)}
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
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