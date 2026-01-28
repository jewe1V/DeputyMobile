import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#1e90ff",
                tabBarInactiveTintColor: "gray",
            }}
        >
            <Tabs.Screen
                name="DashboardScreen"
                options={{
                    tabBarLabel: "",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="EventsScreen"
                options={{
                    tabBarLabel: "",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="EventDetailsScreen"
                options={{
                    href : null,
                }}
            />

            <Tabs.Screen
                name="CreateEventScreen"
                options={{
                    href : null,
                }}
            />

            <Tabs.Screen
                name="TaskBoardScreen"
                options={{
                    tabBarLabel: "",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="create-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="TaskDetailScreen"
                options={{
                    tabBarLabel: "",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="file-outline" size={size} color={color} />
                    ),
                    href: null
                }}
            />
            <Tabs.Screen
                name="ProfileScreen"
                options={{
                    tabBarLabel: "",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),

                }}
            />
            <Tabs.Screen
                name="CatalogScreen"
                options={{
                    tabBarLabel: "",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-attach-outline" size={size} color={color} />
                    ),

                }}
            />
        </Tabs>
    );
};
