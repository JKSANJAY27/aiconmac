"use client";

import React, { useState, useEffect } from 'react';
import { getBrochureRequests, BrochureRequest } from '@/services/brochureService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { Download } from 'lucide-react';

export default function BrochureRequestsPage() {
    const [requests, setRequests] = useState<BrochureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getBrochureRequests();
                setRequests(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch brochure requests');
                setLoading(false);
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const exportToExcel = () => {
        const excelData = requests.map((req) => ({
            'Email Address': req.email,
            'Download Count': req.count,
            'First Requested': format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm:ss'),
            'Last Requested': format(new Date(req.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Brochure Requests');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        saveAs(data, `Brochure_Requests_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="flex h-96 items-center justify-center text-destructive">
                    <p>{error}</p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Brochure Requests</h1>
                    <button
                        onClick={exportToExcel}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel
                    </button>
                </div>

                <div className="rounded-md border border-border bg-card shadow-sm">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email Address</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Downloads</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Last Access</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">First Access</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {requests.map((request) => (
                                    <tr key={request.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{request.email}</td>
                                        <td className="p-4 align-middle">{request.count}</td>
                                        <td className="p-4 align-middle">{format(new Date(request.updatedAt), 'MMM d, yyyy HH:mm')}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{format(new Date(request.createdAt), 'MMM d, yyyy')}</td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td colSpan={4} className="p-8 align-middle text-center text-muted-foreground">
                                            No brochure requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
