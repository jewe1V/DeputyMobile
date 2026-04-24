import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import {useRouter, useSegments} from 'expo-router';
// ВАЖНО: fcmService тоже может упасть, если внутри него есть нативные импорты.
// Если падает — создайте fcmService.web.ts с пустыми функциями.

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
        // Карты на вебе не инициализируем
        const token = AuthManager.getToken();
        setIsAuthenticated(!!token);

        return AuthManager.addListener((token) => {
            setIsAuthenticated(!!token);
        });
    }, []);

    useEffect(() => {
        // Уведомления через нативный Firebase на вебе не работают
        // Здесь можно добавить логику для Firebase Web SDK, если нужно
        if (!isAuthenticated) return;
        console.log("Web mode: Push notifications disabled or use Web SDK");
    }, [isAuthenticated]);

    useProtectedRoute(isAuthenticated);

    return (
        <SafeAreaProvider>
            {/* Контент */}
        </SafeAreaProvider>
    );
};

export default AppWeb;
