import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

const REFRESH_HEIGHT = 80;

const CustomRefreshScrollView = ({ children, onRefresh, refreshing, contentContainerStyle }) => {
    const pullDownValue = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            // Разрешаем тянуть только вниз и если мы в самом верху (упрощенно)
            if (event.translationY > 0) {
                // Добавляем сопротивление (resistance), чтобы тянулось тяжелее
                pullDownValue.value = event.translationY * 0.5;
            }
        })
        .onEnd(() => {
            if (pullDownValue.value >= REFRESH_HEIGHT) {
                pullDownValue.value = withSpring(REFRESH_HEIGHT);
                onRefresh();
            } else {
                pullDownValue.value = withSpring(0);
            }
        })
        .activeOffsetY([0, 10]) // Порог срабатывания
        .shouldCancelWhenOutside(true);

    // КогдаRefreshing становится false извне, возвращаем скролл
    React.useEffect(() => {
        if (!refreshing) {
            pullDownValue.value = withSpring(0);
        }
    }, [refreshing]);

    const animatedContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: pullDownValue.value }],
    }));

    const indicatorStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            pullDownValue.value,
            [0, REFRESH_HEIGHT / 2, REFRESH_HEIGHT],
            [0, 0.5, 1],
            Extrapolate.CLAMP
        );
        return {
            opacity,
            transform: [
                { translateY: pullDownValue.value / 2 - 20 }, // Держим индикатор по центру зоны
                { scale: interpolate(pullDownValue.value, [0, REFRESH_HEIGHT], [0.5, 1], Extrapolate.CLAMP) }
            ],
        };
    });

    return (
        <View style={styles.wrapper}>
            {/* Индикатор обновления (лежит ПОД скроллом или в его зоне) */}
            <Animated.View style={[styles.refreshContainer, indicatorStyle]}>
                {refreshing ? (
                    <ActivityIndicator color="#2A6E3F" />
                ) : (
                    <Ionicons
                        name="arrow-down"
                        size={24}
                        color="#2A6E3F"
                        style={{ transform: [{ rotate: pullDownValue.value >= REFRESH_HEIGHT ? '180deg' : '0deg' }] }}
                    />
                )}
            </Animated.View>

            <GestureDetector gesture={panGesture}>
                <Animated.ScrollView
                    bounces={false} // Отключаем стандартный bounce, чтобы не было белых полос
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={contentContainerStyle}
                    style={[styles.scrollView, animatedContentStyle]}
                >
                    {children}
                </Animated.ScrollView>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    refreshContainer: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        height: REFRESH_HEIGHT,
        zIndex: 0,
    },
    scrollView: {
        flex: 1,
    }
});

export default CustomRefreshScrollView;
