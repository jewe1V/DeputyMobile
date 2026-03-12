import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthTokenManager} from "@/components/LoginScreen/LoginScreen";
import {useRouter, useSegments} from 'expo-router';
import {requestUserPermission, registerDeviceToken, getFCMToken} from "@/api/fcmService"
import { getMessaging, onMessage, onTokenRefresh } from '@react-native-firebase/messaging';
import {Alert} from "react-native";
import {YamapInstance} from "react-native-yamap-plus";

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

const messagingInstance = getMessaging();

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Инициализация Яндекс Карт
        YamapInstance.init("123");
        YamapInstance.setLocale('ru_RU');

        // Проверка авторизации
        const token = AuthTokenManager.getToken();
        setIsAuthenticated(!!token);

        // Слушатель изменений токена авторизации
        return AuthTokenManager.addListener((token) => {
            setIsAuthenticated(!!token);
        });
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        let unsubscribeOnMessage: (() => void) | undefined;
        let unsubscribeOnTokenRefresh: (() => void) | undefined;

        const setupNotifications = async () => {
            const hasPermission = await requestUserPermission();
            if (!hasPermission) return;

            const fcmToken = await getFCMToken();
            const authToken = AuthTokenManager.getToken();

            if (fcmToken && authToken) {
                await registerDeviceToken(authToken, fcmToken);
            }

            unsubscribeOnMessage = onMessage(messagingInstance, async remoteMessage => {
                Alert.alert(
                    remoteMessage.notification?.title || 'Новое уведомление',
                    remoteMessage.notification?.body || 'Сообщение получено'
                );
                console.log('Foreground message:', remoteMessage);
            });

            unsubscribeOnTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
                console.log('FCM Token refreshed:', newToken);
                const authToken = AuthTokenManager.getToken();
                if (authToken) {
                    await registerDeviceToken(authToken, newToken);
                }
            });
        };

        setupNotifications();

        return () => {
            if (unsubscribeOnMessage) unsubscribeOnMessage();
            if (unsubscribeOnTokenRefresh) unsubscribeOnTokenRefresh();
        };
    }, [isAuthenticated]);

    useProtectedRoute(isAuthenticated);

    return (
        <SafeAreaProvider>
        </SafeAreaProvider>
    );
};

export default App;
