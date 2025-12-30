"use client";

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod schema for client validation
const clientSchema = z.object({
    name: z.string().min(2, "Company Name is required"),
    name_ar: z.string().optional(),
    name_ru: z.string().optional(),
    logo: z.any()
        .refine((files) => files && files.length > 0, "Logo is required")
        .refine((files) => {
            // If it's a file list (new upload)
            if (files instanceof FileList) {
                return files.length > 0;
            }
            return true; // If it's not a file list, we assume it's valid (though for create it's required)
        }, "Logo is required"),
});

type ClientFormInputs = z.infer<typeof clientSchema>;

interface Client {
    id: string;
    name: string;
    name_ar?: string;
    name_ru?: string;
    logo: string;
    createdAt: string;
}

export default function ClientsPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<ClientFormInputs>({
        resolver: zodResolver(clientSchema),
    });

    const watchLogo = watch("logo");

    useEffect(() => {
        if (watchLogo instanceof FileList && watchLogo.length > 0) {
            const file = watchLogo[0];
            const url = URL.createObjectURL(file);
            setLogoPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setLogoPreview(null);
        }
    }, [watchLogo]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && (user.role === 'ADMIN' || user.role === 'EDITOR')) {
            fetchClients();
        } else if (!user) {
            // Loading handled by AuthContext
        } else {
            setError('You are not authorized to view this page.');
            setLoading(false);
        }
    }, [user]);

    const openCreateModal = () => {
        reset({ name: '', name_ar: '', name_ru: '', logo: undefined });
        setLogoPreview(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setDeletingClientId(null);
        reset();
        setLogoPreview(null);
        setError(null);
    };

    const onSubmit = async (data: ClientFormInputs) => {
        setError(null);
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.name_ar) formData.append('name_ar', data.name_ar);
            if (data.name_ru) formData.append('name_ru', data.name_ru);

            if (data.logo && data.logo instanceof FileList && data.logo.length > 0) {
                formData.append('logo', data.logo[0]);
            } else {
                throw new Error('Logo is required.');
            }

            await api.post('/clients', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            fetchClients();
            closeModal();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred during submission.');
        }
    };

    const confirmDelete = (id: string) => {
        setDeletingClientId(id);
    };

    const deleteClient = async (id: string) => {
        setError(null);
        try {
            await api.delete(`/clients/${id}`);
            fetchClients();
            closeModal();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete client.');
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
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Clients</h2>
                        <p className="text-muted-foreground">Manage your company partners and clients.</p>
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <Plus size={18} className="mr-2" /> Add Client
                        </button>
                    )}
                </div>

                {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {clients.map((client) => (
                        <div key={client.id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md flex flex-col items-center p-6 text-center">
                            <div className="relative mb-4 h-32 w-full flex items-center justify-center overflow-hidden bg-muted/50 rounded-lg p-4">
                                {client.logo ? (
                                    <div className="relative h-24 w-full">
                                        <Image
                                            src={client.logo}
                                            alt={client.name}
                                            fill
                                            className="object-contain transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>

                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                            </div>

                            <h3 className="line-clamp-1 text-lg font-semibold text-foreground" title={client.name}>{client.name}</h3>

                            <div className="mt-4 flex items-center justify-end gap-2 w-full border-t border-border pt-4">
                                {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                                    <button
                                        onClick={() => confirmDelete(client.id)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-auto"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {clients.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">No clients found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Add your first partner company.</p>
                        {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                            <button
                                onClick={openCreateModal}
                                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                            >
                                <Plus size={16} className="mr-2" /> Add Client
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md flex flex-col rounded-xl bg-background shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
                            <h3 className="text-xl font-semibold text-foreground">Add New Client</h3>
                            <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Company Name</label>
                                    <input
                                        {...register('name')}
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Company Name"
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message as string}</p>}
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-foreground">Company Name (Arabic)</label>
                                        <input
                                            {...register('name_ar')}
                                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-right"
                                            placeholder="Company Name (AR)"
                                            dir="rtl"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-foreground">Company Name (Russian)</label>
                                        <input
                                            {...register('name_ru')}
                                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="Company Name (RU)"
                                        />
                                    </div>
                                </div>

                                {/* Image Upload Section */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-foreground">Logo</label>
                                    <div className="flex justify-center rounded-lg border border-dashed border-input px-6 py-8 hover:bg-accent/50 transition-colors">
                                        <div className="text-center">
                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <div className="mt-2 flex text-sm leading-6 text-muted-foreground">
                                                <label
                                                    htmlFor="logo"
                                                    className="relative cursor-pointer rounded-md font-semibold text-primary hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                                                >
                                                    <span>Upload file</span>
                                                    <input
                                                        id="logo"
                                                        type="file"
                                                        accept="image/*"
                                                        {...register('logo')}
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                                        </div>
                                    </div>
                                    {errors.logo && <p className="mt-1 text-xs text-destructive">{errors.logo.message as string}</p>}

                                    {logoPreview && (
                                        <div className="flex justify-center mt-4">
                                            <div className="relative h-32 w-32 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center">
                                                <Image src={logoPreview} alt="Preview" fill className="object-contain p-2" />
                                            </div>
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
                                    {isSubmitting ? 'Saving...' : 'Save Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingClientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Client</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete this client? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteClient(deletingClientId)}
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
