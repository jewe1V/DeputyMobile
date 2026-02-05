import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthTokenManager} from "@/components/LoginScreen/LoginScreen";
import {useRouter, useSegments} from 'expo-router';

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

        return AuthTokenManager.addListener((token) => {
            setIsAuthenticated(!!token);
        });
    }, []);

    useProtectedRoute(isAuthenticated);

    return (
        <>
            <SafeAreaProvider>
            </SafeAreaProvider>
        </>
    );
};

export default App;
