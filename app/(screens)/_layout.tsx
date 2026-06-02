import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import { CustomBottomTabBar } from "@/components/ui/Shared/CustomBottomTabBar";

export default function AppLayout() {
    const insets = useSafeAreaInsets();
    const role = AuthManager.getRole();

    return (
        <Tabs
            tabBar={(props) => (
                <CustomBottomTabBar {...props} insets={insets} role={role} />
            )}
            screenOptions={{
                headerShown: false,
                // Критично: отключаем автоматический учёт safe area
                // react-navigation больше НЕ резервирует место под таббар
            }}
            // Говорим react-navigation: "мы сами управляем отступами"
            safeAreaInsets={{ bottom: 0, top: 0 }}
        >
            <Tabs.Screen name="DashboardScreen" />
            <Tabs.Screen name="EventsScreen" />
            <Tabs.Screen name="TaskBoardScreen" />
            <Tabs.Screen name="CatalogScreen" />
            <Tabs.Screen name="UsersScreen" />
            <Tabs.Screen name="DepartmentsScreen" />
        </Tabs>
    );
}