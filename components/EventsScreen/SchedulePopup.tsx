import React, { useMemo, useRef } from 'react';
import {
    View, Text, Modal, StyleSheet, TouchableOpacity,
    ScrollView, DimensionValue, Animated, PanResponder, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventCard } from './EventCard';
import { Event } from "@/models/EventModel";
import {router} from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SchedulePopupProps {
    visible: boolean;
    onClose: () => void;
    events: Event[];
    date: string | undefined;
}

export const SchedulePopup: React.FC<SchedulePopupProps> = ({
                                                                visible,
                                                                onClose,
                                                                events,
                                                                date
                                                            }) => {
    const insets = useSafeAreaInsets();

    // Анимация позиции шторки
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Точки остановки шторки
    const MIN_HEIGHT = SCREEN_HEIGHT * 0.4; // Начальная высота (40% экрана)
    const MAX_HEIGHT = 0; // Полный экран

    const resetPositionAnim = Animated.timing(panY, {
        toValue: MIN_HEIGHT,
        duration: 300,
        useNativeDriver: false,
    });

    const closeAnim = Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: false,
    });

    const expandAnim = Animated.timing(panY, {
        toValue: MAX_HEIGHT,
        duration: 300,
        useNativeDriver: false,
    });

    // Обработка жестов
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                // Если тянем выше MAX_HEIGHT (0), добавляем сопротивление
                if (gestureState.dy + MIN_HEIGHT < 0) return;
                panY.setValue(gestureState.dy + MIN_HEIGHT);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120) {
                    // Сильный свайп вниз — закрываем
                    closeAnim.start(onClose);
                } else if (gestureState.dy < -100) {
                    // Свайп вверх — разворачиваем
                    expandAnim.start();
                } else {
                    // Возвращаем в исходное (40% экрана)
                    resetPositionAnim.start();
                }
            },
        })
    ).current;

    // Сброс позиции при открытии
    React.useEffect(() => {
        if (visible) {
            resetPositionAnim.start();
        }
    }, [visible]);

    const formattedDate = useMemo(() => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }, [date]);

    const progressHeight = useMemo((): DimensionValue => {
        if (!date) return '0%';
        const now = new Date();
        const eventDay = new Date(date);
        if (now.toDateString() !== eventDay.toDateString()) {
            return now > eventDay ? '100%' : '0%';
        }
        const percentage = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
        return `${percentage}%` as DimensionValue;
    }, [date, visible]);

    const topStyle = {
        transform: [{ translateY: panY }]
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismiss}
                    activeOpacity={1}
                    onPress={() => closeAnim.start(onClose)}
                />

                <Animated.View
                    style={[styles.sheet, topStyle, { paddingBottom: insets.bottom + 20 }]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.dragIndicator} />

                    <Text style={styles.title}>Расписание на {formattedDate}</Text>

                    <View style={styles.timelineContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { height: progressHeight }]} />
                            {progressHeight !== '0%' && progressHeight !== '100%' && (
                                <View style={[styles.progressDot, { top: progressHeight }]} />
                            )}
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {events.length > 0 ? (
                                events
                                    .sort((a, b) => a.start_at.localeCompare(b.start_at))
                                    .map((ev, idx) => (
                                        <View key={ev.id} style={styles.cardWrapper}>
                                            <EventCard
                                                event={ev}
                                                index={idx}
                                                onPress={() => router.push({ pathname: '/(screens)/EventDetailsScreen', params: { id: ev.id } })}
                                            />
                                        </View>
                                    ))
                            ) : (
                                <Text style={styles.noEvents}>Событий нет</Text>
                            )}
                        </ScrollView>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismiss: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT, // Полная высота для возможности развертывания
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        elevation: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b2340',
        marginBottom: 20,
        textAlign: 'center'
    },
    timelineContainer: {
        flex: 1, // Теперь контейнер занимает все место в шторке
        flexDirection: 'row',
    },
    progressBarBg: {
        width: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
        marginRight: 16,
        position: 'relative',
        marginVertical: 10,
    },
    progressBarFill: {
        width: '100%',
        backgroundColor: '#2A6E3F',
        borderRadius: 2,
    },
    progressDot: {
        position: 'absolute',
        left: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2A6E3F',
        borderWidth: 2,
        borderColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 100, // Запас для прокрутки
    },
    cardWrapper: {
        marginBottom: 12,
    },
    noEvents: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 40,
        flex: 1,
    },
});
