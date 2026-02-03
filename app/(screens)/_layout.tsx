import { Tabs } from "expo-router";
import { Calendar, Folder, House, ListTodo } from "lucide-react-native";
import { BlurView } from "expo-blur";
import {StyleSheet, View, Text, Platform} from "react-native";
import {Toast} from "expo-router/build/views/Toast";

export default () => {
    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#11631b",
                    tabBarInactiveTintColor: "#484f56",
                    tabBarShowLabel: false,

                    tabBarStyle: {
                        bottom: Platform.OS === 'ios' ? 25 : 30,
                        left: 15,
                        right: 15,
                        elevation: 0,
                        backgroundColor: Platform.OS === 'ios' ? "transparent" : "rgba(255,255,255,0.8)",
                        borderRadius: 25,
                        borderTopWidth: 0,
                        overflow: 'hidden',
                        height: 60,
                        paddingBottom: 0,
                        marginHorizontal: 15,
                    },

                    // Убираем ограничения контейнера иконки
                    tabBarIconStyle: {
                        width: '100%',
                        height: '100%',
                    },

                    // Центрируем элементы внутри таба
                    tabBarItemStyle: {
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 10,
                    },

                    tabBarBackground: () => (
                        <BlurView
                            intensity={60}
                            tint="light"
                            style={StyleSheet.absoluteFill}
                        />
                    ),
                }}
            >
                <Tabs.Screen
                    name="DashboardScreen"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={[styles.fullTabWrapper, focused && styles.activeWrapper]}>
                                <House size={22} color={color}/>
                                <Text style={[styles.labelStyle, { color }]}>главная</Text>
                            </View>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="EventsScreen"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={[styles.fullTabWrapper, focused && styles.activeWrapper]}>
                                <Calendar size={22} color={color}/>
                                <Text style={[styles.labelStyle, { color }]}>события</Text>
                            </View>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="TaskBoardScreen"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={[styles.fullTabWrapper, focused && styles.activeWrapper]}>
                                <ListTodo size={22} color={color}/>
                                <Text style={[styles.labelStyle, { color }]}>задачи</Text>
                            </View>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="CatalogScreen"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={[styles.fullTabWrapper, focused && styles.activeWrapper]}>
                                <Folder size={22} color={color}/>
                                <Text style={[styles.labelStyle, { color }]}>каталог</Text>
                            </View>
                        ),
                    }}
                />

                <Tabs.Screen name="EventDetailsScreen" options={{ href: null }} />
                <Tabs.Screen name="CreateEventScreen" options={{ href: null }} />
                <Tabs.Screen name="TaskDetailScreen" options={{ href: null }} />
                <Tabs.Screen name="ProfileScreen" options={{ href: null }} />
            </Tabs>
        </>
    );
};

const styles = StyleSheet.create({
    fullTabWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 18,
    },
    activeWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // На тёмном фоне лучше светлая подсветка
    },
    labelStyle: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
});
