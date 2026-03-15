import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Event } from "@/models/EventModel";

// Стили типов событий
const getEventTypeStyles = (type: string, isPast: boolean) => {
    if (isPast) return { label: 'Завершено', color: '#6e7378', bg: '#f1f5f9' };
    switch (type) {
        case 'Meeting': return { label: 'Заседание', color: '#6e7378', bg: '#E5F1FF' };
        case 'Commission': return { label: 'Комиссия', color: '#6e7378', bg: '#FFF4E5' };
        default: return { label: 'Событие', color: '#6e7378', bg: '#EBFDEB' };
    }
};

interface EventCardProps {
    event: Event;
    index?: number;
    onPress?: (event: Event) => void; // Опционально для открытия деталей извне
}

export const EventCard: React.FC<EventCardProps> = ({ event, index = 0, onPress }) => {
    const slideAnim = useRef(new Animated.Value(30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const isPast = useMemo(() => new Date(event.end_at) < new Date(), [event.end_at]);
    const typeStyle = getEventTypeStyles(event.type, isPast);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 350,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const startTime = useMemo(() => formatTime(event.start_at), [event.start_at]);
    const endTime = useMemo(() => formatTime(event.end_at), [event.end_at]);

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPress?.(event)}
                style={[styles.cardInner, isPast && styles.pastCard]}
            >
                {/* Левая часть: Время */}
                <View style={styles.timeSection}>
                    <Text style={[styles.timeText, isPast && styles.pastText]}>{startTime}</Text>
                    <View style={styles.timeDivider} />
                    <Text style={[styles.timeTextEnd, isPast && styles.pastText]}>{endTime}</Text>
                </View>

                {/* Основная часть: Инфо */}
                <View style={styles.infoSection}>
                    <Text style={[styles.title, isPast && styles.pastText]} numberOfLines={2}>
                        {event.title}
                    </Text>
                    <View style={styles.headerRow}>
                        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                            <Text style={[styles.typeText, { color: typeStyle.color }]}>
                                {typeStyle.label}
                            </Text>
                        </View>
                    </View>
                    {event.location && (
                        <Text style={styles.location} numberOfLines={1}>
                            {event.location.split('|')[0].trim()}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 10,
    },
    cardInner: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    pastCard: {
        backgroundColor: '#f8fafc',
        borderColor: '#f1f5f9',
    },
    timeSection: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9',
        marginRight: 12,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0b2340',
    },
    timeTextEnd: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    timeDivider: {
        height: 1,
        width: 10,
        backgroundColor: '#e2e8f0',
        marginVertical: 2,
    },
    infoSection: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    typeBadge: {
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '500',

    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        lineHeight: 20,
        marginBottom: 2,
    },
    location: {
        fontSize: 12,
        color: '#64748b',
    },
    pastText: {
        color: '#94a3b8',
    },
});
