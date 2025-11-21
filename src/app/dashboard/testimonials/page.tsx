// company-website/src/app/dashboard/testimonials/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { CheckCircle, XCircle, Trash2, X, Edit2, Plus, Quote, MessageSquare } from 'lucide-react';
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
      const response = await api.get('/testimonials');
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
      if (editingTestimonial) {
        await api.put(`/testimonials/${editingTestimonial.id}`, data);
      } else {
        await api.post('/testimonials', data);
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
      if (user?.role === 'ADMIN' || user?.role === 'EDITOR') {
        await api.put(`/testimonials/${testimonial.id}`, { isApproved: !testimonial.isApproved });
        fetchTestimonials();
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
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && (!user || !['ADMIN', 'EDITOR', 'VIEWER'].includes(user.role))) {
    return <AdminLayout><p className="text-destructive">{error}</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Testimonials</h2>
            <p className="text-muted-foreground">Review and manage client testimonials.</p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus size={18} className="mr-2" /> New Testimonial
            </button>
          )}
        </div>

        {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4">
                <Quote className="h-8 w-8 text-primary/20" />
              </div>

              <blockquote className="flex-1 text-lg font-medium leading-relaxed text-foreground">
                "{testimonial.quote}"
              </blockquote>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.title && testimonial.company
                      ? `${testimonial.title}, ${testimonial.company}`
                      : testimonial.title || testimonial.company || ''}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') ? (
                    <button
                      onClick={() => toggleApproval(testimonial)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${testimonial.isApproved
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
                        }`}
                    >
                      {testimonial.isApproved ? (
                        <><CheckCircle size={14} className="mr-1" /> Approved</>
                      ) : (
                        <><XCircle size={14} className="mr-1" /> Pending</>
                      )}
                    </button>
                  ) : (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${testimonial.isApproved
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-800'
                      }`}>
                      {testimonial.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                    <>
                      <button
                        onClick={() => openEditModal(testimonial)}
                        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(testimonial.id)}
                        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No testimonials yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add your first client testimonial to get started.</p>
            {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                <Plus size={16} className="mr-2" /> Add Testimonial
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-background shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h3 className="text-xl font-semibold text-foreground">{editingTestimonial ? 'Edit Testimonial' : 'New Testimonial'}</h3>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground">Quote</label>
                <textarea
                  {...register('quote')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Client's testimonial..."
                />
                {errors.quote && <p className="mt-1 text-xs text-destructive">{errors.quote.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Author</label>
                <input
                  {...register('author')}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Client Name"
                />
                {errors.author && <p className="mt-1 text-xs text-destructive">{errors.author.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <input
                    {...register('title')}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. CEO"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Company</label>
                  <input
                    {...register('company')}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isApproved"
                  {...register('isApproved')}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <label htmlFor="isApproved" className="text-sm font-medium text-foreground">Approve Testimonial</label>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTestimonialId && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Testimonial</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTestimonial(deletingTestimonialId)}
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