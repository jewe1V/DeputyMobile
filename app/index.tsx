import React, { useEffect, useState } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen";
import { useRouter } from 'expo-router';
import { YamapInstance } from 'react-native-yamap-plus';
import { apiUrl } from "@/api/api";
import {
    getMessaging,
    setBackgroundMessageHandler,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    requestPermission,
    getToken,
    AuthorizationStatus
} from '@react-native-firebase/messaging';

// 1. Инициализация фонового обработчика
// В v22+ первым аргументом ВСЕГДА идет экземпляр messaging
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log('Message handled in the background!', remoteMessage);
});

function useProtectedRoute(isAuthenticated: boolean | null) {
    const router = useRouter();
    useEffect(() => {
        if (isAuthenticated === null) return;
        if (!isAuthenticated) {
            router.replace('/login');
        } else {
            router.replace('/(screens)/DashboardScreen');
        }
    }, [isAuthenticated]);
}

// --- API методы ---

const fetchYAMapToken = async (token: string) => {
    try {
        const response = await fetch(`${apiUrl}/api/Auth/maps-token`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (e) {
        console.error("Fetch Yandex Token error:", e);
        return null;
    }
}

const registerDeviceToken = async (authToken: string, fcmToken: string) => {
    try {
        return await fetch(`${apiUrl}/api/device/register`, {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: fcmToken,
                platform: Platform.OS
            })
        });
    } catch (e) {
        console.error("Device register error:", e);
        return null;
    }
}

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [deviceSynced, setDeviceSynced] = useState(false);

    const token = AuthTokenManager.getToken();
    const messagingInstance = getMessaging(); // Создаем экземпляр для переиспользования

    // 2. Функция запроса разрешений (Модульный стиль)
    const requestUserPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }

        const authStatus = await requestPermission(messagingInstance);
        return (
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL
        );
    };

    useEffect(() => {
        YamapInstance.setLocale('ru_RU');
        setIsAuthenticated(!!token);

        const unsubscribeAuth = AuthTokenManager.addListener((newToken) => {
            setIsAuthenticated(!!newToken);
            if (!newToken) {
                setMapInitialized(false);
                setDeviceSynced(false);
            }
        });

        // 3. Слушатель уведомлений на переднем плане (Foreground)
        const unsubscribeMessaging = onMessage(messagingInstance, async (remoteMessage) => {
            Alert.alert(
                remoteMessage.notification?.title || 'Уведомление',
                remoteMessage.notification?.body || ''
            );
        });

        // 4. Обработка клика (Background state)
        const unsubscribeOpenedApp = onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
            console.log('Notification caused app to open from background:', remoteMessage.data);
        });

        // 5. Обработка клика (Quit state)
        getInitialNotification(messagingInstance).then((remoteMessage) => {
            if (remoteMessage) {
                console.log('Notification caused app to open from quit state:', remoteMessage.data);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeMessaging();
            unsubscribeOpenedApp();
        };
    }, []);

    useEffect(() => {
        const initializeAppServices = async () => {
            if (isAuthenticated && token) {
                // Инициализация Яндекс Карт
                if (!mapInitialized) {
                    try {
                        const response = await fetchYAMapToken(token);
                        if (response?.ok) {
                            const data = await response.json();
                            await YamapInstance.init(data.token);
                            setMapInitialized(true);
                            console.log("✅ Yandex Maps initialized");
                        }
                    } catch (e) {
                        console.warn("Ошибка карт:", e);
                    }
                }

                // Синхронизация FCM токена
                if (!deviceSynced) {
                    try {
                        const hasPermission = await requestUserPermission();
                        if (hasPermission) {
                            const fcmToken = await getToken(messagingInstance);
                            if (fcmToken) {
                                const response = await registerDeviceToken(token, fcmToken);
                                if (response?.ok) {
                                    setDeviceSynced(true);
                                    console.log("✅ FCM Token synced:", fcmToken);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("Ошибка регистрации устройства:", e);
                    }
                }
            }
        };

        initializeAppServices();
    }, [isAuthenticated, token, mapInitialized, deviceSynced]);

    useProtectedRoute(isAuthenticated);

    return <SafeAreaProvider />;
};

export default App;
