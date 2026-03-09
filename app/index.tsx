import React, { useEffect, useState } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen";
import { useRouter } from 'expo-router';
import { YamapInstance } from 'react-native-yamap-plus';
import { apiUrl } from "@/api/api";
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
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
        return await fetch(`${apiUrl}/api/Auth/maps-token`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (e) {
        console.error("Fetch Yandex Token error:", e);
        return null;
    }
}

const registerDeviceToken = async (authToken: string, fcmToken: string) => {
    try {
        const response = await fetch(`${apiUrl}/api/device/register`, {
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
        return response;
    } catch (e) {
        console.error("Device register error:", e);
        return null;
    }
}

const App: React.FC = () => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [deviceSynced, setDeviceSynced] = useState(false);

    const token = AuthTokenManager.getToken();

    // 3. Функция запроса разрешений
    const requestUserPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled;
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

        // 4. Слушатель уведомлений на переднем плане (Foreground)
        const unsubscribeMessaging = messaging().onMessage(async remoteMessage => {
            Alert.alert(
                remoteMessage.notification?.title || 'Уведомление',
                remoteMessage.notification?.body || ''
            );
        });

        // 5. Обработка клика по уведомлению (когда приложение было в фоне)
        const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification caused app to open from background state:', remoteMessage.data);
            // Тут можно сделать router.push("/какой-то-экран")
        });

        // Проверка, было ли приложение открыто через клик по пушу из "убитого" состояния
        messaging().getInitialNotification().then(remoteMessage => {
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
                        }
                    } catch (e) {
                        console.warn("Ошибка карт:", e);
                    }
                }

                // Реальная синхронизация FCM токена
                if (!deviceSynced) {
                    try {
                        const hasPermission = await requestUserPermission();
                        if (hasPermission) {
                            const fcmToken = await messaging().getToken();
                            if (fcmToken) {
                                const response = await registerDeviceToken(token, fcmToken);
                                if (response?.ok) {
                                    setDeviceSynced(true);
                                    console.log("✅ FCM Token synced");
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
