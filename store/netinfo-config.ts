import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Настройка NetInfo для Web
// Мы убрали внешние reachabilityUrl (google), так как они вызывали CORS ошибки.
// По умолчанию NetInfo на Web использует navigator.onLine и HEAD-запрос к корню домена.
if (Platform.OS === 'web') {
  NetInfo.configure({
    // Оставляем дефолтные настройки или можно явно указать пустые,
    // чтобы библиотека использовала стандартные механизмы браузера.
  });
}
