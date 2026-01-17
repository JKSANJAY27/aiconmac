// company-website/src/app/dashboard/projects/page.tsx
"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, X, Upload, Eye, Image as ImageIcon, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { useForm, useFieldArray, SubmitHandler, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod schema for project validation
const projectSchema = z.object({
  title: z.string().min(3, "Title is required"),
  title_ar: z.string().optional(),
  title_ru: z.string().optional(),
  description: z.string().min(10, "Description is required"),
  description_ar: z.string().optional(),
  description_ru: z.string().optional(),
  badge: z.string().min(1, "Badge is required"),
  badge_ar: z.string().optional(),
  badge_ru: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  category_ar: z.string().optional(),
  category_ru: z.string().optional(),
  slug: z.string()
    .min(3, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  isPublished: z.boolean().default(false).optional(),
  isPinned: z.boolean().default(false).optional(),
  pinOrder: z.coerce.number().default(0).optional(),
  existingImages: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    altText: z.string().optional(),
    order: z.number().optional(),
  })).optional(),
  newImages: z.any().optional(),
});

type ProjectFormInputs = z.infer<typeof projectSchema>;

interface ProjectImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

interface Project {
  id: string;
  title: string;
  title_ar?: string;
  title_ru?: string;
  description: string;
  description_ar?: string;
  description_ru?: string;
  badge: string;
  badge_ar?: string;
  badge_ru?: string;
  category: string;
  category_ar?: string;
  category_ru?: string;
  slug: string;
  isPublished: boolean;
  isPinned: boolean;
  pinOrder: number;
  images: ProjectImage[];
  createdAt: string;
}

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
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormInputs>({
    resolver: zodResolver(projectSchema) as Resolver<ProjectFormInputs>,
    defaultValues: {
      isPublished: false,
      isPinned: false,
      pinOrder: 0,
      existingImages: [],
    },
  });

  const { fields: existingImageFields, append, remove } = useFieldArray({
    control,
    name: "existingImages",
  });

  const watchTitle = watch("title");

  useEffect(() => {
    if (watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [watchTitle, setValue]);

  const watchNewImages = watch("newImages");

  useEffect(() => {
    if (watchNewImages instanceof FileList && watchNewImages.length > 0) {
      const urls = Array.from(watchNewImages).map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else {
      setImagePreviews([]);
    }
  }, [watchNewImages]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'EDITOR')) {
      fetchProjects();
    } else if (!user) {
      // Loading handled by AuthContext
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user]);

  const openCreateModal = () => {
    setEditingProject(null);
    reset({
      title: '', title_ar: '', title_ru: '',
      description: '', description_ar: '', description_ru: '',
      badge: '', badge_ar: '', badge_ru: '',
      category: '', category_ar: '', category_ru: '',
      slug: '', isPublished: false,
      isPinned: false, pinOrder: 0,
      existingImages: [],
      newImages: undefined,
    });
    setImagePreviews([]);
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    reset({
      title: project.title,
      title_ar: project.title_ar,
      title_ru: project.title_ru,
      description: project.description,
      description_ar: project.description_ar,
      description_ru: project.description_ru,
      badge: project.badge,
      badge_ar: project.badge_ar,
      badge_ru: project.badge_ru,
      category: project.category,
      category_ar: project.category_ar,
      category_ru: project.category_ru,
      slug: project.slug,
      isPublished: project.isPublished,
      isPinned: project.isPinned || false,
      pinOrder: project.pinOrder || 0,
      existingImages: project.images.map(img => ({ id: img.id, url: img.url, altText: img.altText, order: img.order })),
      newImages: undefined,
    });
    setImagePreviews([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setDeletingProjectId(null);
    reset();
    setImagePreviews([]);
    setError(null);
  };

  const onSubmit = async (data: ProjectFormInputs) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.title_ar) formData.append('title_ar', data.title_ar);
      if (data.title_ru) formData.append('title_ru', data.title_ru);

      formData.append('description', data.description);
      if (data.description_ar) formData.append('description_ar', data.description_ar);
      if (data.description_ru) formData.append('description_ru', data.description_ru);

      formData.append('badge', data.badge);
      if (data.badge_ar) formData.append('badge_ar', data.badge_ar);
      if (data.badge_ru) formData.append('badge_ru', data.badge_ru);

      formData.append('category', data.category);
      if (data.category_ar) formData.append('category_ar', data.category_ar);
      if (data.category_ru) formData.append('category_ru', data.category_ru);

      formData.append('slug', data.slug);
      formData.append('isPublished', String(data.isPublished));
      formData.append('isPinned', String(data.isPinned));
      formData.append('pinOrder', String(data.pinOrder || 0));

      data.existingImages?.forEach(img => formData.append('existingImageIds[]', img.id));

      if (data.newImages && data.newImages instanceof FileList && data.newImages.length > 0) {
        Array.from(data.newImages).forEach(file => formData.append('images', file));
      } else if (!editingProject && (!data.newImages || data.newImages.length === 0)) {
        throw new Error('At least one image is required for a new project.');
      }

      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchProjects();
      closeModal();
    } catch (err: any) {
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
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR'))) {
    return <AdminLayout><p className="text-destructive">{error}</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Projects</h2>
            <p className="text-muted-foreground">Manage your architectural and industrial models.</p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus size={18} className="mr-2" /> Add Project
            </button>
          )}
        </div>

        {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <div key={project.id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {project.images && project.images.length > 0 ? (
                  <Image
                    src={project.images[0].url}
                    alt={project.title}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {project.isPinned && (
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 shadow-sm">
                      Pinned {project.pinOrder > 0 && <span>#{project.pinOrder}</span>}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset shadow-sm ${project.isPublished
                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                    : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                    }`}>
                    {project.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground capitalize">
                    {project.category}
                  </span>
                </div>
                <h3 className="line-clamp-1 text-lg font-semibold text-foreground" title={project.title}>{project.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                  {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                    <>
                      <button
                        onClick={() => openEditModal(project)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(project.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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

        {projects.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating a new project.</p>
            {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                <Plus size={16} className="mr-2" /> Create Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-background shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
              <h3 className="text-xl font-semibold text-foreground">{editingProject ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <input
                    {...register('title')}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Project Title"
                  />
                  {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Project Description"
                  />
                  {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Badge</label>
                    <input
                      {...register('badge')}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="e.g. New, Featured"
                    />
                    {errors.badge && <p className="mt-1 text-xs text-destructive">{errors.badge.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <select
                      {...register('category')}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}

                  </div>
                </div>

                {/* Multilingual Support Section */}
                <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-4">
                  <h4 className="font-semibold text-sm">Translations (Optional)</h4>

                  {/* Arabic Fields */}
                  <div className="space-y-4 border-l-2 border-orange-200 pl-4">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase">Arabic</h5>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-foreground">Title (Arabic)</label>
                        <input
                          {...register('title_ar')}
                          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right"
                          placeholder="Project Title (AR)"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Badge (Arabic)</label>
                        <input
                          {...register('badge_ar')}
                          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right"
                          placeholder="Badge (AR)"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Description (Arabic)</label>
                      <textarea
                        {...register('description_ar')}
                        rows={2}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right"
                        placeholder="Description (AR)"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Category (Arabic)</label>
                      <input
                        {...register('category_ar')}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right"
                        placeholder="Category (AR)"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Russian Fields */}
                  <div className="space-y-4 border-l-2 border-blue-200 pl-4">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase">Russian</h5>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-foreground">Title (Russian)</label>
                        <input
                          {...register('title_ru')}
                          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Project Title (RU)"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Badge (Russian)</label>
                        <input
                          {...register('badge_ru')}
                          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Badge (RU)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Description (Russian)</label>
                      <textarea
                        {...register('description_ru')}
                        rows={2}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Description (RU)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Category (Russian)</label>
                      <input
                        {...register('category_ru')}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Category (RU)"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      {...register('isPublished')}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium text-foreground cursor-pointer">Publish Project</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPinned"
                      {...register('isPinned')}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                    />
                    <label htmlFor="isPinned" className="text-sm font-medium text-foreground cursor-pointer">Pin Project (Featured)</label>
                  </div>
                </div>

                {watch("isPinned") && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-medium text-foreground">Display Order</label>
                    <input
                      type="number"
                      {...register('pinOrder', { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="e.g. 1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first among pinned projects.</p>
                    {errors.pinOrder && <p className="mt-1 text-xs text-destructive">{errors.pinOrder.message}</p>}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground">Slug</label>
                  <input
                    {...register('slug')}
                    readOnly
                    className="mt-1 block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-not-allowed"
                    placeholder="Auto-generated from title"
                  />
                  {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
                </div>

                {/* Image Upload Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Images</label>

                  {existingImageFields.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {existingImageFields.map((field, index) => (
                        <div key={field.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                          <Image src={field.url} alt="Existing" fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-center rounded-lg border border-dashed border-input px-6 py-8 hover:bg-accent/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <div className="mt-2 flex text-sm leading-6 text-muted-foreground">
                        <label
                          htmlFor="newImages"
                          className="relative cursor-pointer rounded-md font-semibold text-primary hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                        >
                          <span>Upload files</span>
                          <input
                            id="newImages"
                            type="file"
                            multiple
                            accept="image/*"
                            {...register('newImages')}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <Image src={src} alt="Preview" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Project</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProject(deletingProjectId)}
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