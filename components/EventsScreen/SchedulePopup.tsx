import React, { useMemo, useRef } from 'react';
import {
    View, Text, Modal, StyleSheet, TouchableOpacity,
    ScrollView, DimensionValue, Animated, PanResponder, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventCard } from './EventCard';
import { Event } from "@/models/EventModel";
import { router } from "expo-router";

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

    // Начальная точка появления шторки (например, 40% от верха экрана)
    const START_Y = SCREEN_HEIGHT * 0.2;
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const resetPositionAnim = Animated.timing(panY, {
        toValue: START_Y,
        duration: 300,
        useNativeDriver: false, // Изменено на false
    });

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: false, // Изменено на false
    }).start(callback);

    // Обработка нажатия на элемент
    const handleEventPress = (eventId: string) => {
        // Сначала запускаем анимацию закрытия, потом выполняем переход и onClose
        closeAnim(() => {
            onClose();
            router.push({ pathname: '/(screens)/EventDetailsScreen', params: { id: eventId } });
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                // Теперь это не будет вызывать ошибку
                if (gestureState.dy < 0) return;
                panY.setValue(START_Y + gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150) {
                    // Если протащили вниз достаточно сильно — закрываем
                    closeAnim(onClose);
                } else {
                    // Иначе возвращаем в исходную точку (START_Y)
                    resetPositionAnim.start();
                }
            },
        })
    ).current;

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

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeAnim(onClose)}>
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismiss}
                    activeOpacity={1}
                    onPress={() => closeAnim(onClose)}
                />

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY: panY }], paddingBottom: insets.bottom + 20 }
                    ]}
                >
                    {/* Хендл для перетаскивания (только эта часть инициирует жест) */}
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.title}>Расписание на {formattedDate}</Text>
                    </View>

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
                                                onPress={() => handleEventPress(ev.id)}
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
    },
    dismiss: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT, // Оставляем высоту, чтобы фон не обрывался при движении вниз
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        elevation: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    dragArea: {
        paddingTop: 12,
        paddingBottom: 4,
        width: '100%',
        alignItems: 'center',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b2340',
        marginBottom: 10,
        textAlign: 'center'
    },
    timelineContainer: {
        flex: 1,
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
        paddingBottom: 150,
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
