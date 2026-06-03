import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Настройка NetInfo для Web, чтобы избежать HEAD-запросов к корню домена
if (Platform.OS === 'web') {
  NetInfo.configure({
    reachabilityUrl: 'https://clients3.google.com/generate_204', // Используем стандартный URL, возвращающий 204
    reachabilityTest: async (response) => response.status === 204,
    reachabilityLongTimeout: 60 * 1000, // 60 секунд
    reachabilityShortTimeout: 5 * 1000, // 5 секунд
    reachabilityRequestTimeout: 15 * 1000, // 15 секунд
  });
}
