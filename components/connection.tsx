import { AuthTokenManager } from "@/components/LoginScreen";
import * as SignalR from "@microsoft/signalr";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

async function registerForPushNotificationsAsync() {
  console.log("📝 Запрашиваем разрешение на уведомления");
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log("📝 Существующий статус разрешений:", existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("📝 Новый статус разрешений:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.warn("⚠️ Разрешение на уведомления не предоставлено!");
      return false;
    }
  }
  return true;
}

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const hubUrl = "https://irit-rtf-ep.ru/hubs/notifications";

    const connect = async () => {
      console.log("🔌 Инициализация подключения к SignalR...");
      const token = AuthTokenManager.getToken();
      console.log("📝 Токен для подключения:", token);

      const permissionsGranted = await registerForPushNotificationsAsync();
      if (!permissionsGranted) {
        console.warn("⚠️ Уведомления отключены — не подключаем SignalR");
        return;
      }

      const newConnection = new SignalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token || "",
        })
        .withAutomaticReconnect()
        .configureLogging(SignalR.LogLevel.Information)
        .build();

      console.log("🔌 SignalR HubConnection создан, добавляем обработчик событий");

      newConnection.on("ReceiveNotification", async (message) => {
        console.log("📩 Notification received:", message);

        const notification = {
          id: Date.now().toString(),
          message,
          receivedAt: new Date(),
        };

        setNotifications((prev) => [notification, ...prev]);
        console.log("📝 Добавили уведомление в state:", notification);

        // 🔔 показать системное уведомление
        try {
          console.log("🔔 Отправляем системное уведомление...");
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Новое уведомление",
              body: message,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // сразу
          });
          console.log("✅ Системное уведомление отправлено");
        } catch (err) {
          console.error("❌ Ошибка при отправке системного уведомления:", err);
        }
      });

      try {
        console.log("🔌 Подключаемся к SignalR Hub...");
        await newConnection.start();
        console.log("✅ Connected to SignalR hub");
        setConnection(newConnection);
      } catch (err) {
        console.error("❌ Connection error:", err);
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      console.log("🛑 Отключаем SignalR и очищаем обработчики");
      if (connection) {
        connection.off("ReceiveNotification");
        connection.stop();
      }
    };
  }, []);

  const clearNotifications = () => {
    console.log("🗑 Очищаем уведомления");
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
