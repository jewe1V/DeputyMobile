import React, {useEffect, useState} from 'react';
import {AuthManager} from "@/api/auth";
import {useRouter, useSegments} from 'expo-router';
import {View} from "react-native";

function useProtectedRoute(isAuthenticated: boolean | null) {
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (isAuthenticated === null) return;
        if (!isAuthenticated) {
            router.replace('/login');
        } else if (isAuthenticated) {
            router.replace('/(screens)/DashboardScreen');
        }
    }, [isAuthenticated, segments]);
}

const AppWeb: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const init = async () => {
            await AuthManager.loadTokensFromStorage();
            setIsAuthenticated(!!AuthManager.getToken());
        };
        init();

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/pwa/service-worker.js')
                    .then((registration) => {
                        console.log('SW зарегистрирован:', registration.scope);
                    })
                    .catch((error) => {
                        console.log('Ошибка SW:', error);
                    });
            });
        }

        return AuthManager.addListener((token) => {
            setIsAuthenticated(!!token);
        });
    }, []);

    useProtectedRoute(isAuthenticated);

    return <View />;
};

export default AppWeb;
