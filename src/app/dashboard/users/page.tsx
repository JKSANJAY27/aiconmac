"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, updateUserRole, deleteUser, User } from '@/services/userService';
import { AlertCircle, Trash2, Edit2, Check, X, Shield, Plus, Lock } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Fetch users function
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
            setError('');
        } catch (err: any) {
            // If 403, it means not authorized, but the page guard handles this too.
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && currentUser.role === 'ADMIN') {
            fetchUsers();
        } else {
            setLoading(false); // Stop loading if not admin so we show "Access Denied"
        }
    }, [currentUser]);

    // Handle Role Update
    const handleRoleUpdate = async (userId: string) => {
        if (!selectedRole) return;
        setActionLoading(true);
        try {
            await updateUserRole(userId, selectedRole);
            setEditingUserId(null); // Close edit mode
            fetchUsers(); // Refresh list
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update user role');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle User Delete
    const handleDeleteUser = async (userId: string) => {
        setActionLoading(true);
        try {
            await deleteUser(userId);
            setDeletingUserId(null); // Close modal
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
            setDeletingUserId(null); // Close modal even on error
        } finally {
            setActionLoading(false);
        }
    };

    if (currentUser && currentUser.role !== 'ADMIN') {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground">You do not have permission to view this page.</p>
                </div>
            </AdminLayout>
        );
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
                        <p className="text-muted-foreground">Manage dashboard access and user roles.</p>
                    </div>
                    <Link
                        href="/dashboard/users/create"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus size={18} className="mr-2" /> Add User
                    </Link>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{u.name}</td>
                                        <td className="p-4 align-middle">{u.email}</td>
                                        <td className="p-4 align-middle">
                                            {editingUserId === u.id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={selectedRole}
                                                        onChange={(e) => setSelectedRole(e.target.value)}
                                                        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                        disabled={actionLoading}
                                                    >
                                                        <option value="ADMIN">ADMIN</option>
                                                        <option value="EDITOR">EDITOR</option>
                                                        <option value="VIEWER">VIEWER</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleRoleUpdate(u.id!)}
                                                        disabled={actionLoading}
                                                        className="rounded-full p-1 bg-green-100 text-green-700 hover:bg-green-200"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUserId(null)}
                                                        disabled={actionLoading}
                                                        className="rounded-full p-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        u.role === 'EDITOR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {u.role === 'ADMIN' && <Shield size={10} className="mr-1" />}
                                                    {u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {currentUser?.id !== u.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUserId(u.id!);
                                                            setSelectedRole(u.role);
                                                        }}
                                                        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                                        title="Edit Role"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingUserId(u.id!)}
                                                        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic flex items-center justify-end gap-1">
                                                    <Lock size={12} /> Current User
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deletingUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete User</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete this user? This account will permanently lose access to the dashboard.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingUserId(null)}
                                disabled={actionLoading}
                                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deletingUserId)}
                                disabled={actionLoading}
                                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 transition-colors flex items-center"
                            >
                                {actionLoading ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
