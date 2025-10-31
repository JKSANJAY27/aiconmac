// company-website/src/app/dashboard/projects/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PlusCircle, Edit, Trash2, X, UploadCloud, Eye, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image'; // Import Next.js Image component
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod schema for project validation
const projectSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  badge: z.string().min(1, "Badge is required"),
  category: z.string().min(1, "Category is required"),
  slug: z.string()
    .min(3, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  isPublished: z.boolean().default(false).optional(), // ✅ allow optional
  existingImages: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    altText: z.string().optional(),
    order: z.number().optional(),
  })).optional(),
  newImages: z.any().optional(),
});


type ProjectFormInputs = z.infer<typeof projectSchema>;

// Extend type for fetch results for clarity
interface ProjectImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  badge: string;
  category: string;
  slug: string;
  isPublished: boolean;
  images: ProjectImage[];
  createdAt: string;
}

// Categories for dropdown (should match backend enum/categories)
const categories = [
  'architectural', 'industrial', 'masterplan', '3d-printing', 'business-gifts'
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormInputs>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      isPublished: false,
      existingImages: [],
    },
  });

  // react-hook-form field array for managing existing images
  const { fields: existingImageFields, append, remove } = useFieldArray({
    control,
    name: "existingImages",
  });

  const watchNewImages = watch("newImages");

  // Generate image previews for newly selected files
  useEffect(() => {
    if (watchNewImages instanceof FileList && watchNewImages.length > 0) {
      const urls = Array.from(watchNewImages).map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url)); // Clean up URLs
    } else {
      setImagePreviews([]);
    }
  }, [watchNewImages]);


  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects'); // Fetch all projects, including unpublished
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authorized
    if (user && (user.role === 'ADMIN' || user.role === 'EDITOR')) {
      fetchProjects();
    } else if (!user) {
      // If no user, it means still loading or unauthenticated, handled by AuthContext
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user]); // Depend on user to re-fetch/authorize when user state changes

  const openCreateModal = () => {
    setEditingProject(null);
    reset({ // Reset form to default empty values
      title: '', description: '', badge: '', category: '', slug: '', isPublished: false,
      existingImages: [],
      newImages: undefined, // Explicitly clear file input state
    });
    setImagePreviews([]); // Clear any old previews
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    reset({ // Populate form with existing project data
      title: project.title,
      description: project.description,
      badge: project.badge,
      category: project.category,
      slug: project.slug,
      isPublished: project.isPublished,
      existingImages: project.images.map(img => ({ id: img.id, url: img.url, altText: img.altText, order: img.order })),
      newImages: undefined, // No new images selected initially for edit
    });
    setImagePreviews([]); // Clear any new image previews
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setDeletingProjectId(null);
    reset(); // Clear form state on close
    setImagePreviews([]);
    setError(null);
  };

  const onSubmit = async (data: ProjectFormInputs) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('badge', data.badge);
      formData.append('category', data.category);
      formData.append('slug', data.slug);
      formData.append('isPublished', String(data.isPublished)); // Convert boolean to string for FormData

      // Append IDs of existing images to keep
      data.existingImages?.forEach(img => formData.append('existingImageIds[]', img.id));

      // Append new image files
      if (data.newImages && data.newImages instanceof FileList && data.newImages.length > 0) {
        Array.from(data.newImages).forEach(file => formData.append('images', file));
      } else if (!editingProject && (!data.newImages || data.newImages.length === 0)) {
        // If creating a new project, at least one image (new or existing) is required.
        // This validation is a basic check. Backend also validates.
        throw new Error('At least one image is required for a new project.');
      }

      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }, // Important for file uploads
        });
      } else {
        await api.post('/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }, // Important for file uploads
        });
      }
      fetchProjects(); // Re-fetch list to update UI
      closeModal();
    } catch (err: any) {
      // Display error message from backend or custom error
      setError(err.response?.data?.message || err.message || 'An error occurred during submission.');
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingProjectId(id);
  };

  const deleteProject = async (id: string) => {
    setError(null);
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  if (loading) {
    return <AdminLayout><p>Loading projects...</p></AdminLayout>;
  }

  // Display authorization error if user is not allowed
  if (error && (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR'))) {
    return <AdminLayout><p className="text-red-600">{error}</p></AdminLayout>;
  }


  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Projects Management</h2>
        {/* Only Admin/Editor can create projects */}
        {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusCircle size={20} className="mr-2" /> New Project
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Published</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{project.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    project.isPublished ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {project.isPublished ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Only Admin/Editor can edit/delete projects */}
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                    <>
                      <button
                        onClick={() => openEditModal(project)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        title="Edit Project"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(project.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Project"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
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

      {/* Project Modal (Create/Edit) */}
      {showModal && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {error && <p className="mb-4 text-red-600">{error}</p>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text" id="title" {...register('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description" {...register('description')} rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="badge" className="block text-sm font-medium text-gray-700">Badge</label>
                  <input
                    type="text" id="badge" {...register('badge')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.badge && <p className="mt-1 text-sm text-red-600">{errors.badge.message}</p>}
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    id="category" {...register('category')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text" id="slug" {...register('slug')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
              </div>
              <div className="flex items-center">
                <input
                  id="isPublished" type="checkbox" {...register('isPublished')}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">Publish Project</label>
              </div>

              {/* Existing Images */}
              {existingImageFields.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Existing Images</label>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImageFields.map((field, imgIndex) => (
                      <div key={field.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                        <Image src={field.url} alt={field.altText || `Image ${imgIndex + 1}`} width={150} height={100} objectFit="cover" className="w-full h-24" />
                        <button
                          type="button"
                          onClick={() => remove(imgIndex)} // This removes from form state, backend will handle deletion via existingImageIds
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove existing image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Upload */}
              <div>
                <label htmlFor="newImages" className="block text-sm font-medium text-gray-700">
                  {editingProject ? 'Add New Images' : 'Upload Images'}
                </label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="newImages"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="newImages"
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          {...register('newImages')}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB (max 10 files)</p>
                  </div>
                </div>
                {errors.newImages && <p className="mt-1 text-sm text-red-600">{String(errors.title?.message)}</p>}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden">
                        <Image src={src} alt={`New image preview ${index + 1}`} width={150} height={100} objectFit="cover" className="w-full h-24" />
                      </div>
                    ))}
                  </div>
                )}
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
                  {isSubmitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProjectId && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
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
                onClick={() => deleteProject(deletingProjectId)}
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