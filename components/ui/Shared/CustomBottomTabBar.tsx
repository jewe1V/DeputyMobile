import React from "react";
import { Platform, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import {Building2, Calendar, Folder, House, ListTodo, User} from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";

const SPRING_CONFIG = {
    damping: 15, // Затухание
    stiffness: 150, // Жесткость
    mass: 0.5, // Масса
};

function TabButton({ route, isFocused, descriptors, navigation, color, Icon, label }) {
    const scaleValue = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scaleValue.value }],
        };
    });

    const onPress = () => {
        const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
        }
    };

    const handlePressIn = () => {
        scaleValue.value = withSpring(0.8, SPRING_CONFIG); // Уменьшаем до 0.9
    };

    const handlePressOut = () => {
        scaleValue.value = withSpring(1, SPRING_CONFIG);
    };

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.tabItem}
            activeOpacity={1}
        >
            <Animated.View style={[styles.tabContentWrapper, animatedStyle]}>
                <View pointerEvents="none">
                    <Icon size={22} color={color} />
                </View>
                <Text style={[styles.labelStyle, { color }]} numberOfLines={1}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

export function CustomBottomTabBar({ state, descriptors, navigation, insets, role }) {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
            <BlurView
                intensity={isDark ? 50 : 30}
                tint={isDark ? "dark" : "light"}
                style={[
                    styles.blurView,
                    {
                        backgroundColor: Platform.OS === "android"
                            ? (isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255,255,255,0.85)")
                            : (isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(255,255,255,0.4)"),
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    }
                ]}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    // Фильтрация
                    if (options.href === null) return null;
                    if (route.name === "UserListScreen" && role !== "Admin") return null;
                    if (route.name === "DepartmentsScreen" && role !== "Admin") return null;

                    const isFocused = state.index === index;
                    const activeColor = isDark ? "#4ade80" : "#2A6E3F";
                    const color = isFocused ? activeColor : colors.subtext;

                    // Маппинг данных
                    let Icon = House;
                    let label = "";
                    switch (route.name) {
                        case "DashboardScreen": Icon = House; label = "главная"; break;
                        case "EventsScreen": Icon = Calendar; label = "события"; break;
                        case "TaskBoardScreen": Icon = ListTodo; label = "задачи"; break;
                        case "CatalogScreen": Icon = Folder; label = "каталог"; break;
                        case "UsersScreen": Icon = User; label = "аккаунты"; break;
                        case "DepartmentsScreen": Icon = Building2; label = "отделы"; break;
                        default: return null;
                    }

                    return (
                        <TabButton
                            key={route.key}
                            route={route}
                            isFocused={isFocused}
                            descriptors={descriptors}
                            navigation={navigation}
                            color={color}
                            Icon={Icon}
                            label={label}
                        />
                    );
                })}
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        // На вебе используем fixed, чтобы он не уезжал при скролле контента
        position: Platform.OS === "web" ? "fixed" : "absolute",
        bottom: 0,
        left: 0, // Добавь это
        right: 0, // И это
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000, // Чтобы быть поверх всего
        // Убираем лишний paddingBottom, если он мешает,
        // но оставляем расчет через insets в самом компоненте
    },
    blurView: {
        flexDirection: "row",
        width: "90%",
        height: 65,
        borderRadius: 25,
        overflow: "hidden",
        backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.3)", // Легкий контур для эффекта стекла
    },
    tabItem: {
        flex: 1, // Растягиваем тач-зону на всю доступную ширину
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
    },
    // Новый стиль: Оболочка только для контента, который нужно масштабировать
    tabContentWrapper: {
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    labelStyle: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: "600",
    },
});
