import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import {useRouter, useSegments} from 'expo-router';
import {requestUserPermission, registerDeviceToken, getFCMToken} from "@/api/fcmService"
import { getMessaging, onMessage, onTokenRefresh } from '@react-native-firebase/messaging';
import {Alert} from "react-native";
import {YamapInstance} from "react-native-yamap-plus";
import {toastConfig} from "@/components/Toast/toastConfig";
import Toast from "react-native-toast-message";

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
        YamapInstance.setLocale('ru_RU');
        YamapInstance.init("123");

        // Проверка авторизации
        const token = AuthManager.getToken();
        setIsAuthenticated(!!token);

        // Слушатель изменений токена авторизации
        return AuthManager.addListener((token) => {
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
            const authToken = AuthManager.getToken();

            if (fcmToken && authToken) {
                await registerDeviceToken(authToken, fcmToken);
            }

            unsubscribeOnMessage = onMessage(messagingInstance, async (remoteMessage) => {
                try {
                    console.log('Foreground message received:', remoteMessage);

                    // @ts-ignore
                    const payload = JSON.parse(remoteMessage.data.payload);
                    const eventData = payload.data;

                    const headerTitle = payload.type === 'event'
                        ? 'Напоминание о событии'
                        : 'Напоминание о дедлайне';

                    const tempDate = eventData.StartAt || 'Время не указано';
                    console.log('Toast config:', toastConfig);
                    Toast.show({
                        type: 'customNotification',
                        text1: headerTitle,
                        position: 'top',
                        props: {
                            title: eventData.Title || 'Без названия',
                            time: tempDate
                        },
                    });

                } catch (e) {
                    console.error("Ошибка парсинга или вывода Toast:", e);

                    // Резервный вариант, если всё совсем сломалось
                    Alert.alert('Новое уведомление', 'Не удалось распарсить данные');
                }
            });

            unsubscribeOnTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
                console.log('FCM Token refreshed:', newToken);
                const authToken = AuthManager.getToken();
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
