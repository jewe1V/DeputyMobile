import axios, { AxiosInstance } from "axios";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import Toast from "react-native-toast-message";
import { router } from "expo-router";

export const apiUrl = process.env.EXPO_PUBLIC_API_URL;
export const xAppSecret = "AAUMisSb1yxKapDSZbWKvNCUEFQJaM7Zwa4ViPSxMhGsi9bWk7mJBjOlvc9w";

export const apiClient: AxiosInstance = axios.create({
    baseURL: "https://ddc.egd.ru",
    headers: {
        'X-App-Secret': xAppSecret,
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = AuthManager.getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.log(`⚠️ No token for ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await AuthManager.refreshAuthTokens();

                if (newToken) {
                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } else {
                    throw new Error('No new token received');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                await AuthManager.clearAuth();

                Toast.show({
                    type: 'error',
                    text1: 'Сессия истекла',
                    text2: 'Пожалуйста, войдите снова'
                });
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);