'use client';

import { useEffect, useState } from 'react';

export type AuthUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
    createdAt?: string;
};

type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    mfaRequired?: boolean;
    mfaToken?: string;
};

type ErrorResponse = {
    message?: string;
};

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/v1/auth/me', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (response.ok) {
                    const userData = (await response.json()) as AuthUser;
                    setUser(userData);
                } else if (response.status === 401) {
                    setUser(null);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch user');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (email: string, password: string, totpToken?: string): Promise<LoginResponse> => {
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, totpToken }),
            });

            if (response.ok) {
                const data = (await response.json()) as LoginResponse;
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                setUser(data.user);
                return data;
            } else {
                const error = (await response.json()) as ErrorResponse;
                throw new Error(error.message || 'Login failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            throw err;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const register = async (data: unknown) => {
        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                return await response.json();
            } else {
                const error = (await response.json()) as ErrorResponse;
                throw new Error(error.message || 'Registration failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
            throw err;
        }
    };

    return {
        user,
        loading,
        isLoading: loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        register,
    };
}
