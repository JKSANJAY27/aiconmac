import api from '@/lib/api';

export interface User {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export const createUser = async (userData: User) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
};

export const updateUserRole = async (userId: string, role: string) => {
    const response = await api.put(`/auth/users/${userId}/role`, { role });
    return response.data;
};

export const deleteUser = async (userId: string) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
};
