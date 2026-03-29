import React from "react";
import { Platform, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Calendar, Folder, House, ListTodo, User } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

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
    return (
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
            <BlurView
                intensity={30}
                tint="light"
                style={styles.blurView}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    // Фильтрация
                    if (options.href === null) return null;
                    if (route.name === "UserListScreen" && role !== "Admin") return null;

                    const isFocused = state.index === index;
                    const color = isFocused ? "#11631b" : "#484f56";

                    // Маппинг данных
                    let Icon = House;
                    let label = "";
                    switch (route.name) {
                        case "DashboardScreen": Icon = House; label = "главная"; break;
                        case "EventsScreen": Icon = Calendar; label = "события"; break;
                        case "TaskBoardScreen": Icon = ListTodo; label = "задачи"; break;
                        case "CatalogScreen": Icon = Folder; label = "каталог"; break;
                        case "UserListScreen": Icon = User; label = "аккаунты"; break;
                        default: return null;
                    }

                    // 4. Рендерим анимированный компонент вкладки
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
        position: "absolute",
        bottom: 0,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
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
