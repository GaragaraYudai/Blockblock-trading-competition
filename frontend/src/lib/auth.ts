// Authentication utility functions for frontend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://blockblock-trading-competition-production-f6b5.up.railway.app";

export interface User {
    id: number;
    username: string;
    wallet_address: string;
    profile_image_url?: string;
    role: 'user' | 'admin';
    is_approved: boolean;
    is_active: boolean;
    initial_balance?: number;
    current_balance?: number;
    profit_rate?: number;
    rank?: number;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const data: AuthResponse = await response.json();

    // Store token in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
}

/**
 * Register new user
 */
export async function register(formData: FormData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
}

/**
 * Logout
 */
export function logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.role === 'admin';
}

/**
 * Fetch with authentication
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAccessToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // If unauthorized, logout and redirect
    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }

    return response;
}
