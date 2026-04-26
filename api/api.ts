import axios, { AxiosInstance } from "axios";
import { AuthManager } from "@/components/LoginScreen/LoginScreen"; // Укажите правильный путь
import Toast from "react-native-toast-message";

export const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const apiClient: AxiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
        'X-App-Secret': "AAUMisSb1yxKapDSZbWKvNCUEFQJaM7Zwa4ViPSxMhGsi9bWk7mJBjOlvc9w",
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void, reject: (reason?: any) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.request.use(
    (config) => {
        const token = AuthManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response) {
            const { status } = error.response;
            if (status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise(function (resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return apiClient(originalRequest);
                        })
                        .catch(err => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const newToken = await AuthManager.refreshAuthTokens();

                if (newToken) {
                    processQueue(null, newToken);
                    isRefreshing = false;

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } else {
                    processQueue(new Error('Refresh token expired'));
                    isRefreshing = false;
                    return Promise.reject(error);
                }
            }
        } else if (error.request) {
            Toast.show({ type: 'error', text1: "Ошибка сети" });
        } else {
            Toast.show({ type: 'error', text1: "Ошибка", text2: error.message });
        }

        return Promise.reject(error);
    }
);
