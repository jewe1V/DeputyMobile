import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthManager } from "@/api/auth";
import { CustomBottomTabBar } from "@/components/ui/Shared/CustomBottomTabBar";

export default function AppLayout() {
    const insets = useSafeAreaInsets();
    const [role, setRole] = useState(AuthManager.getRole());

    useEffect(() => {
        const updateRole = async () => {
            await AuthManager.ensureInitialized();
            setRole(AuthManager.getRole());
        };
        updateRole();

        return AuthManager.addListener(() => {
            setRole(AuthManager.getRole());
        });
    }, []);

    return (
        <Tabs
            tabBar={(props) => (
                <CustomBottomTabBar {...props} insets={insets} role={role} />
            )}
            screenOptions={{
                headerShown: false,
            }}
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