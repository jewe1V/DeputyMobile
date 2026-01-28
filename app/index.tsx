import React, {useEffect, useState} from 'react';
import {NotificationProvider} from "../components/connection";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthTokenManager} from "@/components/LoginScreen/LoginScreen";
import { useRouter, useSegments } from 'expo-router';

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

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const token = AuthTokenManager.getToken();
        setIsAuthenticated(!!token);

        const unsubscribe = AuthTokenManager.addListener((token) => {
            setIsAuthenticated(!!token);
        });

        return unsubscribe;
    }, []);

    useProtectedRoute(isAuthenticated);

    return (
        <NotificationProvider>
            <SafeAreaProvider>
            </SafeAreaProvider>
        </NotificationProvider>
    );
};

export default App;
