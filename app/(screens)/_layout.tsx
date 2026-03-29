import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import {Calendar, Folder, House, ListTodo, User} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import {CustomBottomTabBar} from "@/components/ui/CustomBottomTabBar";

// 2. Основной компонент роутинга
export default function AppLayout() {
    const insets = useSafeAreaInsets();
    const role = AuthManager.getRole();

    return (
        <Tabs
            tabBar={(props) => <CustomBottomTabBar {...props} insets={insets} role={role} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="DashboardScreen" />
            <Tabs.Screen name="EventsScreen" />
            <Tabs.Screen name="TaskBoardScreen" />
            <Tabs.Screen name="CatalogScreen" />
            <Tabs.Screen name="UserListScreen" />

            {/* Скрытые экраны */}
            <Tabs.Screen name="EventDetailsScreen" options={{ href: null }} />
            <Tabs.Screen name="ProfileScreen" options={{ href: null }} />
        </Tabs>
    );
}
