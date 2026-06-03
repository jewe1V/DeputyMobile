import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const xAppSecret = "AAUMisSb1yxKapDSZbWKvNCUEFQJaM7Zwa4ViPSxMhGsi9bWk7mJBjOlvc9w";
const apiUrl = process.env.EXPO_PUBLIC_API_URL || "https://ddc.egd.ru";

class StorageAdapter {
    private static isWeb = Platform.OS === 'web';

    static async getItem(key: string): Promise<string | null> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem(key);
        }
        return await AsyncStorage.getItem(key);
    }

    static async setItem(key: string, value: string): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, value);
            return;
        }
        await AsyncStorage.setItem(key, value);
    }

    static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            keyValuePairs.forEach(([key, value]) => localStorage.setItem(key, value));
            return;
        }
        await AsyncStorage.multiSet(keyValuePairs);
    }

    static async multiRemove(keys: string[]): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            keys.forEach(key => localStorage.removeItem(key));
            return;
        }
        await AsyncStorage.multiRemove(keys);
    }
}

export class AuthManager {
    private static token: string | null = null;
    private static refreshToken: string | null = null;
    private static role: string | null = null;
    private static userId: string | null = null;
    private static listeners: ((token: string | null) => void)[] = [];
    private static initPromise: Promise<void> | null = null;

    static async loadTokensFromStorage() {
        try {
            const [token, rToken, role, userId] = await Promise.all([
                StorageAdapter.getItem('authToken'),
                StorageAdapter.getItem('refreshToken'),
                StorageAdapter.getItem('userRole'),
                StorageAdapter.getItem('userId')
            ]);
            this.token = token;
            this.refreshToken = rToken;
            this.role = role;
            this.userId = userId;
        } catch (e) {
            console.error('Auth initialization error:', e);
        }
    }

    static getToken() { return this.token; }
    static getRefreshToken() { return this.refreshToken; }
    static getRole() { return this.role; }
    static getUserId() { return this.userId; }

    static isInitialized() {
        return this.initPromise !== null;
    }

    static async initialize() {
        return this.loadTokensFromStorage();
    }

    static addListener(listener: (token: string | null) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    static async setAuth(token: string, refreshToken: string, userId: string, roles: any[]) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.role = roles.length > 0 ? roles[0].role.name : null;

        await StorageAdapter.multiSet([
            ['authToken', token],
            ['refreshToken', refreshToken],
            ['userId', userId],
            ['userRole', this.role || '']
        ]);

        this.notifyListeners();
    }

    static async clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.role = null;
        this.userId = null;
        await StorageAdapter.multiRemove(['authToken', 'refreshToken', 'userRole', 'userData', 'userId']);
        this.notifyListeners();
    }

    static async refreshAuthTokens(): Promise<string | null> {
        if (!this.token || !this.refreshToken) return null;

        try {
            const response = await fetch(`${apiUrl}/api/Auth/refresh`, {
                method: 'POST',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json-patch+json',
                    'X-App-Secret': xAppSecret
                },
                body: JSON.stringify({
                    access_token: this.token,
                    refresh_token: this.refreshToken
                })
            });

            if (!response.ok) throw new Error('Refresh failed');

            const data = await response.json();
            await this.setAuth(data.token, data.refresh_token, data.user.id, data.user.user_roles || []);
            return data.token;
        } catch (error) {
            console.error('Token refresh network error:', error);
            return null;
        }
    }

    private static notifyListeners() {
        this.listeners.forEach(l => l(this.token));
    }
}
