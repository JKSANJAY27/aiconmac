import api from '@/lib/api';

export interface BrochureRequest {
    id: string; // Assuming ID is string based on typical DB, user snippet used request.id
    email: string;
    count: number;
    createdAt: string;
    updatedAt: string;
}

export const getBrochureRequests = async (): Promise<BrochureRequest[]> => {
    const response = await api.get('/brochure-request');
    // Axios response data is usually the payload directly if strictly typed, but let's assume standard response
    return response.data;
};
