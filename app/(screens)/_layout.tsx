import { Tabs } from "expo-router";
import {Calendar,Folder, House, ListTodo} from "lucide-react-native";


export default () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#11631b",
                tabBarInactiveTintColor: "gray",
                tabBarIconStyle: {
                    width: 24,
                    height: 24,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                },
            }}
        >
            <Tabs.Screen
                name="DashboardScreen"
                options={{
                    tabBarLabel: "главная",
                    tabBarIcon: ({ color, size }) => (
                        <House size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="EventsScreen"
                options={{
                    tabBarLabel: "мероприятия",
                    tabBarIcon: ({ color, size }) => (
                        <Calendar size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="TaskBoardScreen"
                options={{
                    tabBarLabel: "задачи",
                    tabBarIcon: ({ color, size }) => (
                        <ListTodo size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="CatalogScreen"
                options={{
                    tabBarLabel: "каталог",
                    tabBarIcon: ({ color, size }) => (
                        <Folder size={size} color={color}/>
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
                name="TaskDetailScreen"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                name="ProfileScreen"
                options={{
                    href: null
                }}
            />
        </Tabs>
    );
};
