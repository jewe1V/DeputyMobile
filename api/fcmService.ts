import {Platform} from 'react-native';
import {apiUrl} from "@/api/api";
import { getMessaging, getToken, requestPermission,setBackgroundMessageHandler,AuthorizationStatus } from '@react-native-firebase/messaging';

const messagingInstance = getMessaging();

export const registerDeviceToken = async (authToken: string, fcmToken: string) => {
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

export async function requestUserPermission() {
    const authStatus = await requestPermission(messagingInstance);
    const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
    return enabled;
}

export async function getFCMToken() {
    try {
        const fcmToken = await getToken(messagingInstance);
        if (fcmToken) {
            console.log('FCM Token:', fcmToken);
            return fcmToken;
        } else {
            console.log('Failed', 'No token received');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
    // Здесь можно выполнить логику, например, обновить бейдж или сохранить в сторадж
});
