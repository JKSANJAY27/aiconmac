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
